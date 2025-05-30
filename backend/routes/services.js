// routes/services.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { commonValidation, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', optionalAuth, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { category, active_only } = req.query;

        let whereClauses = [];
        let params = [];

        if (category) {
            whereClauses.push('category = ?');
            params.push(category);
        }

        if (active_only === 'true') {
            whereClauses.push('is_active = TRUE');
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const servicesSql = `
            SELECT *
            FROM services
            ${whereClause}
            ORDER BY category ASC, name ASC
            LIMIT ${offset}, ${limit}
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM services
            ${whereClause}
        `;

        const services = await query(servicesSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                services,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching services'
        });
    }
});

// @route   POST /api/services
// @desc    Create new service (Admin only)
// @access  Private/Admin
router.post('/', authenticateToken, requireAdmin, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isIn(['grooming', 'medical', 'play', 'training', 'special']).withMessage('Invalid category'),
    body('duration_minutes').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer')
], handleValidationErrors, async (req, res) => {
    try {
        const { name, description, price, duration_minutes, category } = req.body;

        const sql = `
            INSERT INTO services (name, description, price, duration_minutes, category)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [name, description, price, duration_minutes, category]);
        const newService = await query('SELECT * FROM services WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: {
                service: newService[0]
            }
        });

    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating service'
        });
    }
});

// @route   PUT /api/services/:id
// @desc    Update service (Admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, requireAdmin, [
    ...commonValidation.id,
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().isIn(['grooming', 'medical', 'play', 'training', 'special']).withMessage('Invalid category')
], handleValidationErrors, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { name, description, price, duration_minutes, category, is_active } = req.body;

        const sql = `
            UPDATE services SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                duration_minutes = COALESCE(?, duration_minutes),
                category = COALESCE(?, category),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const result = await query(sql, [name, description, price, duration_minutes, category, is_active, serviceId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        const updatedService = await query('SELECT * FROM services WHERE id = ?', [serviceId]);

        res.status(200).json({
            success: true,
            message: 'Service updated successfully',
            data: {
                service: updatedService[0]
            }
        });

    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating service'
        });
    }
});

// @route   DELETE /api/services/:id
// @desc    Delete service (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const serviceId = req.params.id;

        // Check if service is used in bookings
        const usageCheck = await query(
            'SELECT COUNT(*) as count FROM booking_services WHERE service_id = ?',
            [serviceId]
        );

        if (usageCheck[0].count > 0) {
            // Soft delete instead of hard delete
            await query(
                'UPDATE services SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [serviceId]
            );

            return res.status(200).json({
                success: true,
                message: 'Service deactivated successfully (cannot delete due to existing bookings)'
            });
        }

        // Hard delete if no usage
        const result = await query('DELETE FROM services WHERE id = ?', [serviceId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting service'
        });
    }
});

module.exports = router;