-- Pet Care Hotel Database Schema
-- Drop database if exists and create new one
DROP DATABASE IF EXISTS pet_care_hotel;
CREATE DATABASE pet_care_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pet_care_hotel;

-- Users table (customers and admin)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    room_type ENUM('standard', 'deluxe', 'premium', 'vip') NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    price_per_day DECIMAL(10,2) NOT NULL,
    amenities JSON,
    size_sqm DECIMAL(5,2),
    is_available BOOLEAN DEFAULT TRUE,
    main_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Room images table
CREATE TABLE room_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Cats table
CREATE TABLE cats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    breed VARCHAR(50),
    age INT,
    weight DECIMAL(4,2),
    gender ENUM('male', 'female') NOT NULL,
    color VARCHAR(50),
    medical_notes TEXT,
    special_requirements TEXT,
    vaccination_status ENUM('up_to_date', 'partial', 'none') DEFAULT 'none',
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Services table
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    duration_minutes INT,
    category ENUM('grooming', 'medical', 'play', 'training', 'special') NOT NULL,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Foods table
CREATE TABLE foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    description TEXT,
    price_per_serving DECIMAL(6,2) NOT NULL,
    category ENUM('dry', 'wet', 'treats', 'prescription') NOT NULL,
    ingredients TEXT,
    nutritional_info JSON,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    cat_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_days INT NOT NULL,
    room_price DECIMAL(10,2) NOT NULL,
    services_price DECIMAL(10,2) DEFAULT 0,
    food_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
    special_requests TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Booking services (many-to-many relationship)
CREATE TABLE booking_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(8,2) NOT NULL,
    service_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Booking foods (daily food schedule)
CREATE TABLE booking_foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    food_id INT NOT NULL,
    feeding_date DATE NOT NULL,
    meal_time ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(6,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'online') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- News table
CREATE TABLE news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(255),
    category ENUM('tips', 'health', 'events', 'updates', 'general') DEFAULT 'general',
    author_id INT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_available ON rooms(is_available);
CREATE INDEX idx_cats_user ON cats(user_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_news_published ON news(is_published, published_at);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);

-- Sample Data Insertion
-- Insert admin user
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('admin', 'admin@petcarehotel.com', '$2b$10$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Admin User', '0123456789', 'admin'),
('customer1', 'customer1@example.com', '$2b$10$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Nguyễn Văn A', '0987654321', 'customer'),
('customer2', 'customer2@example.com', '$2b$10$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Trần Thị B', '0123456780', 'customer');

-- Insert rooms
INSERT INTO rooms (name, description, room_type, capacity, price_per_day, amenities, size_sqm) VALUES
('Phòng Standard A1', 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản', 'standard', 1, 150000.00, '["Giường mèo", "Bát ăn", "Đồ chơi cơ bản"]', 4.5),
('Phòng Standard A2', 'Phòng tiêu chuẩn thoáng mát', 'standard', 1, 150000.00, '["Giường mèo", "Bát ăn", "Đồ chơi cơ bản"]', 4.5),
('Phòng Deluxe B1', 'Phòng cao cấp với không gian rộng rãi', 'deluxe', 1, 250000.00, '["Giường mèo cao cấp", "Khu vui chơi", "Cây leo", "Đồ chơi cao cấp"]', 8.0),
('Phòng Premium C1', 'Phòng hạng sang với view đẹp', 'premium', 2, 400000.00, '["2 giường mèo", "Khu vui chơi lớn", "Cây leo cao", "Camera theo dõi", "Điều hòa"]', 12.0),
('Phòng VIP D1', 'Phòng VIP với dịch vụ 5 sao', 'vip', 2, 600000.00, '["Giường mèo luxury", "Khu spa mini", "Đồ chơi cao cấp", "Dịch vụ butler", "TV riêng"]', 20.0);

-- Insert services
INSERT INTO services (name, description, price, duration_minutes, category) VALUES
('Tắm gội cơ bản', 'Tắm gội và vệ sinh cơ bản cho mèo', 80000.00, 60, 'grooming'),
('Cắt tỉa lông', 'Cắt tỉa lông chuyên nghiệp', 120000.00, 90, 'grooming'),
('Khám sức khỏe', 'Khám sức khỏe tổng quát', 200000.00, 45, 'medical'),
('Chơi đùa với trainer', 'Thời gian chơi đùa với huấn luyện viên', 100000.00, 60, 'play'),
('Massage thư giãn', 'Massage giúp mèo thư giãn', 150000.00, 30, 'special');

-- Insert foods
INSERT INTO foods (name, brand, description, price_per_serving, category) VALUES
('Thức ăn khô cao cấp', 'Royal Canin', 'Thức ăn khô dành cho mèo trưởng thành', 25000.00, 'dry'),
('Pate mèo vị gà', 'Whiskas', 'Thức ăn ướt vị gà thơm ngon', 35000.00, 'wet'),
('Snack mèo vị cá hồi', 'Ciao', 'Bánh thưởng vị cá hồi', 15000.00, 'treats'),
('Thức ăn kiểm soát cân nặng', 'Hill\'s', 'Thức ăn đặc biệt cho mèo béo phì', 40000.00, 'prescription');

-- Insert sample news
INSERT INTO news (title, slug, content, excerpt, category, author_id, is_published, published_at) VALUES
('5 Mẹo chăm sóc mèo trong mùa hè', '5-meo-cham-soc-meo-mua-he', 'Nội dung chi tiết về cách chăm sóc mèo trong mùa hè...', 'Những mẹo hữu ích để giữ cho mèo cưng khỏe mạnh trong thời tiết nóng', 'tips', 1, TRUE, NOW()),
('Khách sạn mèo mở rộng dịch vụ spa', 'khach-san-meo-mo-rong-dich-vu-spa', 'Chúng tôi vừa ra mắt dịch vụ spa cao cấp...', 'Dịch vụ spa mới với nhiều liệu pháp thư giãn cho mèo', 'updates', 1, TRUE, NOW());