// routes/foods.js - FIXED VERSION
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { commonValidation, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const foodRouter = express.Router();

// Helper function to safely parse JSON
const safeJsonParse = (jsonString, defaultValue = null) => {
    try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
};

// @route   GET /api/foods
// @desc    Get all foods
// @access  Public
foodRouter.get('/', async (req, res) => {
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

        // Fixed SQL with template literals for LIMIT
        const foodsSql = `
            SELECT *
            FROM foods
            ${whereClause}
            ORDER BY category ASC, brand ASC, name ASC
            LIMIT ${offset}, ${limit}
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM foods
            ${whereClause}
        `;

        const foods = await query(foodsSql, params);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        // Process nutritional_info safely
        const processedFoods = foods.map(food => ({
            ...food,
            nutritional_info: safeJsonParse(food.nutritional_info, {})
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
            message: 'Server error while fetching foods',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    body('brand').optional().isLength({ max: 50 }).withMessage('Brand must be less than 50 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('ingredients').optional().isLength({ max: 1000 }).withMessage('Ingredients too long')
], handleValidationErrors, async (req, res) => {
    try {
        const { 
            name, 
            brand = null, 
            description = null, 
            price_per_serving, 
            category, 
            ingredients = null, 
            nutritional_info = null 
        } = req.body;

        // Safely stringify nutritional_info
        const nutritionalInfoJson = nutritional_info ? JSON.stringify(nutritional_info) : null;

        const sql = `
            INSERT INTO foods (name, brand, description, price_per_serving, category, ingredients, nutritional_info, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
        `;

        const result = await query(sql, [
            name,
            brand,
            description,
            price_per_serving,
            category,
            ingredients,
            nutritionalInfoJson
        ]);

        // Get the created food
        const newFood = await query('SELECT * FROM foods WHERE id = ?', [result.insertId]);
        
        if (!newFood || newFood.length === 0) {
            throw new Error('Failed to retrieve created food');
        }

        // Process response
        const food = {
            ...newFood[0],
            nutritional_info: safeJsonParse(newFood[0].nutritional_info, {})
        };

        res.status(201).json({
            success: true,
            message: 'Food created successfully',
            data: { food }
        });

    } catch (error) {
        console.error('Create food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/foods/:id
// @desc    Update food (Admin only)
// @access  Private/Admin
foodRouter.put('/:id', authenticateToken, requireAdmin, [
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('price_per_serving').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().isIn(['dry', 'wet', 'treats', 'prescription']).withMessage('Invalid category'),
    body('brand').optional().isLength({ max: 50 }).withMessage('Brand must be less than 50 characters'),
    body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const foodId = parseInt(req.params.id);
        
        if (!foodId || foodId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid food ID'
            });
        }

        // Check if food exists
        const existingFood = await query('SELECT * FROM foods WHERE id = ?', [foodId]);
        if (!existingFood || existingFood.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        const { 
            name, 
            brand, 
            description, 
            price_per_serving, 
            category, 
            ingredients, 
            nutritional_info, 
            is_active 
        } = req.body;

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (brand !== undefined) {
            updateFields.push('brand = ?');
            updateValues.push(brand);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (price_per_serving !== undefined) {
            updateFields.push('price_per_serving = ?');
            updateValues.push(price_per_serving);
        }
        if (category !== undefined) {
            updateFields.push('category = ?');
            updateValues.push(category);
        }
        if (ingredients !== undefined) {
            updateFields.push('ingredients = ?');
            updateValues.push(ingredients);
        }
        if (nutritional_info !== undefined) {
            updateFields.push('nutritional_info = ?');
            updateValues.push(nutritional_info ? JSON.stringify(nutritional_info) : null);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add updated_at and food ID
        updateFields.push('updated_at = NOW()');
        updateValues.push(foodId);

        const sql = `UPDATE foods SET ${updateFields.join(', ')} WHERE id = ?`;

        const result = await query(sql, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Food not found or no changes made'
            });
        }

        // Get updated food
        const updatedFood = await query('SELECT * FROM foods WHERE id = ?', [foodId]);
        
        res.status(200).json({
            success: true,
            message: 'Food updated successfully',
            data: {
                food: {
                    ...updatedFood[0],
                    nutritional_info: safeJsonParse(updatedFood[0].nutritional_info, {})
                }
            }
        });

    } catch (error) {
        console.error('Update food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   DELETE /api/foods/:id
// @desc    Delete food (Admin only)
// @access  Private/Admin
foodRouter.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const foodId = parseInt(req.params.id);
        
        if (!foodId || foodId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid food ID'
            });
        }

        // Check if food exists
        const existingFood = await query('SELECT * FROM foods WHERE id = ?', [foodId]);
        if (!existingFood || existingFood.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        // Check if food is used in bookings (if table exists)
        try {
            const usageCheck = await query(
                'SELECT COUNT(*) as count FROM booking_foods WHERE food_id = ?',
                [foodId]
            );

            if (usageCheck[0].count > 0) {
                // Soft delete instead of hard delete
                await query(
                    'UPDATE foods SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
                    [foodId]
                );

                return res.status(200).json({
                    success: true,
                    message: 'Food deactivated successfully (cannot delete due to existing bookings)'
                });
            }
        } catch (tableError) {
            // booking_foods table might not exist, continue with hard delete
            console.log('booking_foods table not found, proceeding with hard delete');
        }

        // Hard delete if no usage or table doesn't exist
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
            message: 'Server error while deleting food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/foods/:id
// @desc    Get single food
// @access  Public
foodRouter.get('/:id', async (req, res) => {
    try {
        const foodId = parseInt(req.params.id);
        
        if (!foodId || foodId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid food ID'
            });
        }

        const food = await query('SELECT * FROM foods WHERE id = ?', [foodId]);
        
        if (!food || food.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                food: {
                    ...food[0],
                    nutritional_info: safeJsonParse(food[0].nutritional_info, {})
                }
            }
        });

    } catch (error) {
        console.error('Get food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = foodRouter;