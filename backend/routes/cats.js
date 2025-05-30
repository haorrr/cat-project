const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { catValidation, commonValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/cats
// @desc    Get cats (user's cats or all cats for admin)
// @access  Private
router.get('/', authenticateToken, commonValidation.pagination, handleValidationErrors, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { search, breed, gender, active_only } = req.query;

        let whereClauses = [];
        let params = [];

        // Admin can see all cats, customers only their own
        if (req.user.role === 'admin') {
            if (req.query.user_id) {
                whereClauses.push('c.user_id = ?');
                params.push(req.query.user_id);
            }
        } else {
            whereClauses.push('c.user_id = ?');
            params.push(req.user.id);
        }

        // Filter by search term (name or breed)
        if (search) {
            whereClauses.push('(c.name LIKE ? OR c.breed LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        // Filter by breed
        if (breed) {
            whereClauses.push('c.breed = ?');
            params.push(breed);
        }

        // Filter by gender
        if (gender) {
            whereClauses.push('c.gender = ?');
            params.push(gender);
        }

        // Filter by active status
        if (active_only === 'true') {
            whereClauses.push('c.is_active = TRUE');
        }

        const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Get cats with owner info
        const catsSql = `
            SELECT 
                c.*,
                u.full_name as owner_name,
                u.email as owner_email,
                u.phone as owner_phone
            FROM cats c
            JOIN users u ON c.user_id = u.id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT ${offset}, ${limit}
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM cats c
            JOIN users u ON c.user_id = u.id
            ${whereClause}
        `;

        const cats = await query(catsSql, [...params, limit, offset]);
        const countResult = await query(countSql, params);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                cats,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_records: total,
                    per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get cats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching cats'
        });
    }
});

// @route   GET /api/cats/:id
// @desc    Get single cat
// @access  Private (Owner or Admin)
router.get('/:id', authenticateToken, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const catId = req.params.id;

        const sql = `
            SELECT 
                c.*,
                u.full_name as owner_name,
                u.email as owner_email,
                u.phone as owner_phone
            FROM cats c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `;

        const cats = await query(sql, [catId]);

        if (cats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cat not found'
            });
        }

        const cat = cats[0];

        // Check ownership (admin can see all)
        if (req.user.role !== 'admin' && cat.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get recent bookings for this cat
        const bookingsSql = `
            SELECT 
                b.id,
                b.check_in_date,
                b.check_out_date,
                b.status,
                r.name as room_name,
                r.room_type
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.cat_id = ?
            ORDER BY b.created_at DESC
            LIMIT 5
        `;

        const recentBookings = await query(bookingsSql, [catId]);

        res.status(200).json({
            success: true,
            data: {
                cat: {
                    ...cat,
                    recent_bookings: recentBookings
                }
            }
        });

    } catch (error) {
        console.error('Get cat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching cat'
        });
    }
});

