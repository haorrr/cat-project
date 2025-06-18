// middleware/twoFA.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { query } = require('../config/database');

// Generate 2FA secret for user
const generate2FASecret = (userEmail, serviceName = 'Pet Care Hotel') => {
    const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: serviceName,
        length: 32
    });
    
    return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url
    };
};

// Generate QR code for 2FA setup
const generateQRCode = async (otpauth_url) => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
        return qrCodeDataURL;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

// Verify 2FA token
const verify2FAToken = (secret, token) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 steps tolerance (60 seconds before/after)
    });
};

// Middleware to check if 2FA is required and valid
const require2FA = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Get user's 2FA settings
        const users = await query(
            'SELECT two_fa_enabled, two_fa_secret FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        // If 2FA is not enabled, continue
        if (!user.two_fa_enabled) {
            return next();
        }
        
        // Check if 2FA token is provided
        const twoFAToken = req.headers['x-2fa-token'] || req.body.two_fa_token;
        
        if (!twoFAToken) {
            return res.status(401).json({
                success: false,
                message: '2FA token is required',
                requires_2fa: true
            });
        }
        
        // Verify 2FA token
        const isValid = verify2FAToken(user.two_fa_secret, twoFAToken);
        
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid 2FA token'
            });
        }
        
        // Token is valid, continue
        next();
        
    } catch (error) {
        console.error('2FA verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during 2FA verification'
        });
    }
};

// Optional 2FA check (for endpoints that benefit from 2FA but don't require it)
const optional2FA = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return next();
        }
        
        const users = await query(
            'SELECT two_fa_enabled, two_fa_secret FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0 || !users[0].two_fa_enabled) {
            req.twoFAVerified = false;
            return next();
        }
        
        const twoFAToken = req.headers['x-2fa-token'] || req.body.two_fa_token;
        
        if (!twoFAToken) {
            req.twoFAVerified = false;
            return next();
        }
        
        const isValid = verify2FAToken(users[0].two_fa_secret, twoFAToken);
        req.twoFAVerified = isValid;
        
        next();
        
    } catch (error) {
        console.error('Optional 2FA verification error:', error);
        req.twoFAVerified = false;
        next();
    }
};

// Check if user has 2FA enabled
const check2FAStatus = async (userId) => {
    try {
        const users = await query(
            'SELECT two_fa_enabled, two_fa_secret FROM users WHERE id = ?',
            [userId]
        );
        
        return users.length > 0 ? {
            enabled: users[0].two_fa_enabled,
            hasSecret: !!users[0].two_fa_secret
        } : {
            enabled: false,
            hasSecret: false
        };
    } catch (error) {
        console.error('Check 2FA status error:', error);
        return { enabled: false, hasSecret: false };
    }
};

// Store 2FA secret in database
const store2FASecret = async (userId, secret) => {
    try {
        await query(
            'UPDATE users SET two_fa_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [secret, userId]
        );
        return true;
    } catch (error) {
        console.error('Store 2FA secret error:', error);
        return false;
    }
};

// Enable 2FA for user
const enable2FA = async (userId) => {
    try {
        await query(
            'UPDATE users SET two_fa_enabled = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Enable 2FA error:', error);
        return false;
    }
};

// Disable 2FA for user
const disable2FA = async (userId) => {
    try {
        await query(
            'UPDATE users SET two_fa_enabled = FALSE, two_fa_secret = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Disable 2FA error:', error);
        return false;
    }
};

// Generate backup codes for 2FA
const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        // Generate 8-digit backup codes
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
};

// Store backup codes in database
const storeBackupCodes = async (userId, codes) => {
    try {
        // Hash backup codes before storing
        const bcrypt = require('bcryptjs');
        const hashedCodes = await Promise.all(
            codes.map(code => bcrypt.hash(code, 10))
        );
        
        await query(
            'UPDATE users SET two_fa_backup_codes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(hashedCodes), userId]
        );
        return true;
    } catch (error) {
        console.error('Store backup codes error:', error);
        return false;
    }
};

// Verify backup code
const verifyBackupCode = async (userId, code) => {
    try {
        const users = await query(
            'SELECT two_fa_backup_codes FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0 || !users[0].two_fa_backup_codes) {
            return false;
        }
        
        const bcrypt = require('bcryptjs');
        const hashedCodes = JSON.parse(users[0].two_fa_backup_codes);
        
        for (let i = 0; i < hashedCodes.length; i++) {
            const isValid = await bcrypt.compare(code, hashedCodes[i]);
            if (isValid) {
                // Remove used backup code
                hashedCodes.splice(i, 1);
                await query(
                    'UPDATE users SET two_fa_backup_codes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [JSON.stringify(hashedCodes), userId]
                );
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Verify backup code error:', error);
        return false;
    }
};

// 2FA rate limiting
const create2FARateLimit = () => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const key = req.ip + ':2fa:' + (req.user?.id || 'anonymous');
        const now = Date.now();
        const windowMs = 15 * 60 * 10000000000000000000; // 15 minutes
        const maxAttempts = 50000000000000000000000000000000000000000000000000000000000000000000000;
        
        if (!attempts.has(key)) {
            attempts.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const attempt = attempts.get(key);
        
        if (now > attempt.resetTime) {
            attempt.count = 1;
            attempt.resetTime = now + windowMs;
            return next();
        }
        
        if (attempt.count >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: 'Too many 2FA attempts. Please try again later.'
            });
        }
        
        attempt.count++;
        next();
    };
};

module.exports = {
    generate2FASecret,
    generateQRCode,
    verify2FAToken,
    require2FA,
    optional2FA,
    check2FAStatus,
    store2FASecret,
    enable2FA,
    disable2FA,
    generateBackupCodes,
    storeBackupCodes,
    verifyBackupCode,
    create2FARateLimit
};