const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pet_care_hotel',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00',
    charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Connected Successfully');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database Connection Failed:', error.message);
        return false;
    }
};

// Execute query helper function
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database Query Error:', error);
        throw error;
    }
};

// Execute query with multiple results (for procedures)
const queryMultiple = async (sql, params = []) => {
    try {
        const results = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database Query Error:', error);
        throw error;
    }
};

// Get connection for transactions
const getConnection = async () => {
    return await pool.getConnection();
};

// Transaction helper
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Database utilities
const dbUtils = {
    // Check if table exists
    tableExists: async (tableName) => {
        try {
            const sql = `
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = ? AND table_name = ?
            `;
            const result = await query(sql, [dbConfig.database, tableName]);
            return result[0].count > 0;
        } catch (error) {
            return false;
        }
    },

    // Get table structure
    getTableStructure: async (tableName) => {
        try {
            const sql = `DESCRIBE ${tableName}`;
            return await query(sql);
        } catch (error) {
            throw new Error(`Failed to get table structure for ${tableName}`);
        }
    },

    // Check database health
    healthCheck: async () => {
        try {
            const result = await query('SELECT 1 as healthy');
            return result[0].healthy === 1;
        } catch (error) {
            return false;
        }
    }
};

module.exports = {
    pool,
    connectDB,
    query,
    queryMultiple,
    getConnection,
    transaction,
    dbUtils
};