// Enhanced rooms.js with image upload functionality
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { roomValidation, commonValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/rooms';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `room-${uniqueSuffix}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    }
});

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

        // Fixed MySQL LIMIT syntax - use LIMIT offset, count
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

        // Process room data
        const processedRooms = rooms.map(room => ({
            ...room,
            amenities: room.amenities ? JSON.parse(room.amenities) : [],
            images: room.images ? room.images.split(',').filter(img => img) : [],
            image_count: parseInt(room.image_count)
        }));

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
            SELECT id, image_url, is_primary
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
            amenities: rooms[0].amenities ? JSON.parse(rooms[0].amenities) : [],
            images: images.map(img => ({
                id: img.id,
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
// @desc    Create room with images
// @access  Admin
router.post('/', authenticateToken, requireAdmin, upload.array('images', 10), roomValidation.create, handleValidationErrors, async (req, res) => {
    const connection = await transaction();
    
    try {
        const { name, description, room_type, capacity, price_per_day, amenities, size_sqm } = req.body;
        const uploadedFiles = req.files || [];

        // Create room
        const roomSql = `
            INSERT INTO rooms (name, description, room_type, capacity, price_per_day, amenities, size_sqm)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const roomResult = await query(roomSql, [
            name,
            description,
            room_type,
            capacity,
            price_per_day,
            JSON.stringify(amenities || []),
            size_sqm
        ], connection);

        const roomId = roomResult.insertId;

        // Save room images
        if (uploadedFiles.length > 0) {
            const imagePromises = uploadedFiles.map(async (file, index) => {
                const imageUrl = `/uploads/rooms/${file.filename}`;
                const isPrimary = index === 0; // First image is primary

                const imageSql = `
                    INSERT INTO room_images (room_id, image_url, is_primary)
                    VALUES (?, ?, ?)
                `;

                return query(imageSql, [roomId, imageUrl, isPrimary], connection);
            });

            await Promise.all(imagePromises);
        }

        await connection.commit();

        // Get the created room with images
        const newRoom = await query(`
            SELECT r.*, 
                   GROUP_CONCAT(ri.image_url) as images
            FROM rooms r
            LEFT JOIN room_images ri ON r.id = ri.room_id
            WHERE r.id = ?
            GROUP BY r.id
        `, [roomId]);

        const roomWithImages = {
            ...newRoom[0],
            amenities: newRoom[0].amenities ? JSON.parse(newRoom[0].amenities) : [],
            images: newRoom[0].images ? newRoom[0].images.split(',') : []
        };

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: {
                room: roomWithImages
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create room error:', error);

        // Delete uploaded files if room creation failed
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating room'
        });
    } finally {
        connection.release();
    }
});

// @route   PUT /api/rooms/:id
// @desc    Update room with images
// @access  Admin
router.put('/:id', authenticateToken, requireAdmin, upload.array('images', 10), roomValidation.update, handleValidationErrors, async (req, res) => {
    const connection = await transaction();
    
    try {
        const roomId = req.params.id;
        const { name, description, room_type, capacity, price_per_day, amenities, size_sqm, is_available, remove_images } = req.body;
        const uploadedFiles = req.files || [];

        // Check if room exists
        const existingRoom = await query('SELECT id FROM rooms WHERE id = ?', [roomId]);
        if (existingRoom.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Update room data
        const roomSql = `
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

        await query(roomSql, [
            name,
            description,
            room_type,
            capacity,
            price_per_day,
            amenities ? JSON.stringify(amenities) : null,
            size_sqm,
            is_available,
            roomId
        ], connection);

        // Handle image removal
        if (remove_images) {
            const imageIdsToRemove = JSON.parse(remove_images);
            if (imageIdsToRemove.length > 0) {
                // Get image paths before deletion
                const imagesToDelete = await query(
                    `SELECT image_url FROM room_images WHERE id IN (${imageIdsToRemove.map(() => '?').join(',')}) AND room_id = ?`,
                    [...imageIdsToRemove, roomId]
                );

                // Delete from database
                await query(
                    `DELETE FROM room_images WHERE id IN (${imageIdsToRemove.map(() => '?').join(',')}) AND room_id = ?`,
                    [...imageIdsToRemove, roomId],
                    connection
                );

                // Delete physical files
                imagesToDelete.forEach(img => {
                    const filePath = path.join(__dirname, '..', img.image_url);
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting image file:', err);
                    });
                });
            }
        }

        // Add new images
        if (uploadedFiles.length > 0) {
            // Check if there are existing images to determine primary image
            const existingImages = await query('SELECT COUNT(*) as count FROM room_images WHERE room_id = ?', [roomId]);
            const hasExistingImages = existingImages[0].count > 0;

            const imagePromises = uploadedFiles.map(async (file, index) => {
                const imageUrl = `/uploads/rooms/${file.filename}`;
                const isPrimary = !hasExistingImages && index === 0; // First image is primary only if no existing images

                const imageSql = `
                    INSERT INTO room_images (room_id, image_url, is_primary)
                    VALUES (?, ?, ?)
                `;

                return query(imageSql, [roomId, imageUrl, isPrimary], connection);
            });

            await Promise.all(imagePromises);
        }

        await connection.commit();

        // Get updated room with images
        const updatedRoom = await query(`
            SELECT r.*, 
                   GROUP_CONCAT(ri.image_url) as images
            FROM rooms r
            LEFT JOIN room_images ri ON r.id = ri.room_id
            WHERE r.id = ?
            GROUP BY r.id
        `, [roomId]);

        const roomWithImages = {
            ...updatedRoom[0],
            amenities: updatedRoom[0].amenities ? JSON.parse(updatedRoom[0].amenities) : [],
            images: updatedRoom[0].images ? updatedRoom[0].images.split(',') : []
        };

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: {
                room: roomWithImages
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Update room error:', error);

        // Delete uploaded files if update failed
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while updating room'
        });
    } finally {
        connection.release();
    }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room and its images
// @access  Admin
router.delete('/:id', authenticateToken, requireAdmin, commonValidation.id, handleValidationErrors, async (req, res) => {
    const connection = await transaction();
    
    try {
        const roomId = req.params.id;

        // Check for active bookings
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

        // Get room images before deletion
        const roomImages = await query('SELECT image_url FROM room_images WHERE room_id = ?', [roomId]);

        // Delete room (CASCADE will delete room_images)
        const result = await query('DELETE FROM rooms WHERE id = ?', [roomId], connection);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        await connection.commit();

        // Delete physical image files
        roomImages.forEach(img => {
            const filePath = path.join(__dirname, '..', img.image_url);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting image file:', err);
            });
        });

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Delete room error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting room'
        });
    } finally {
        connection.release();
    }
});

