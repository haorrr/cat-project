// routes/foods.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { commonValidation, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const foodRouter = express.Router();

// @route   GET /api/foods
// @desc    Get all foods
// @access  Public
foodRouter.get('/', optionalAuth, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { category, brand, active_only } = req.query;

        let whereClauses = [];
        let params = [];

        if (category) {
            whereClauses.push('category = ?');
            params.push(category);
        }

        if (brand) {
            whereClauses.push('brand = ?');
            params.push(brand);
        }

        if (active_only === 'true') {
            whereClauses.push('is_active = TRUE');
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const foodsSql = `
            SELECT *
            FROM foods
            ${whereClause}
            ORDER BY category ASC, brand ASC, name ASC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM foods
            ${whereClause}
        `;

        const foods = await query(foodsSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        // Parse nutritional_info JSON
        const processedFoods = foods.map(food => ({
            ...food,
            nutritional_info: food.nutritional_info ? JSON.parse(food.nutritional_info) : null
        }));

        res.status(200).json({
            success: true,
            data: {
                foods: processedFoods,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get foods error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching foods'
        });
    }
});

// @route   POST /api/foods
// @desc    Create new food (Admin only)
// @access  Private/Admin
foodRouter.post('/', authenticateToken, requireAdmin, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('price_per_serving').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isIn(['dry', 'wet', 'treats', 'prescription']).withMessage('Invalid category'),
    body('brand').optional().isLength({ max: 50 }).withMessage('Brand must be less than 50 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { name, brand, description, price_per_serving, category, ingredients, nutritional_info } = req.body;

        const sql = `
            INSERT INTO foods (name, brand, description, price_per_serving, category, ingredients, nutritional_info)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            name,
            brand,
            description,
            price_per_serving,
            category,
            ingredients,
            nutritional_info ? JSON.stringify(nutritional_info) : null
        ]);

        const newFood = await query('SELECT * FROM foods WHERE id = ?', [result.insertId]);
        
        // Parse nutritional_info for response
        const food = {
            ...newFood[0],
            nutritional_info: newFood[0].nutritional_info ? JSON.parse(newFood[0].nutritional_info) : null
        };

        res.status(201).json({
            success: true,
            message: 'Food created successfully',
            data: {
                food
            }
        });

    } catch (error) {
        console.error('Create food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating food'
        });
    }
});

// @route   PUT /api/foods/:id
// @desc    Update food (Admin only)
// @access  Private/Admin
foodRouter.put('/:id', authenticateToken, requireAdmin, [
    ...commonValidation.id,
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('price_per_serving').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().isIn(['dry', 'wet', 'treats', 'prescription']).withMessage('Invalid category')
], handleValidationErrors, async (req, res) => {
    try {
        const foodId = req.params.id;
        const { name, brand, description, price_per_serving, category, ingredients, nutritional_info, is_active } = req.body;

        const sql = `
            UPDATE foods SET
                name = COALESCE(?, name),
                brand = COALESCE(?, brand),
                description = COALESCE(?, description),
                price_per_serving = COALESCE(?, price_per_serving),
                category = COALESCE(?, category),
                ingredients = COALESCE(?, ingredients),
                nutritional_info = COALESCE(?, nutritional_info),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const result = await query(sql, [
            name,
            brand,
            description,
            price_per_serving,
            category,
            ingredients,
            nutritional_info ? JSON.stringify(nutritional_info) : null,
            is_active,
            foodId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        const updatedFood = await query('SELECT * FROM foods WHERE id = ?', [foodId]);
        
        res.status(200).json({
            success: true,
            message: 'Food updated successfully',
            data: {
                food: {
                    ...updatedFood[0],
                    nutritional_info: updatedFood[0].nutritional_info ? JSON.parse(updatedFood[0].nutritional_info) : null
                }
            }
        });

    } catch (error) {
        console.error('Update food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating food'
        });
    }
});

// @route   DELETE /api/foods/:id
// @desc    Delete food (Admin only)
// @access  Private/Admin
foodRouter.delete('/:id', authenticateToken, requireAdmin, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const foodId = req.params.id;

        // Check if food is used in bookings
        const usageCheck = await query(
            'SELECT COUNT(*) as count FROM booking_foods WHERE food_id = ?',
            [foodId]
        );

        if (usageCheck[0].count > 0) {
            // Soft delete instead of hard delete
            await query(
                'UPDATE foods SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [foodId]
            );

            return res.status(200).json({
                success: true,
                message: 'Food deactivated successfully (cannot delete due to existing bookings)'
            });
        }

        // Hard delete if no usage
        const result = await query('DELETE FROM foods WHERE id = ?', [foodId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Food deleted successfully'
        });

    } catch (error) {
        console.error('Delete food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting food'
        });
    }
});

module.exports = foodRouter;