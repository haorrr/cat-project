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
            LIMIT ? OFFSET ?
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

// routes/news.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { newsValidation, commonValidation, handleValidationErrors } = require('../middleware/validation');

const newsRouter = express.Router();

// Helper function to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};

// @route   GET /api/news
// @desc    Get all published news
// @access  Public
newsRouter.get('/', optionalAuth, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { category, search, published_only } = req.query;

        let whereClauses = [];
        let params = [];

        // Default to published only unless admin
        if (published_only !== 'false' && (!req.user || req.user.role !== 'admin')) {
            whereClauses.push('n.is_published = TRUE');
        }

        if (category) {
            whereClauses.push('n.category = ?');
            params.push(category);
        }

        if (search) {
            whereClauses.push('(n.title LIKE ? OR n.excerpt LIKE ? OR n.content LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const newsSql = `
            SELECT 
                n.*,
                u.full_name as author_name
            FROM news n
            JOIN users u ON n.author_id = u.id
            ${whereClause}
            ORDER BY n.published_at DESC, n.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM news n
            JOIN users u ON n.author_id = u.id
            ${whereClause}
        `;

        const news = await query(newsSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                news,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching news'
        });
    }
});

// @route   GET /api/news/:id
// @desc    Get single news article
// @access  Public
newsRouter.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const isSlug = isNaN(id);

        const sql = `
            SELECT 
                n.*,
                u.full_name as author_name,
                u.email as author_email
            FROM news n
            JOIN users u ON n.author_id = u.id
            WHERE ${isSlug ? 'n.slug' : 'n.id'} = ?
        `;

        const articles = await query(sql, [id]);

        if (articles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        const article = articles[0];

        // Check if user can view unpublished articles
        if (!article.is_published && (!req.user || req.user.role !== 'admin')) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        // Increment view count
        await query('UPDATE news SET views = views + 1 WHERE id = ?', [article.id]);
        article.views = article.views + 1;

        res.status(200).json({
            success: true,
            data: {
                article
            }
        });

    } catch (error) {
        console.error('Get news article error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching article'
        });
    }
});

// @route   POST /api/news
// @desc    Create new news article (Admin only)
// @access  Private/Admin
newsRouter.post('/', authenticateToken, requireAdmin, newsValidation.create, handleValidationErrors, async (req, res) => {
    try {
        const { title, content, excerpt, featured_image, category, is_published } = req.body;

        // Generate unique slug
        let slug = generateSlug(title);
        const existingSlug = await query('SELECT id FROM news WHERE slug = ?', [slug]);
        
        if (existingSlug.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        const sql = `
            INSERT INTO news (title, slug, content, excerpt, featured_image, category, author_id, is_published, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const publishedAt = is_published ? new Date() : null;

        const result = await query(sql, [
            title,
            slug,
            content,
            excerpt,
            featured_image,
            category,
            req.user.id,
            is_published || false,
            publishedAt
        ]);

        const newArticle = await query(`
            SELECT 
                n.*,
                u.full_name as author_name
            FROM news n
            JOIN users u ON n.author_id = u.id
            WHERE n.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Article created successfully',
            data: {
                article: newArticle[0]
            }
        });

    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating article'
        });
    }
});

// @route   PUT /api/news/:id
// @desc    Update news article (Admin only)
// @access  Private/Admin
newsRouter.put('/:id', authenticateToken, requireAdmin, newsValidation.update, handleValidationErrors, async (req, res) => {
    try {
        const articleId = req.params.id;
        const { title, content, excerpt, featured_image, category, is_published } = req.body;

        // Get current article
        const currentArticle = await query('SELECT slug, is_published FROM news WHERE id = ?', [articleId]);
        
        if (currentArticle.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        let slug = currentArticle[0].slug;
        let publishedAt = null;

        // Generate new slug if title changed
        if (title) {
            const newSlug = generateSlug(title);
            if (newSlug !== slug) {
                const existingSlug = await query('SELECT id FROM news WHERE slug = ? AND id != ?', [newSlug, articleId]);
                if (existingSlug.length === 0) {
                    slug = newSlug;
                } else {
                    slug = `${newSlug}-${Date.now()}`;
                }
            }
        }

        // Set published_at if publishing for first time
        if (is_published && !currentArticle[0].is_published) {
            publishedAt = new Date();
        }

        const sql = `
            UPDATE news SET
                title = COALESCE(?, title),
                slug = ?,
                content = COALESCE(?, content),
                excerpt = COALESCE(?, excerpt),
                featured_image = COALESCE(?, featured_image),
                category = COALESCE(?, category),
                is_published = COALESCE(?, is_published),
                published_at = COALESCE(?, published_at),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await query(sql, [
            title,
            slug,
            content,
            excerpt,
            featured_image,
            category,
            is_published,
            publishedAt,
            articleId
        ]);

        const updatedArticle = await query(`
            SELECT 
                n.*,
                u.full_name as author_name
            FROM news n
            JOIN users u ON n.author_id = u.id
            WHERE n.id = ?
        `, [articleId]);

        res.status(200).json({
            success: true,
            message: 'Article updated successfully',
            data: {
                article: updatedArticle[0]
            }
        });

    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating article'
        });
    }
});

// @route   DELETE /api/news/:id
// @desc    Delete news article (Admin only)
// @access  Private/Admin
newsRouter.delete('/:id', authenticateToken, requireAdmin, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const articleId = req.params.id;

        const result = await query('DELETE FROM news WHERE id = ?', [articleId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Article deleted successfully'
        });

    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting article'
        });
    }
});

module.exports = newsRouter;