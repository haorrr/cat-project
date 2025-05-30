// Fixed rooms.js with safe JSON parsing
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { roomValidation, commonValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Helper function to safely parse JSON
const safeJsonParse = (jsonString, fallback = []) => {
    if (!jsonString || jsonString === null || jsonString === undefined) {
        return fallback;
    }
    
    try {
        // Handle case where jsonString is already an object/array
        if (typeof jsonString === 'object') {
            return jsonString;
        }
        
        // Clean up the string and parse
        const cleanJson = jsonString.toString().trim();
        if (cleanJson === '' || cleanJson === 'null') {
            return fallback;
        }
        
        return JSON.parse(cleanJson);
    } catch (error) {
        console.log('JSON Parse Error for:', jsonString, 'Error:', error.message);
        return fallback;
    }
};

// @route   GET /api/rooms
// @desc    Get all rooms with availability info
// @access  Public
router.get('/', optionalAuth, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const { room_type, min_price, max_price, check_in, check_out, available_only } = req.query;

        let whereClauses = [];
        let params = [];

        // Filter by room type
        if (room_type) {
            whereClauses.push('r.room_type = ?');
            params.push(room_type);
        }

        // Filter by price range
        if (min_price) {
            whereClauses.push('r.price_per_day >= ?');
            params.push(parseFloat(min_price));
        }

        if (max_price) {
            whereClauses.push('r.price_per_day <= ?');
            params.push(parseFloat(max_price));
        }

        // Filter by availability
        if (available_only === 'true') {
            whereClauses.push('r.is_available = TRUE');
        }

        // Check availability for specific dates
        if (check_in && check_out) {
            whereClauses.push(`
                r.id NOT IN (
                    SELECT DISTINCT b.room_id 
                    FROM bookings b 
                    WHERE b.status IN ('confirmed', 'checked_in') 
                    AND (
                        (b.check_in_date <= ? AND b.check_out_date > ?) OR
                        (b.check_in_date < ? AND b.check_out_date >= ?) OR
                        (b.check_in_date >= ? AND b.check_out_date <= ?)
                    )
                )
            `);
            params.push(check_in, check_in, check_out, check_out, check_in, check_out);
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Get rooms with image count
        const roomsSql = `
            SELECT 
                r.*,
                COUNT(ri.id) as image_count,
                GROUP_CONCAT(ri.image_url) as images
            FROM rooms r
            LEFT JOIN room_images ri ON r.id = ri.room_id
            ${whereClause}
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT ${offset}, ${limit}
        `;

        const countSql = `
            SELECT COUNT(DISTINCT r.id) as total
            FROM rooms r
            ${whereClause}
        `;

        const rooms = await query(roomsSql, params);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        // Process room data with safe JSON parsing
        const processedRooms = rooms.map(room => {
            return {
                ...room,
                amenities: safeJsonParse(room.amenities, []),
                images: room.images ? room.images.split(',').filter(img => img && img.trim()) : [],
                image_count: parseInt(room.image_count) || 0
            };
        });

        res.status(200).json({
            success: true,
            data: {
                rooms: processedRooms,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching rooms'
        });
    }
});

// @route   GET /api/rooms/:id
// @desc    Get single room with details
// @access  Public
router.get('/:id', optionalAuth, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const roomId = req.params.id;

        // Get room details
        const roomSql = `
            SELECT r.*, COUNT(ri.id) as image_count
            FROM rooms r
            LEFT JOIN room_images ri ON r.id = ri.room_id
            WHERE r.id = ?
            GROUP BY r.id
        `;

        const rooms = await query(roomSql, [roomId]);

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Get room images
        const imagesSql = `
            SELECT image_url, is_primary
            FROM room_images
            WHERE room_id = ?
            ORDER BY is_primary DESC, created_at ASC
        `;

        const images = await query(imagesSql, [roomId]);

        // Get recent bookings count for popularity
        const bookingsSql = `
            SELECT COUNT(*) as booking_count
            FROM bookings
            WHERE room_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        const bookingCount = await query(bookingsSql, [roomId]);

        const room = {
            ...rooms[0],
            amenities: safeJsonParse(rooms[0].amenities, []),
            images: images.map(img => ({
                url: img.image_url,
                is_primary: img.is_primary
            })),
            popularity_score: bookingCount[0].booking_count
        };

        res.status(200).json({
            success: true,
            data: {
                room
            }
        });

    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching room'
        });
    }
});

// @route   POST /api/rooms
// @desc    Create new room (Admin only)
// @access  Private/Admin
router.post('/', authenticateToken, requireAdmin, roomValidation.create, handleValidationErrors, async (req, res) => {
    try {
        const { name, description, room_type, capacity, price_per_day, amenities, size_sqm } = req.body;

        const sql = `
            INSERT INTO rooms (name, description, room_type, capacity, price_per_day, amenities, size_sqm)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            name,
            description,
            room_type,
            capacity,
            price_per_day,
            JSON.stringify(amenities || []),
            size_sqm
        ]);

        // Get the created room
        const newRoom = await query('SELECT * FROM rooms WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: {
                room: {
                    ...newRoom[0],
                    amenities: safeJsonParse(newRoom[0].amenities, [])
                }
            }
        });

    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating room'
        });
    }
});

