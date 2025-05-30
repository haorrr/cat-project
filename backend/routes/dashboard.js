// routes/dashboard.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const dashboardRouter = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview stats (Admin only)
// @access  Private/Admin
dashboardRouter.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get basic counts
        const stats = await Promise.all([
            query('SELECT COUNT(*) as total FROM users WHERE role = "customer"'),
            query('SELECT COUNT(*) as total FROM cats WHERE is_active = TRUE'),
            query('SELECT COUNT(*) as total FROM rooms'),
            query('SELECT COUNT(*) as total FROM bookings'),
            query('SELECT COUNT(*) as total FROM bookings WHERE status = "pending"'),
            query('SELECT COUNT(*) as total FROM bookings WHERE status = "confirmed"'),
            query('SELECT COUNT(*) as total FROM bookings WHERE status = "checked_in"'),
            query('SELECT SUM(total_price) as total FROM bookings WHERE status IN ("confirmed", "checked_in", "checked_out")'),
            query('SELECT SUM(amount) as total FROM payments WHERE payment_status = "completed"')
        ]);

        const overview = {
            total_customers: stats[0][0].total,
            total_cats: stats[1][0].total,
            total_rooms: stats[2][0].total,
            total_bookings: stats[3][0].total,
            pending_bookings: stats[4][0].total,
            confirmed_bookings: stats[5][0].total,
            checked_in_bookings: stats[6][0].total,
            total_revenue: stats[7][0].total || 0,
            total_payments: stats[8][0].total || 0
        };

        // Get recent bookings
        const recentBookings = await query(`
            SELECT 
                b.id,
                b.check_in_date,
                b.check_out_date,
                b.status,
                b.total_price,
                u.full_name as customer_name,
                c.name as cat_name,
                r.name as room_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN cats c ON b.cat_id = c.id
            JOIN rooms r ON b.room_id = r.id
            ORDER BY b.created_at DESC
            LIMIT 10
        `);

        // Get monthly revenue
        const monthlyRevenue = await query(`
            SELECT 
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                SUM(total_price) as revenue,
                COUNT(*) as booking_count
            FROM bookings
            WHERE status IN ('confirmed', 'checked_in', 'checked_out')
            AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY YEAR(created_at), MONTH(created_at)
            ORDER BY year DESC, month DESC
        `);

        // Get popular rooms
        const popularRooms = await query(`
            SELECT 
                r.id,
                r.name,
                r.room_type,
                COUNT(b.id) as booking_count,
                SUM(b.total_price) as total_revenue
            FROM rooms r
            LEFT JOIN bookings b ON r.id = b.room_id AND b.status IN ('confirmed', 'checked_in', 'checked_out')
            GROUP BY r.id
            ORDER BY booking_count DESC
            LIMIT 5
        `);

        res.status(200).json({
            success: true,
            data: {
                overview,
                recent_bookings: recentBookings,
                monthly_revenue: monthlyRevenue,
                popular_rooms: popularRooms
            }
        });

    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard data'
        });
    }
});

// @route   GET /api/dashboard/revenue
// @desc    Get revenue analytics (Admin only)
// @access  Private/Admin
dashboardRouter.get('/revenue', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = 'month', year, month } = req.query;

        let dateFilter = '';
        let groupBy = '';
        let params = [];

        if (period === 'day' && year && month) {
            dateFilter = 'WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?';
            groupBy = 'GROUP BY YEAR(created_at), MONTH(created_at), DAY(created_at)';
            params = [year, month];
        } else if (period === 'month') {
            dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
            groupBy = 'GROUP BY YEAR(created_at), MONTH(created_at)';
        } else if (period === 'year') {
            dateFilter = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 YEAR)';
            groupBy = 'GROUP BY YEAR(created_at)';
        }

        const revenueSql = `
            SELECT 
                ${period === 'day' ? 'DAY(created_at) as day,' : ''}
                ${period !== 'year' ? 'MONTH(created_at) as month,' : ''}
                YEAR(created_at) as year,
                SUM(total_price) as revenue,
                COUNT(*) as booking_count,
                AVG(total_price) as avg_booking_value
            FROM bookings
            ${dateFilter}
            AND status IN ('confirmed', 'checked_in', 'checked_out')
            ${groupBy}
            ORDER BY year DESC, month DESC ${period === 'day' ? ', day DESC' : ''}
        `;

        const revenueData = await query(revenueSql, params);

        // Get service revenue breakdown
        const serviceRevenue = await query(`
            SELECT 
                s.name,
                s.category,
                SUM(bs.price) as revenue,
                COUNT(bs.id) as service_count
            FROM booking_services bs
            JOIN services s ON bs.service_id = s.id
            JOIN bookings b ON bs.booking_id = b.id
            WHERE b.status IN ('confirmed', 'checked_in', 'checked_out')
            ${dateFilter.replace('created_at', 'b.created_at')}
            GROUP BY s.id
            ORDER BY revenue DESC
        `, params);

        res.status(200).json({
            success: true,
            data: {
                revenue_data: revenueData,
                service_revenue: serviceRevenue
            }
        });

    } catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching revenue data'
        });
    }
});

module.exports = dashboardRouter;