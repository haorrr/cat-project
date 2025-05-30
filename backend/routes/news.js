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