// @route   POST /api/rooms/:id/images/set-primary
// @desc    Set primary image for room
// @access  Admin
router.post('/:id/images/set-primary', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await transaction();
    
    try {
        const roomId = req.params.id;
        const { imageId } = req.body;

        if (!imageId) {
            return res.status(400).json({
                success: false,
                message: 'Image ID is required'
            });
        }

        // Verify image belongs to room
        const imageExists = await query(
            'SELECT id FROM room_images WHERE id = ? AND room_id = ?',
            [imageId, roomId]
        );

        if (imageExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found for this room'
            });
        }

        // Reset all images to non-primary
        await query(
            'UPDATE room_images SET is_primary = FALSE WHERE room_id = ?',
            [roomId],
            connection
        );

        // Set specified image as primary
        await query(
            'UPDATE room_images SET is_primary = TRUE WHERE id = ? AND room_id = ?',
            [imageId, roomId],
            connection
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Primary image updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Set primary image error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating primary image'
        });
    } finally {
        connection.release();
    }
});

// @route   DELETE /api/rooms/:id/images/:imageId
// @desc    Delete specific room image
// @access  Admin
router.delete('/:id/images/:imageId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id: roomId, imageId } = req.params;

        // Get image info before deletion
        const imageInfo = await query(
            'SELECT image_url, is_primary FROM room_images WHERE id = ? AND room_id = ?',
            [imageId, roomId]
        );

        if (imageInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete from database
        await query('DELETE FROM room_images WHERE id = ? AND room_id = ?', [imageId, roomId]);

        // Delete physical file
        const filePath = path.join(__dirname, '..', imageInfo[0].image_url);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting image file:', err);
        });

        // If deleted image was primary, set another image as primary
        if (imageInfo[0].is_primary) {
            const otherImages = await query(
                'SELECT id FROM room_images WHERE room_id = ? LIMIT 1',
                [roomId]
            );

            if (otherImages.length > 0) {
                await query(
                    'UPDATE room_images SET is_primary = TRUE WHERE id = ?',
                    [otherImages[0].id]
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting image'
        });
    }
});

// @route   GET /api/rooms/:id/availability
// @desc    Check room availability
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