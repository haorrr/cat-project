const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error('Error:', err);

    // MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // MySQL foreign key constraint error
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = 'Referenced record does not exist';
        error = { message, statusCode: 400 };
    }

    // MySQL constraint violation
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        const message = 'Cannot delete record - it is referenced by other records';
        error = { message, statusCode: 409 };
    }

    // Validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Not authorized, token failed';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Not authorized, token expired';
        error = { message, statusCode: 401 };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        error = { message, statusCode: 413 };
    }

    // Default to 500 server error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;