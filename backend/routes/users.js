// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { userValidation, commonValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { role, search, active_only } = req.query;

        let whereClauses = [];
        let params = [];

        if (role) {
            whereClauses.push('role = ?');
            params.push(role);
        }

        if (search) {
            whereClauses.push('(full_name LIKE ? OR email LIKE ? OR username LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (active_only === 'true') {
            whereClauses.push('is_active = TRUE');
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const usersSql = `
            SELECT 
                id, username, email, full_name, phone, address, role, avatar, is_active, created_at, updated_at
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM users
            ${whereClause}
        `;

        const users = await query(usersSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', authenticateToken, requireAdmin, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const userId = req.params.id;

        const userSql = `
            SELECT 
                id, username, email, full_name, phone, address, role, avatar, is_active, created_at, updated_at
            FROM users
            WHERE id = ?
        `;

        const users = await query(userSql, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's cats
        const cats = await query('SELECT * FROM cats WHERE user_id = ? AND is_active = TRUE', [userId]);

        // Get user's bookings
        const bookings = await query(`
            SELECT 
                b.*,
                r.name as room_name,
                c.name as cat_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN cats c ON b.cat_id = c.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT 10
        `, [userId]);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    ...users[0],
                    cats,
                    recent_bookings: bookings
                }
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user'
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, requireAdmin, [
    ...commonValidation.id,
    ...userValidation.update
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.params.id;
        const { full_name, phone, address, role, is_active } = req.body;

        const sql = `
            UPDATE users SET
                full_name = COALESCE(?, full_name),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                role = COALESCE(?, role),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const result = await query(sql, [full_name, phone, address, role, is_active, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = await query(
            'SELECT id, username, email, full_name, phone, address, role, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                user: updatedUser[0]
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user'
        });
    }
});

// @route   PUT /api/users/:id/password
// @desc    Reset user password (Admin only)
// @access  Private/Admin
router.put('/:id/password', authenticateToken, requireAdmin, [
    ...commonValidation.id,
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.params.id;
        const { new_password } = req.body;

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        const result = await query(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resetting password'
        });
    }
});

// @route   POST /api/users/:id/avatar
// @desc    Upload user avatar
// @access  Private (Self or Admin)
router.post('/:id/avatar', authenticateToken, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const userId = req.params.id;

        // Check permission (user can update own avatar, admin can update any)
        if (req.user.role !== 'admin' && req.user.id != userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!req.files || !req.files.avatar) {
            return res.status(400).json({
                success: false,
                message: 'No avatar uploaded'
            });
        }

        const avatar = req.files.avatar;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(avatar.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG and WebP allowed'
            });
        }

        // Generate unique filename
        const fileExtension = path.extname(avatar.name);
        const fileName = `user_${userId}_${uuidv4()}${fileExtension}`;
        const uploadPath = path.join(process.env.UPLOAD_PATH || './uploads', 'users', fileName);

        // Move file
        await avatar.mv(uploadPath);

        // Update user avatar in database
        const avatarUrl = `/uploads/users/${fileName}`;
        const result = await query(
            'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [avatarUrl, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar_url: avatarUrl
            }
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading avatar'
        });
    }
});

module.exports = router;

