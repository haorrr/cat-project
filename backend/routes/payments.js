// routes/payments.js
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { commonValidation, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get payments (Admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { booking_id, user_id, payment_status, payment_method } = req.query;

        let whereClauses = [];
        let params = [];

        if (booking_id) {
            whereClauses.push('p.booking_id = ?');
            params.push(booking_id);
        }

        if (user_id) {
            whereClauses.push('p.user_id = ?');
            params.push(user_id);
        }

        if (payment_status) {
            whereClauses.push('p.payment_status = ?');
            params.push(payment_status);
        }

        if (payment_method) {
            whereClauses.push('p.payment_method = ?');
            params.push(payment_method);
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const paymentsSql = `
            SELECT 
                p.*,
                u.full_name as customer_name,
                u.email as customer_email,
                b.id as booking_id,
                b.total_price as booking_total,
                b.check_in_date,
                b.check_out_date
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN bookings b ON p.booking_id = b.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN bookings b ON p.booking_id = b.id
            ${whereClause}
        `;

        const payments = await query(paymentsSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                payments,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching payments'
        });
    }
});

// @route   GET /api/payments/:bookingId
// @desc    Get payment by booking ID
// @access  Private (Owner or Admin)
router.get('/:bookingId', authenticateToken, async (req, res) => {
    try {
        const bookingId = req.params.bookingId;

        // Check booking ownership
        const booking = await query('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
        
        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (req.user.role !== 'admin' && booking[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const payment = await query(`
            SELECT 
                p.*,
                b.total_price as booking_total
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.booking_id = ?
        `, [bookingId]);

        res.status(200).json({
            success: true,
            data: {
                payment: payment[0] || null
            }
        });

    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching payment'
        });
    }
});

// @route   POST /api/payments
// @desc    Process payment
// @access  Private
router.post('/', authenticateToken, [
    body('booking_id').isInt().withMessage('Valid booking ID is required'),
    body('payment_method').isIn(['cash', 'card', 'bank_transfer', 'online']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], handleValidationErrors, async (req, res) => {
    try {
        const { booking_id, payment_method, amount, transaction_id, notes } = req.body;

        await transaction(async (connection) => {
            // Verify booking ownership and get details
            const booking = await connection.execute(
                'SELECT user_id, total_price, status FROM bookings WHERE id = ?',
                [booking_id]
            );

            if (booking[0].length === 0) {
                throw new Error('Booking not found');
            }

            const bookingData = booking[0][0];

            if (req.user.role !== 'admin' && bookingData.user_id !== req.user.id) {
                throw new Error('Access denied');
            }

            // Check if payment already exists
            const existingPayment = await connection.execute(
                'SELECT id FROM payments WHERE booking_id = ?',
                [booking_id]
            );

            if (existingPayment[0].length > 0) {
                throw new Error('Payment already exists for this booking');
            }

            // Validate amount
            if (amount !== bookingData.total_price) {
                throw new Error('Payment amount does not match booking total');
            }

            // Create payment record
            const paymentResult = await connection.execute(`
                INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_id, payment_date, notes)
                VALUES (?, ?, ?, ?, 'completed', ?, NOW(), ?)
            `, [booking_id, req.user.id, amount, payment_method, transaction_id, notes]);

            // Update booking status to confirmed
            await connection.execute(
                'UPDATE bookings SET status = "confirmed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [booking_id]
            );

            return paymentResult[0].insertId;
        });

        // Get created payment
        const newPayment = await query(`
            SELECT 
                p.*,
                b.total_price as booking_total
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.id = ?
        `, [paymentId]);

        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                payment: newPayment[0]
            }
        });

    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while processing payment'
        });
    }
});

// @route   PUT /api/payments/:id/status
// @desc    Update payment status (Admin only)
// @access  Private/Admin
router.put('/:id/status', authenticateToken, requireAdmin, [
    body('payment_status').isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status')
], handleValidationErrors, async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { payment_status, notes } = req.body;

        const result = await query(`
            UPDATE payments 
            SET payment_status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [payment_status, notes, paymentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const updatedPayment = await query('SELECT * FROM payments WHERE id = ?', [paymentId]);

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: {
                payment: updatedPayment[0]
            }
        });

    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating payment status'
        });
    }
});

module.exports = router;