// @route   PUT /api/rooms/:id
// @desc    Update room (Admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, requireAdmin, roomValidation.update, handleValidationErrors, async (req, res) => {
    try {
        const roomId = req.params.id;
        const { name, description, room_type, capacity, price_per_day, amenities, size_sqm, is_available } = req.body;

        // Check if room exists
        const existingRoom = await query('SELECT id FROM rooms WHERE id = ?', [roomId]);
        if (existingRoom.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Update room
        const sql = `
            UPDATE rooms SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                room_type = COALESCE(?, room_type),
                capacity = COALESCE(?, capacity),
                price_per_day = COALESCE(?, price_per_day),
                amenities = COALESCE(?, amenities),
                size_sqm = COALESCE(?, size_sqm),
                is_available = COALESCE(?, is_available),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await query(sql, [
            name,
            description,
            room_type,
            capacity,
            price_per_day,
            amenities ? JSON.stringify(amenities) : null,
            size_sqm,
            is_available,
            roomId
        ]);

        // Get updated room
        const updatedRoom = await query('SELECT * FROM rooms WHERE id = ?', [roomId]);

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: {
                room: {
                    ...updatedRoom[0],
                    amenities: safeJsonParse(updatedRoom[0].amenities, [])
                }
            }
        });

    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating room'
        });
    }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room (Admin only)  
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const roomId = req.params.id;

        // Check if room has active bookings
        const activeBookings = await query(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE room_id = ? AND status IN ('confirmed', 'checked_in')`,
            [roomId]
        );

        if (activeBookings[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete room with active bookings'
            });
        }

        // Delete room (images will be deleted due to CASCADE)
        const result = await query('DELETE FROM rooms WHERE id = ?', [roomId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });

    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting room'
        });
    }
});

// @route   GET /api/rooms/:id/availability
// @desc    Check room availability for date range
// @access  Public
router.get('/:id/availability', async (req, res) => {
    try {
        const roomId = req.params.id;
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Check if room exists
        const room = await query('SELECT id, is_available FROM rooms WHERE id = ?', [roomId]);
        if (room.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (!room[0].is_available) {
            return res.status(200).json({
                success: true,
                data: {
                    available: false,
                    reason: 'Room is currently unavailable'
                }
            });
        }

        // Check for conflicting bookings
        const conflictingSql = `
            SELECT id, check_in_date, check_out_date
            FROM bookings
            WHERE room_id = ? 
            AND status IN ('confirmed', 'checked_in')
            AND (
                (check_in_date <= ? AND check_out_date > ?) OR
                (check_in_date < ? AND check_out_date >= ?) OR
                (check_in_date >= ? AND check_out_date <= ?)
            )
        `;

        const conflicts = await query(conflictingSql, [
            roomId, start_date, start_date, end_date, end_date, start_date, end_date
        ]);

        res.status(200).json({
            success: true,
            data: {
                available: conflicts.length === 0,
                conflicting_bookings: conflicts.length,
                conflicts: conflicts
            }
        });

    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking availability'
        });
    }
});

module.exports = router;