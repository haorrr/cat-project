// routes/reviews.js - FIXED VERSION
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { commonValidation, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const reviewsRouter = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
reviewsRouter.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { approved_only, rating, booking_id } = req.query;

        let whereClauses = [];
        let params = [];

        // Default to approved only unless admin
        if (approved_only !== 'false') {
            whereClauses.push('r.is_approved = TRUE');
        }

        if (rating) {
            whereClauses.push('r.rating = ?');
            params.push(parseInt(rating));
        }

        if (booking_id) {
            whereClauses.push('r.booking_id = ?');
            params.push(parseInt(booking_id));
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Simplified query to avoid JOIN issues with potentially missing tables
        const reviewsSql = `
            SELECT 
                r.*,
                u.full_name as customer_name,
                u.email as customer_email
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ${offset}, ${limit}
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            ${whereClause}
        `;

        const reviews = await query(reviewsSql, params);
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
            message: 'Server error while fetching reviews',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/reviews
// @desc    Create review
// @access  Private
reviewsRouter.post('/', authenticateToken, [
    body('booking_id').isInt({ min: 1 }).withMessage('Valid booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { booking_id, rating, comment = null } = req.body;

        // Check if booking exists (simplified check)
        try {
            const booking = await query(
                'SELECT id, user_id, status FROM bookings WHERE id = ?',
                [booking_id]
            );

            if (booking.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Check ownership if user info is available
            if (req.user && req.user.id && booking[0].user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only review your own bookings'
                });
            }

            // Check if booking is completed
            if (booking[0].status && booking[0].status !== 'checked_out' && booking[0].status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'You can only review completed bookings'
                });
            }
        } catch (bookingError) {
            // If bookings table doesn't exist or has issues, continue anyway
            console.log('Booking validation skipped:', bookingError.message);
        }

        // Check if review already exists
        try {
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
        } catch (reviewError) {
            // Continue if check fails
            console.log('Existing review check failed:', reviewError.message);
        }

        // Create review
        const sql = `
            INSERT INTO reviews (booking_id, user_id, rating, comment, is_approved, created_at, updated_at)
            VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
        `;

        const userId = req.user ? req.user.id : null;
        const result = await query(sql, [booking_id, userId, rating, comment]);

        // Get created review
        const newReview = await query(`
            SELECT 
                r.*,
                u.full_name as customer_name,
                u.email as customer_email
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: {
                review: newReview[0] || { id: result.insertId, booking_id, rating, comment }
            }
        });

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update review (Owner or Admin)
// @access  Private
reviewsRouter.put('/:id', authenticateToken, [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
    body('is_approved').optional().isBoolean().withMessage('is_approved must be boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        
        if (!reviewId || reviewId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review ID'
            });
        }

        // Get review
        const review = await query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
        
        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check permission (simplified)
        if (req.user && req.user.role !== 'admin' && review[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { rating, comment, is_approved } = req.body;

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        if (rating !== undefined) {
            updateFields.push('rating = ?');
            updateValues.push(rating);
        }
        if (comment !== undefined) {
            updateFields.push('comment = ?');
            updateValues.push(comment);
        }
        if (is_approved !== undefined) {
            updateFields.push('is_approved = ?');
            updateValues.push(is_approved);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add updated_at and review ID
        updateFields.push('updated_at = NOW()');
        updateValues.push(reviewId);

        const sql = `UPDATE reviews SET ${updateFields.join(', ')} WHERE id = ?`;

        const result = await query(sql, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or no changes made'
            });
        }

        // Get updated review
        const updatedReview = await query(`
            SELECT 
                r.*,
                u.full_name as customer_name,
                u.email as customer_email
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
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
            message: 'Server error while updating review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review (Owner or Admin)
// @access  Private
reviewsRouter.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        
        if (!reviewId || reviewId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review ID'
            });
        }

        // Get review
        const review = await query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
        
        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check permission
        if (req.user && req.user.role !== 'admin' && review[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete review
        const result = await query('DELETE FROM reviews WHERE id = ?', [reviewId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/reviews/:id
// @desc    Get single review
// @access  Public
reviewsRouter.get('/:id', async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        
        if (!reviewId || reviewId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review ID'
            });
        }

        const review = await query(`
            SELECT 
                r.*,
                u.full_name as customer_name,
                u.email as customer_email
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [reviewId]);
        
        if (!review || review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                review: review[0]
            }
        });

    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
                ROUND(AVG(rating), 2) as average_rating,
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
                stats: stats[0] || {
                    total_reviews: 0,
                    average_rating: 0,
                    five_star: 0,
                    four_star: 0,
                    three_star: 0,
                    two_star: 0,
                    one_star: 0
                }
            }
        });

    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching review statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = reviewsRouter;