const express = require('express');
const moment = require('moment');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { bookingValidation, commonValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get bookings (user's bookings or all for admin)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { status, start_date, end_date, room_id, cat_id } = req.query;

        let whereClauses = [];
        let params = [];

        // Admin can see all bookings, customers only their own
        if (req.user.role === 'admin') {
            if (req.query.user_id) {
                whereClauses.push('b.user_id = ?');
                params.push(req.query.user_id);
            }
        } else {
            whereClauses.push('b.user_id = ?');
            params.push(req.user.id);
        }

        // Filter by status
        if (status) {
            whereClauses.push('b.status = ?');
            params.push(status);
        }

        // Filter by date range
        if (start_date) {
            whereClauses.push('b.check_out_date >= ?');
            params.push(start_date);
        }

        if (end_date) {
            whereClauses.push('b.check_in_date <= ?');
            params.push(end_date);
        }

        // Filter by room
        if (room_id) {
            whereClauses.push('b.room_id = ?');
            params.push(room_id);
        }

        // Filter by cat
        if (cat_id) {
            whereClauses.push('b.cat_id = ?');
            params.push(cat_id);
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Get bookings with related data (using LEFT JOIN for safety)
        const bookingsSql = `
            SELECT 
                b.*,
                u.full_name as customer_name,
                u.email as customer_email,
                c.name as cat_name,
                r.name as room_name,
                r.room_type
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN cats c ON b.cat_id = c.id
            LEFT JOIN rooms r ON b.room_id = r.id
            ${whereClause}
            ORDER BY b.created_at DESC
            LIMIT ${offset}, ${limit}
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM bookings b
            ${whereClause}
        `;

        const bookings = await query(bookingsSql, params);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                bookings,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching bookings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking with full details
// @access  Private (Owner or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        
        if (!bookingId || bookingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        const sql = `
            SELECT 
                b.*,
                u.full_name as customer_name,
                u.email as customer_email,
                c.name as cat_name,
                c.breed as cat_breed,
                r.name as room_name,
                r.room_type
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN cats c ON b.cat_id = c.id
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
        `;

        const bookings = await query(sql, [bookingId]);

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];

        // Check ownership (admin can see all)
        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get booking services (if table exists)
        let services = [];
        try {
            const servicesSql = `
                SELECT 
                    bs.*,
                    s.name as service_name
                FROM booking_services bs
                LEFT JOIN services s ON bs.service_id = s.id
                WHERE bs.booking_id = ?
                ORDER BY bs.service_date ASC
            `;
            services = await query(servicesSql, [bookingId]);
        } catch (servicesError) {
            console.log('Services query error:', servicesError.message);
        }

        // Get booking foods (if table exists)
        let foods = [];
        try {
            const foodsSql = `
                SELECT 
                    bf.*,
                    f.name as food_name
                FROM booking_foods bf
                LEFT JOIN foods f ON bf.food_id = f.id
                WHERE bf.booking_id = ?
                ORDER BY bf.feeding_date ASC, bf.meal_time ASC
            `;
            foods = await query(foodsSql, [bookingId]);
        } catch (foodsError) {
            console.log('Foods query error:', foodsError.message);
        }

        res.status(200).json({
            success: true,
            data: {
                booking: {
                    ...booking,
                    services,
                    foods
                }
            }
        });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            cat_id,
            room_id,
            check_in_date,
            check_out_date,
            services = [],
            foods = [],
            special_requests
        } = req.body;

        // Validate dates
        const checkIn = moment(check_in_date);
        const checkOut = moment(check_out_date);
        const today = moment().startOf('day');

        if (checkIn.isBefore(today)) {
            return res.status(400).json({
                success: false,
                message: 'Check-in date cannot be in the past'
            });
        }

        if (checkOut.isSameOrBefore(checkIn)) {
            return res.status(400).json({
                success: false,
                message: 'Check-out date must be after check-in date'
            });
        }

        const totalDays = checkOut.diff(checkIn, 'days');

        // Verify cat ownership
        const catCheck = await query(
            'SELECT user_id FROM cats WHERE id = ? AND is_active = TRUE',
            [cat_id]
        );

        if (catCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cat not found or inactive'
            });
        }

        if (req.user.role !== 'admin' && catCheck[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only book for your own cats'
            });
        }

        // Check room availability
        const roomCheck = await query(
            'SELECT id, price_per_day, is_available FROM rooms WHERE id = ?',
            [room_id]
        );

        if (roomCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (!roomCheck[0].is_available) {
            return res.status(400).json({
                success: false,
                message: 'Room is not available'
            });
        }

        // Check for conflicting bookings
        const conflictCheck = await query(`
            SELECT COUNT(*) as count
            FROM bookings
            WHERE room_id = ? 
            AND status IN ('confirmed', 'checked_in')
            AND (
                (check_in_date <= ? AND check_out_date > ?) OR
                (check_in_date < ? AND check_out_date >= ?) OR
                (check_in_date >= ? AND check_out_date <= ?)
            )
        `, [room_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

        if (conflictCheck[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Room is not available for the selected dates'
            });
        }

        // Calculate prices
        const roomPricePerDay = roomCheck[0].price_per_day || 0;
        const roomTotalPrice = roomPricePerDay * totalDays;

        let servicesTotalPrice = 0;
        let foodsTotalPrice = 0;
        let serviceMap = {};
        let foodMap = {};

        // Validate and calculate services price
        if (services.length > 0) {
            const serviceIds = services.map(s => s.service_id);
            
            try {
                const servicesData = await query(
                    `SELECT id, price FROM services WHERE id IN (${serviceIds.map(() => '?').join(',')}) AND is_active = TRUE`,
                    serviceIds
                );

                servicesData.forEach(s => {
                    serviceMap[s.id] = s.price;
                });

                for (const service of services) {
                    if (!serviceMap[service.service_id]) {
                        return res.status(400).json({
                            success: false,
                            message: `Service ${service.service_id} not found or inactive`
                        });
                    }
                    servicesTotalPrice += serviceMap[service.service_id] * (service.quantity || 1);
                }
            } catch (serviceError) {
                console.log('Services validation error:', serviceError.message);
                serviceMap = {};
            }
        }

        // Validate and calculate foods price
        if (foods.length > 0) {
            const foodIds = foods.map(f => f.food_id);
            
            try {
                const foodsData = await query(
                    `SELECT id, price_per_serving FROM foods WHERE id IN (${foodIds.map(() => '?').join(',')}) AND is_active = TRUE`,
                    foodIds
                );

                foodsData.forEach(f => {
                    foodMap[f.id] = f.price_per_serving;
                });

                for (const food of foods) {
                    if (!foodMap[food.food_id]) {
                        return res.status(400).json({
                            success: false,
                            message: `Food ${food.food_id} not found or inactive`
                        });
                    }
                    foodsTotalPrice += foodMap[food.food_id] * (food.quantity || 1);
                }
            } catch (foodError) {
                console.log('Foods validation error:', foodError.message);
                foodMap = {};
            }
        }

        const totalPrice = roomTotalPrice + servicesTotalPrice + foodsTotalPrice;

        // Create booking
        const bookingResult = await query(`
            INSERT INTO bookings (
                user_id, cat_id, room_id, check_in_date, check_out_date,
                total_days, room_price, services_price, food_price, total_price,
                special_requests, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `, [
            req.user.id, cat_id, room_id, check_in_date, check_out_date,
            totalDays, roomTotalPrice, servicesTotalPrice, foodsTotalPrice, totalPrice,
            special_requests
        ]);

        const bookingId = bookingResult.insertId;

        // Add services if table exists
        if (services.length > 0 && Object.keys(serviceMap).length > 0) {
            try {
                for (const service of services) {
                    await query(`
                        INSERT INTO booking_services (booking_id, service_id, quantity, price, service_date, notes)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        bookingId,
                        service.service_id,
                        service.quantity || 1,
                        serviceMap[service.service_id] * (service.quantity || 1),
                        service.service_date || check_in_date,
                        service.notes || null
                    ]);
                }
            } catch (serviceInsertError) {
                console.log('Booking services insert error:', serviceInsertError.message);
            }
        }

        // Add foods if table exists
        if (foods.length > 0 && Object.keys(foodMap).length > 0) {
            try {
                for (const food of foods) {
                    await query(`
                        INSERT INTO booking_foods (booking_id, food_id, feeding_date, meal_time, quantity, price, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        bookingId,
                        food.food_id,
                        food.feeding_date,
                        food.meal_time,
                        food.quantity || 1,
                        foodMap[food.food_id] * (food.quantity || 1),
                        food.notes || null
                    ]);
                }
            } catch (foodInsertError) {
                console.log('Booking foods insert error:', foodInsertError.message);
            }
        }

        // Get the created booking with safe JOIN
        let newBooking;
        try {
            newBooking = await query(`
                SELECT 
                    b.*,
                    c.name as cat_name,
                    r.name as room_name
                FROM bookings b
                LEFT JOIN cats c ON b.cat_id = c.id
                LEFT JOIN rooms r ON b.room_id = r.id
                WHERE b.id = ?
            `, [bookingId]);
        } catch (joinError) {
            // If JOIN fails, get basic booking info
            newBooking = await query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                booking: newBooking[0] || { 
                    id: bookingId, 
                    user_id: req.user.id,
                    cat_id,
                    room_id,
                    check_in_date,
                    check_out_date,
                    total_price,
                    status: 'pending'
                }
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status (Admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { status, notes } = req.body;

        if (!bookingId || bookingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        // Validate status transitions
        const currentBooking = await query('SELECT status FROM bookings WHERE id = ?', [bookingId]);
        
        if (currentBooking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const currentStatus = currentBooking[0].status;
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['checked_in', 'cancelled'],
            'checked_in': ['checked_out'],
            'checked_out': [],
            'cancelled': []
        };

        if (status && !validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${currentStatus} to ${status}`
            });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(bookingId);

        const sql = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
        await query(sql, updateValues);

        // Get updated booking
        const updatedBooking = await query(`
            SELECT 
                b.*,
                c.name as cat_name,
                r.name as room_name,
                u.full_name as customer_name
            FROM bookings b
            LEFT JOIN cats c ON b.cat_id = c.id
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [bookingId]);

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: {
                booking: updatedBooking[0]
            }
        });

    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking
// @access  Private (Owner or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);

        if (!bookingId || bookingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        // Get booking
        const booking = await query('SELECT user_id, status FROM bookings WHERE id = ?', [bookingId]);
        
        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership
        if (req.user.role !== 'admin' && booking[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking can be cancelled
        if (!['pending', 'confirmed'].includes(booking[0].status)) {
            return res.status(400).json({
                success: false,
                message: 'Booking cannot be cancelled in current state'
            });
        }

        // Cancel booking
        await query(
            'UPDATE bookings SET status = "cancelled", updated_at = NOW() WHERE id = ?',
            [bookingId]
        );

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;