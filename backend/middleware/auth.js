const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

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

        // Add user to request object
        req.user = user;
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
        next();

    } catch (error) {
        req.user = null;
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

module.exports = {
    authenticateToken,
    requireAdmin,
    requireCustomerOrAdmin,
    requireOwnershipOrAdmin,
    optionalAuth,
    generateToken
};