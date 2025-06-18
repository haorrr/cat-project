// routes/twoFA.js
const express = require('express');
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
    generate2FASecret,
    generateQRCode,
    verify2FAToken,
    check2FAStatus,
    store2FASecret,
    enable2FA,
    disable2FA,
    generateBackupCodes,
    storeBackupCodes,
    verifyBackupCode,
    create2FARateLimit
} = require('../middleware/twoFA');

const router = express.Router();

// Apply rate limiting to all 2FA routes
const twoFARateLimit = create2FARateLimit();
router.use(twoFARateLimit);

// @route   GET /api/2fa/status
// @desc    Get 2FA status for current user
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const status = await check2FAStatus(req.user.id);
        
        res.status(200).json({
            success: true,
            data: {
                two_fa_enabled: status.enabled,
                has_secret: status.hasSecret
            }
        });
        
    } catch (error) {
        console.error('Get 2FA status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking 2FA status'
        });
    }
});

// @route   POST /api/2fa/setup
// @desc    Generate 2FA secret and QR code for setup
// @access  Private
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        
        // Check if 2FA is already enabled
        const status = await check2FAStatus(userId);
        if (status.enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is already enabled for this account'
            });
        }
        
        // Generate secret
        const { secret, otpauth_url } = generate2FASecret(userEmail);
        
        // Generate QR code
        const qrCode = await generateQRCode(otpauth_url);
        
        // Store secret in database (but don't enable 2FA yet)
        const stored = await store2FASecret(userId, secret);
        
        if (!stored) {
            return res.status(500).json({
                success: false,
                message: 'Failed to store 2FA secret'
            });
        }
        
        res.status(200).json({
            success: true,
            message: '2FA setup initiated. Please scan the QR code with your authenticator app.',
            data: {
                secret,
                qr_code: qrCode,
                manual_entry_key: secret
            }
        });
        
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during 2FA setup'
        });
    }
});

// @route   POST /api/2fa/verify-setup
// @desc    Verify 2FA token and enable 2FA
// @access  Private
router.post('/verify-setup', authenticateToken, [
    body('token')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('2FA token must be 6 digits')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        
        // Get user's 2FA secret
        const users = await query(
            'SELECT two_fa_secret, two_fa_enabled FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        if (user.two_fa_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is already enabled'
            });
        }
        
        if (!user.two_fa_secret) {
            return res.status(400).json({
                success: false,
                message: 'Please setup 2FA first'
            });
        }
        
        // Verify token
        const isValid = verify2FAToken(user.two_fa_secret, token);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA token'
            });
        }
        
        // Enable 2FA
        const enabled = await enable2FA(userId);
        
        if (!enabled) {
            return res.status(500).json({
                success: false,
                message: 'Failed to enable 2FA'
            });
        }
        
        // Generate backup codes
        const backupCodes = generateBackupCodes();
        await storeBackupCodes(userId, backupCodes);
        
        res.status(200).json({
            success: true,
            message: '2FA has been successfully enabled',
            data: {
                backup_codes: backupCodes
            }
        });
        
    } catch (error) {
        console.error('2FA verify setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during 2FA verification'
        });
    }
});

// @route   POST /api/2fa/verify
// @desc    Verify 2FA token for authentication
// @access  Private
router.post('/verify', authenticateToken, [
    body('token')
        .isLength({ min: 6, max: 8 })
        .withMessage('Token must be 6-8 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        
        // Get user's 2FA settings
        const users = await query(
            'SELECT two_fa_secret, two_fa_enabled FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        if (!user.two_fa_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled for this account'
            });
        }
        
        let isValid = false;
        
        // Check if it's a backup code (8 characters) or regular token (6 digits)
        if (token.length === 8) {
            // Verify backup code
            isValid = await verifyBackupCode(userId, token);
        } else {
            // Verify regular 2FA token
            isValid = verify2FAToken(user.two_fa_secret, token);
        }
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA token or backup code'
            });
        }
        
        res.status(200).json({
            success: true,
            message: '2FA verification successful'
        });
        
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during 2FA verification'
        });
    }
});

// @route   POST /api/2fa/disable
// @desc    Disable 2FA for user
// @access  Private
router.post('/disable', authenticateToken, [
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    body('token')
        .optional()
        .isLength({ min: 6, max: 8 })
        .withMessage('Token must be 6-8 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, token } = req.body;
        
        // Verify password
        const bcrypt = require('bcryptjs');
        const users = await query(
            'SELECT password, two_fa_enabled, two_fa_secret FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password'
            });
        }
        
        if (!user.two_fa_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }
        
        // If 2FA is enabled, require 2FA token to disable it
        if (token) {
            let isTokenValid = false;
            
            if (token.length === 8) {
                // Verify backup code
                isTokenValid = await verifyBackupCode(userId, token);
            } else {
                // Verify regular 2FA token
                isTokenValid = verify2FAToken(user.two_fa_secret, token);
            }
            
            if (!isTokenValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid 2FA token'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: '2FA token is required to disable 2FA'
            });
        }
        
        // Disable 2FA
        const disabled = await disable2FA(userId);
        
        if (!disabled) {
            return res.status(500).json({
                success: false,
                message: 'Failed to disable 2FA'
            });
        }
        
        res.status(200).json({
            success: true,
            message: '2FA has been successfully disabled'
        });
        
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while disabling 2FA'
        });
    }
});

// @route   POST /api/2fa/regenerate-backup-codes
// @desc    Regenerate backup codes
// @access  Private
router.post('/regenerate-backup-codes', authenticateToken, [
    body('token')
        .isLength({ min: 6, max: 8 })
        .withMessage('2FA token is required')
], handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        
        // Check if 2FA is enabled
        const users = await query(
            'SELECT two_fa_enabled, two_fa_secret FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        if (!user.two_fa_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }
        
        // Verify 2FA token
        let isValid = false;
        
        if (token.length === 8) {
            // Verify backup code
            isValid = await verifyBackupCode(userId, token);
        } else {
            // Verify regular 2FA token
            isValid = verify2FAToken(user.two_fa_secret, token);
        }
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA token'
            });
        }
        
        // Generate new backup codes
        const backupCodes = generateBackupCodes();
        const stored = await storeBackupCodes(userId, backupCodes);
        
        if (!stored) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate backup codes'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Backup codes regenerated successfully',
            data: {
                backup_codes: backupCodes
            }
        });
        
    } catch (error) {
        console.error('Regenerate backup codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while regenerating backup codes'
        });
    }
});

// @route   GET /api/2fa/backup-codes-count
// @desc    Get number of remaining backup codes
// @access  Private
router.get('/backup-codes-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const users = await query(
            'SELECT two_fa_backup_codes FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const backupCodes = users[0].two_fa_backup_codes;
        const count = backupCodes ? JSON.parse(backupCodes).length : 0;
        
        res.status(200).json({
            success: true,
            data: {
                remaining_backup_codes: count
            }
        });
        
    } catch (error) {
        console.error('Get backup codes count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while getting backup codes count'
        });
    }
});

module.exports = router;