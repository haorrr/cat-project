const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const catRoutes = require('./routes/cats');
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const foodRoutes = require('./routes/foods');
const newsRoutes = require('./routes/news');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');
const { startTokenCleanup } = require('./middleware/auth');

const app = express();

// Start token cleanup & test DB
startTokenCleanup();
connectDB();

// Security & CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = (req, res, next) => {
  next(); // Bỏ qua rate limiting hoàn toàn
};
app.use('/api/', limiter);

// Static files với CORS headers - ĐẶT TRƯỚC API ROUTES
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=86400'); // Cache 24 hours
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Debug middleware cho static files (có thể xóa sau khi test xong)


// Room routes TRƯỚC body parsing (vì dùng Multer)
app.use('/api/rooms', roomRoutes);

// Body parsing cho các route khác
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression & logging
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Các route API khác
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cats', catRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Pet Care Hotel API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test static files endpoint (có thể xóa sau khi test xong)
app.get('/api/test-static', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, 'uploads');
  const roomsPath = path.join(uploadsPath, 'rooms');
  
  res.json({
    uploadsExists: fs.existsSync(uploadsPath),
    roomsExists: fs.existsSync(roomsPath),
    uploadsPath: uploadsPath,
    roomsPath: roomsPath,
    files: fs.existsSync(roomsPath) ? fs.readdirSync(roomsPath) : [],
    sampleImageUrl: fs.existsSync(roomsPath) && fs.readdirSync(roomsPath).length > 0 
      ? `http://localhost:${process.env.PORT || 5000}/uploads/rooms/${fs.readdirSync(roomsPath)[0]}`
      : 'No images found'
  });
});

// Alternative image serving route (backup nếu static không hoạt động)
app.get('/api/image/rooms/:filename', (req, res) => {
  const fs = require('fs');
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'rooms', filename);
  
  console.log('🖼️ Image request:', filename);
  console.log('📍 File path:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'Image not found',
      requestedFile: filename,
      searchPath: filePath
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false, 
    message: 'API route not found',
    method: req.method,
    url: req.originalUrl
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🖼️ Images accessible at: http://localhost:${PORT}/uploads/rooms/[filename]`);
  console.log(`🔍 Test static setup: http://localhost:${PORT}/api/test-static`);
});

// Graceful shutdown
process.on('SIGTERM', () => { 
  console.log('💤 SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0)); 
});

process.on('SIGINT', () => { 
  console.log('💤 SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0)); 
});

module.exports = app;