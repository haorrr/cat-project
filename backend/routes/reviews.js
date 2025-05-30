// routes/reviews.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { commonValidation, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const reviewsRouter = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
reviewsRouter.get('/', optionalAuth, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { approved_only, rating, booking_id } = req.query;

        let whereClauses = [];
        let params = [];

        // Default to approved only unless admin
        if (approved_only !== 'false' && (!req.user || req.user.role !== 'admin')) {
            whereClauses.push('r.is_approved = TRUE');
        }

        if (rating) {
            whereClauses.push('r.rating = ?');
            params.push(rating);
        }

        if (booking_id) {
            whereClauses.push('r.booking_id = ?');
            params.push(booking_id);
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const reviewsSql = `
            SELECT 
                r.*,
                u.full_name as customer_name,
                u.avatar as customer_avatar,
                rm.name as room_name,
                rm.room_type,
                c.name as cat_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN bookings b ON r.booking_id = b.id
            JOIN rooms rm ON b.room_id = rm.id
            JOIN cats c ON b.cat_id = c.id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN bookings b ON r.booking_id = b.id
            ${whereClause}
        `;

        const reviews = await query(reviewsSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching reviews'
        });
    }
});

// @route   POST /api/reviews
// @desc    Create review
// @access  Private
reviewsRouter.post('/', authenticateToken, [
    body('booking_id').isInt().withMessage('Valid booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { booking_id, rating, comment } = req.body;

        // Verify booking ownership and status
        const booking = await query(
            'SELECT user_id, status FROM bookings WHERE id = ?',
            [booking_id]
        );

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only review your own bookings'
            });
        }

        if (booking[0].status !== 'checked_out') {
            return res.status(400).json({
                success: false,
                message: 'You can only review completed bookings'
            });
        }

        // Check if review already exists
        const existingReview = await query(
            'SELECT id FROM reviews WHERE booking_id = ?',
            [booking_id]
        );

        if (existingReview.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Review already exists for this booking'
            });
        }

        // Create review
        const sql = `
            INSERT INTO reviews (booking_id, user_id, rating, comment, is_approved)
            VALUES (?, ?, ?, ?, TRUE)
        `;

        const result = await query(sql, [booking_id, req.user.id, rating, comment]);

        // Get created review with details
        const newReview = await query(`
            SELECT 
                r.*,
                u.full_name as customer_name,
                rm.name as room_name,
                c.name as cat_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN bookings b ON r.booking_id = b.id
            JOIN rooms rm ON b.room_id = rm.id
            JOIN cats c ON b.cat_id = c.id
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: {
                review: newReview[0]
            }
        });

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating review'
        });
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update review (Owner or Admin)
// @access  Private
reviewsRouter.put('/:id', authenticateToken, [
    ...commonValidation.id,
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { rating, comment, is_approved } = req.body;

        // Get review
        const review = await query('SELECT user_id FROM reviews WHERE id = ?', [reviewId]);
        
        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check permission
        if (req.user.role !== 'admin' && review[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update review
        const sql = `
            UPDATE reviews SET
                rating = COALESCE(?, rating),
                comment = COALESCE(?, comment),
                is_approved = COALESCE(?, is_approved),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await query(sql, [rating, comment, is_approved, reviewId]);

        // Get updated review
        const updatedReview = await query(`
            SELECT 
                r.*,
                u.full_name as customer_name,
                rm.name as room_name,
                c.name as cat_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN bookings b ON r.booking_id = b.id
            JOIN rooms rm ON b.room_id = rm.id
            JOIN cats c ON b.cat_id = c.id
            WHERE r.id = ?
        `, [reviewId]);

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: {
                review: updatedReview[0]
            }
        });

    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating review'
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review (Owner or Admin)
// @access  Private
reviewsRouter.delete('/:id', authenticateToken, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Get review
        const review = await query('SELECT user_id FROM reviews WHERE id = ?', [reviewId]);
        
        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check permission
        if (req.user.role !== 'admin' && review[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete review
        await query('DELETE FROM reviews WHERE id = ?', [reviewId]);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting review'
        });
    }
});

// @route   GET /api/reviews/stats
// @desc    Get review statistics
// @access  Public
reviewsRouter.get('/stats', async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE is_approved = TRUE
        `);

        res.status(200).json({
            success: true,
            data: {
                stats: stats[0]
            }
        });

    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching review statistics'
        });
    }
});

module.exports = reviewsRouter;