const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Helper functions for token blacklist management
const isTokenBlacklisted = (token) => {
    return tokenBlacklist.has(token);
};

const addTokenToBlacklist = (token) => {
    tokenBlacklist.add(token);
    
    // Optional: Clean up expired tokens periodically
    // In production, implement proper cleanup mechanism with Redis TTL
    setTimeout(() => {
        tokenBlacklist.delete(token);
    }, 24 * 60 * 60 * 1000); // Remove after 24 hours
};

const removeTokenFromBlacklist = (token) => {
    return tokenBlacklist.delete(token);
};

const clearTokenBlacklist = () => {
    tokenBlacklist.clear();
};

const getBlacklistSize = () => {
    return tokenBlacklist.size;
};

// Verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Check if token is blacklisted (logged out)
        if (isTokenBlacklisted(token)) {
            return res.status(401).json({
                success: false,
                message: 'Token has been invalidated. Please login again.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const sql = `
            SELECT id, username, email, full_name, role, is_active 
            FROM users 
            WHERE id = ?
        `;
        const users = await query(sql, [decoded.userId]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Add user and token to request object
        req.user = user;
        req.token = token;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Check if user is customer or admin
const requireCustomerOrAdmin = (req, res, next) => {
    if (!['customer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Customer or admin access required'
        });
    }
    next();
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
    return (req, res, next) => {
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (req.user.role === 'admin' || req.user.id == resourceUserId) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied - insufficient permissions'
            });
        }
    };
};

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            req.token = null;
            return next();
        }

        // Check if token is blacklisted
        if (isTokenBlacklisted(token)) {
            req.user = null;
            req.token = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const sql = `
            SELECT id, username, email, full_name, role, is_active 
            FROM users 
            WHERE id = ? AND is_active = TRUE
        `;
        const users = await query(sql, [decoded.userId]);

        req.user = users.length > 0 ? users[0] : null;
        req.token = users.length > 0 ? token : null;
        next();

    } catch (error) {
        req.user = null;
        req.token = null;
        next();
    }
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Logout function - add token to blacklist
const logoutToken = (token) => {
    if (token) {
        addTokenToBlacklist(token);
        return true;
    }
    return false;
};

// Logout all tokens for a user (advanced feature)
const logoutAllUserTokens = async (userId) => {
    try {
        // In a real implementation, you would:
        // 1. Store a token version in the user table
        // 2. Increment the version to invalidate all tokens
        // 3. Or maintain a database of valid tokens per user
        
        // For now, we'll just return success
        // This would need to be implemented based on your specific requirements
        
        await query(
            'UPDATE users SET token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = ?',
            [userId]
        );
        
        return true;
    } catch (error) {
        console.error('Logout all tokens error:', error);
        return false;
    }
};

// Middleware to check token version (if implementing token versioning)
const checkTokenVersion = async (req, res, next) => {
    try {
        if (!req.user || !req.token) {
            return next();
        }

        // Get user's current token version
        const users = await query(
            'SELECT token_version FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const userTokenVersion = users[0].token_version || 0;
        
        // Decode token to check version (if you store version in token)
        const decoded = jwt.decode(req.token);
        const tokenVersion = decoded.tokenVersion || 0;

        if (tokenVersion < userTokenVersion) {
            return res.status(401).json({
                success: false,
                message: 'Token has been invalidated. Please login again.'
            });
        }

        next();
    } catch (error) {
        console.error('Token version check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during token validation'
        });
    }
};

// Enhanced token generation with version support
const generateTokenWithVersion = async (userId) => {
    try {
        // Get user's current token version
        const users = await query(
            'SELECT token_version FROM users WHERE id = ?',
            [userId]
        );

        const tokenVersion = users.length > 0 ? (users[0].token_version || 0) : 0;

        return jwt.sign(
            { 
                userId,
                tokenVersion
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
    } catch (error) {
        console.error('Generate token with version error:', error);
        // Fallback to regular token generation
        return generateToken(userId);
    }
};

// Cleanup expired tokens from blacklist (run periodically)
const cleanupExpiredTokens = () => {
    const now = Date.now();
    const expiredTokens = [];
    
    for (const token of tokenBlacklist) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp && decoded.exp * 1000 < now) {
                expiredTokens.push(token);
            }
        } catch (error) {
            // If token can't be decoded, consider it expired
            expiredTokens.push(token);
        }
    }
    
    expiredTokens.forEach(token => {
        tokenBlacklist.delete(token);
    });
    
    console.log(`Cleaned up ${expiredTokens.length} expired tokens from blacklist`);
    return expiredTokens.length;
};

// Start periodic cleanup (run every hour)
const startTokenCleanup = () => {
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // 1 hour
    console.log('Token cleanup scheduler started');
};

// Middleware to add security headers
const addSecurityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
};

// Rate limiting for authentication endpoints
const createAuthRateLimit = () => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const key = req.ip + req.path;
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;
        
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
                message: 'Too many attempts. Please try again later.'
            });
        }
        
        attempt.count++;
        next();
    };
};

module.exports = {
    // Core authentication
    authenticateToken,
    requireAdmin,
    requireCustomerOrAdmin,
    requireOwnershipOrAdmin,
    optionalAuth,
    
    // Token management
    generateToken,
    generateTokenWithVersion,
    
    // Logout functionality
    logoutToken,
    logoutAllUserTokens,
    isTokenBlacklisted,
    addTokenToBlacklist,
    removeTokenFromBlacklist,
    clearTokenBlacklist,
    getBlacklistSize,
    
    // Advanced features
    checkTokenVersion,
    cleanupExpiredTokens,
    startTokenCleanup,
    
    // Security middleware
    addSecurityHeaders,
    createAuthRateLimit
};