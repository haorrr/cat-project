const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User validation rules
const userValidation = {
    register: [
        body('username')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_.]+$/)
            .withMessage('Username can only contain letters, numbers, underscore and dot'),
        body('email')
            .isEmail()
            .withMessage('Must be a valid email')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('full_name')
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        body('phone')
            .optional()
            .matches(/^[0-9+\-\s()]+$/)
            .withMessage('Invalid phone number format')
    ],

    login: [
        body('email')
            .isEmail()
            .withMessage('Must be a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],

    update: [
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        body('phone')
            .optional()
            .matches(/^[0-9+\-\s()]+$/)
            .withMessage('Invalid phone number format'),
        body('address')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Address must be less than 500 characters')
    ]
};

// Cat validation rules
const catValidation = {
    create: [
        body('name')
            .isLength({ min: 1, max: 50 })
            .withMessage('Cat name must be between 1 and 50 characters'),
        body('breed')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Breed must be less than 50 characters'),
        body('age')
            .optional()
            .isInt({ min: 0, max: 30 })
            .withMessage('Age must be between 0 and 30'),
        body('weight')
            .optional()
            .isFloat({ min: 0.1, max: 20 })
            .withMessage('Weight must be between 0.1 and 20 kg'),
        body('gender')
            .isIn(['male', 'female'])
            .withMessage('Gender must be male or female'),
        body('color')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Color must be less than 50 characters')
    ],

    update: [
        param('id').isInt().withMessage('Invalid cat ID'),
        body('name')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Cat name must be between 1 and 50 characters'),
        body('breed')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Breed must be less than 50 characters'),
        body('age')
            .optional()
            .isInt({ min: 0, max: 30 })
            .withMessage('Age must be between 0 and 30'),
        body('weight')
            .optional()
            .isFloat({ min: 0.1, max: 20 })
            .withMessage('Weight must be between 0.1 and 20 kg'),
        body('gender')
            .optional()
            .isIn(['male', 'female'])
            .withMessage('Gender must be male or female')
    ]
};

// Room validation rules
const roomValidation = {
    create: [
        body('name')
            .isLength({ min: 1, max: 100 })
            .withMessage('Room name must be between 1 and 100 characters'),
        body('room_type')
            .isIn(['standard', 'deluxe', 'premium', 'vip'])
            .withMessage('Invalid room type'),
        body('capacity')
            .isInt({ min: 1, max: 5 })
            .withMessage('Capacity must be between 1 and 5'),
        body('price_per_day')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        body('size_sqm')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Size must be a positive number')
    ],

    update: [
        param('id').isInt().withMessage('Invalid room ID'),
        body('name')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Room name must be between 1 and 100 characters'),
        body('room_type')
            .optional()
            .isIn(['standard', 'deluxe', 'premium', 'vip'])
            .withMessage('Invalid room type'),
        body('capacity')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Capacity must be between 1 and 5'),
        body('price_per_day')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number')
    ]
};

// Booking validation rules
const bookingValidation = {
    create: [
        body('cat_id')
            .isInt()
            .withMessage('Valid cat ID is required'),
        body('room_id')
            .isInt()
            .withMessage('Valid room ID is required'),
        body('check_in_date')
            .isISO8601()
            .withMessage('Valid check-in date is required'),
        body('check_out_date')
            .isISO8601()
            .withMessage('Valid check-out date is required'),
        body('services')
            .optional()
            .isArray()
            .withMessage('Services must be an array'),
        body('foods')
            .optional()
            .isArray()
            .withMessage('Foods must be an array')
    ],

    update: [
        param('id').isInt().withMessage('Invalid booking ID'),
        body('status')
            .optional()
            .isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
            .withMessage('Invalid booking status')
    ]
};

// News validation rules
const newsValidation = {
    create: [
        body('title')
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters'),
        body('content')
            .isLength({ min: 10 })
            .withMessage('Content must be at least 10 characters'),
        body('category')
            .isIn(['tips', 'health', 'events', 'updates', 'general'])
            .withMessage('Invalid category'),
        body('excerpt')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Excerpt must be less than 500 characters')
    ],

    update: [
        param('id').isInt().withMessage('Invalid news ID'),
        body('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters'),
        body('content')
            .optional()
            .isLength({ min: 10 })
            .withMessage('Content must be at least 10 characters'),
        body('category')
            .optional()
            .isIn(['tips', 'health', 'events', 'updates', 'general'])
            .withMessage('Invalid category')
    ]
};

// Common validation rules
const commonValidation = {
    id: [
        param('id').isInt().withMessage('Invalid ID parameter')
    ],

    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('sort')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort must be asc or desc')
    ]
};

module.exports = {
    handleValidationErrors,
    userValidation,
    catValidation,
    roomValidation,
    bookingValidation,
    newsValidation,
    commonValidation
};