// @route   POST /api/cats
// @desc    Add new cat
// @access  Private
router.post('/', authenticateToken, catValidation.create, handleValidationErrors, async (req, res) => {
    try {
        const {
            name,
            breed,
            age,
            weight,
            gender,
            color,
            medical_notes,
            special_requirements,
            vaccination_status
        } = req.body;

        const sql = `
            INSERT INTO cats (
                user_id, name, breed, age, weight, gender, color,
                medical_notes, special_requirements, vaccination_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            req.user.id,
            name,
            breed || null,
            age || null,
            weight || null,
            gender,
            color || null,
            medical_notes || null,
            special_requirements || null,
            vaccination_status || 'none'
        ]);

        // Get the created cat
        const newCat = await query('SELECT * FROM cats WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Cat added successfully',
            data: {
                cat: newCat[0]
            }
        });

    } catch (error) {
        console.error('Create cat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding cat'
        });
    }
});

// @route   PUT /api/cats/:id
// @desc    Update cat information
// @access  Private (Owner or Admin)
router.put('/:id', authenticateToken, catValidation.update, handleValidationErrors, async (req, res) => {
    try {
        const catId = req.params.id;
        const {
            name,
            breed,
            age,
            weight,
            gender,
            color,
            medical_notes,
            special_requirements,
            vaccination_status,
            is_active
        } = req.body;

        // Check if cat exists and ownership
        const existingCat = await query('SELECT user_id FROM cats WHERE id = ?', [catId]);
        
        if (existingCat.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cat not found'
            });
        }

        // Check ownership (admin can update any cat)
        if (req.user.role !== 'admin' && existingCat[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update cat
        const sql = `
            UPDATE cats SET
                name = COALESCE(?, name),
                breed = COALESCE(?, breed),
                age = COALESCE(?, age),
                weight = COALESCE(?, weight),
                gender = COALESCE(?, gender),
                color = COALESCE(?, color),
                medical_notes = COALESCE(?, medical_notes),
                special_requirements = COALESCE(?, special_requirements),
                vaccination_status = COALESCE(?, vaccination_status),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await query(sql, [
            name,
            breed,
            age,
            weight,
            gender,
            color,
            medical_notes,
            special_requirements,
            vaccination_status,
            is_active,
            catId
        ]);

        // Get updated cat
        const updatedCat = await query('SELECT * FROM cats WHERE id = ?', [catId]);

        res.status(200).json({
            success: true,
            message: 'Cat updated successfully',
            data: {
                cat: updatedCat[0]
            }
        });

    } catch (error) {
        console.error('Update cat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating cat'
        });
    }
});

// @route   DELETE /api/cats/:id
// @desc    Delete cat (soft delete)
// @access  Private (Owner or Admin)
router.delete('/:id', authenticateToken, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const catId = req.params.id;

        // Check if cat exists and ownership
        const existingCat = await query('SELECT user_id FROM cats WHERE id = ?', [catId]);
        
        if (existingCat.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cat not found'
            });
        }

        // Check ownership (admin can delete any cat)
        if (req.user.role !== 'admin' && existingCat[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check for active bookings
        const activeBookings = await query(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE cat_id = ? AND status IN ('confirmed', 'checked_in')`,
            [catId]
        );

        if (activeBookings[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete cat with active bookings'
            });
        }

        // Soft delete (set is_active to false)
        await query(
            'UPDATE cats SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [catId]
        );

        res.status(200).json({
            success: true,
            message: 'Cat deleted successfully'
        });

    } catch (error) {
        console.error('Delete cat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting cat'
        });
    }
});

// @route   POST /api/cats/:id/avatar
// @desc    Upload cat avatar
// @access  Private (Owner or Admin)
router.post('/:id/avatar', authenticateToken, commonValidation.id, handleValidationErrors, async (req, res) => {
    try {
        const catId = req.params.id;

        // Check if cat exists and ownership
        const existingCat = await query('SELECT user_id FROM cats WHERE id = ?', [catId]);
        
        if (existingCat.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cat not found'
            });
        }

        // Check ownership (admin can update any cat)
        if (req.user.role !== 'admin' && existingCat[0].user_id !== req.user.id) {
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
        const fileName = `cat_${catId}_${uuidv4()}${fileExtension}`;
        const uploadPath = path.join(process.env.UPLOAD_PATH || './uploads', 'cats', fileName);

        // Move file
        await avatar.mv(uploadPath);

        // Update cat avatar in database
        const avatarUrl = `/uploads/cats/${fileName}`;
        await query(
            'UPDATE cats SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [avatarUrl, catId]
        );

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar_url: avatarUrl
            }
        });

    } catch (error) {
        console.error('Upload cat avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading avatar'
        });
    }
});

// @route   GET /api/cats/breeds
// @desc    Get list of cat breeds
// @access  Public
router.get('/meta/breeds', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT breed, COUNT(*) as count
            FROM cats
            WHERE breed IS NOT NULL AND breed != '' AND is_active = TRUE
            GROUP BY breed
            ORDER BY count DESC, breed ASC
        `;

        const breeds = await query(sql);

        res.status(200).json({
            success: true,
            data: {
                breeds
            }
        });

    } catch (error) {
        console.error('Get breeds error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching breeds'
        });
    }
});

module.exports = router;