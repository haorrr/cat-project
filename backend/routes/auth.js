const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { userValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', userValidation.register, handleValidationErrors, async (req, res) => {
    try {
        const { username, email, password, full_name, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const sql = `
            INSERT INTO users (username, email, password, full_name, phone, address, role)
            VALUES (?, ?, ?, ?, ?, ?, 'customer')
        `;
        
        const result = await query(sql, [
            username,
            email,
            hashedPassword,
            full_name,
            phone || null,
            address || null
        ]);

        // Generate JWT token
        const token = generateToken(result.insertId);

        // Get user data (without password)
        const newUser = await query(
            'SELECT id, username, email, full_name, phone, address, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: newUser[0],
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', userValidation.login, handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists and is active
        const users = await query(
            'SELECT id, username, email, password, full_name, phone, address, role, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Remove password from response
        delete user.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await query(
            'SELECT id, username, email, full_name, phone, address, role, avatar, created_at, updated_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: user[0]
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, userValidation.update, handleValidationErrors, async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        const userId = req.user.id;

        // Update user profile
        const sql = `
            UPDATE users 
            SET full_name = COALESCE(?, full_name),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        await query(sql, [full_name, phone, address, userId]);

        // Get updated user data
        const updatedUser = await query(
            'SELECT id, username, email, full_name, phone, address, role, avatar, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser[0]
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], handleValidationErrors, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        // Get current password hash
        const users = await query('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

        // Update password
        await query(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedNewPassword, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', authenticateToken, async (req, res) => {
    try {
        // Generate new token
        const newToken = generateToken(req.user.id);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while refreshing token'
        });
    }
});

module.exports = router;