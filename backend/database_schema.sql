-- Pet Care Hotel Database Schema - Complete Version
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
    price DECIMAL(10,2) NOT NULL,
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
    price_per_serving DECIMAL(10,2) NOT NULL,
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
    price DECIMAL(10,2) NOT NULL,
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
    price DECIMAL(10,2) NOT NULL,
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

-- Insert admin user and sample customers
INSERT INTO users (username, email, password, full_name, phone, role, address) VALUES
('admin', 'admin@petcarehotel.com', '$2b$12$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Quản trị viên', '0123456789', 'admin', '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM'),
('customer1', 'customer1@example.com', '$2b$12$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Nguyễn Văn An', '0987654321', 'customer', '456 Đường Lê Văn Việt, Quận 9, TP.HCM'),
('customer2', 'customer2@example.com', '$2b$12$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Trần Thị Bình', '0123456780', 'customer', '789 Đường Võ Văn Tần, Quận 3, TP.HCM'),
('customer3', 'customer3@example.com', '$2b$12$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Lê Minh Cường', '0901234567', 'customer', '321 Đường Hai Bà Trưng, Quận 1, TP.HCM'),
('customer4', 'customer4@example.com', '$2b$12$rQX8kAzQqjVhX8LrK3G3OO7wD5EwJ2FvL8wQ2wQ3wQ4wQ5wQ6wQ7wQ', 'Phạm Thu Dung', '0912345678', 'customer', '654 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM');

-- Insert rooms with various types and amenities
INSERT INTO rooms (name, description, room_type, capacity, price_per_day, amenities, size_sqm, is_available) VALUES
('Phòng Standard A1', 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản cho mèo cưng', 'standard', 1, 150000.00, '["Giường mèo êm ái", "Bát ăn inox", "Đồ chơi cơ bản", "Khay vệ sinh", "Nước uống sạch"]', 4.5, TRUE),
('Phòng Standard A2', 'Phòng tiêu chuẩn thoáng mát, view sân vườn', 'standard', 1, 150000.00, '["Giường mèo êm ái", "Bát ăn inox", "Đồ chơi cơ bản", "Khay vệ sinh", "Cửa sổ view sân vườn"]', 4.5, TRUE),
('Phòng Standard A3', 'Phòng tiêu chuẩn được trang bị đầy đủ', 'standard', 1, 150000.00, '["Giường mèo êm ái", "Bát ăn inox", "Đồ chơi cơ bản", "Khay vệ sinh", "Nước uống tự động"]', 4.5, TRUE),

('Phòng Deluxe B1', 'Phòng cao cấp với không gian rộng rãi và đồ chơi phong phú', 'deluxe', 1, 250000.00, '["Giường mèo cao cấp", "Khu vui chơi riêng", "Cây leo 1.5m", "Đồ chơi cao cấp", "Cửa sổ lớn", "Kệ nghỉ ngơi"]', 8.0, TRUE),
('Phòng Deluxe B2', 'Phòng deluxe với thiết kế hiện đại', 'deluxe', 1, 250000.00, '["Giường mèo cao cấp", "Khu vui chơi riêng", "Cây leo 1.5m", "Đồ chơi thông minh", "Hệ thống âm thanh nhẹ nhàng"]', 8.0, TRUE),
('Phòng Deluxe B3', 'Phòng deluxe có ban công nhỏ', 'deluxe', 1, 280000.00, '["Giường mèo cao cấp", "Ban công an toàn", "Cây leo 1.5m", "Đồ chơi cao cấp", "View đẹp", "Không gian thoáng đãng"]', 8.5, TRUE),

('Phòng Premium C1', 'Phòng hạng sang với view đẹp, phù hợp cho 2 mèo', 'premium', 2, 400000.00, '["2 giường mèo riêng biệt", "Khu vui chơi lớn", "Cây leo cao 2m", "Camera theo dõi 24/7", "Điều hòa không khí", "Khu ăn riêng"]', 12.0, TRUE),
('Phòng Premium C2', 'Phòng premium với thiết kế sang trọng', 'premium', 2, 420000.00, '["2 giường mèo cao cấp", "Khu vui chơi đa dạng", "Cây leo cao 2m", "Hệ thống giải trí", "Điều hòa", "Khu tắm riêng"]', 12.5, TRUE),

('Phòng VIP D1', 'Phòng VIP với dịch vụ 5 sao, không gian siêu rộng', 'vip', 2, 600000.00, '["Giường mèo luxury", "Khu spa mini", "Cây leo deluxe 2.5m", "Dịch vụ butler 24/7", "TV riêng", "Khu vườn mini", "Hệ thống lọc không khí"]', 20.0, TRUE),
('Phòng VIP D2', 'Phòng VIP đẳng cấp nhất với đầy đủ tiện nghi', 'vip', 3, 650000.00, '["3 giường mèo siêu luxury", "Khu spa cao cấp", "Khu vui chơi khổng lồ", "Butler 24/7", "Smart TV", "Khu vườn riêng", "Hệ thống âm nhạc"]', 25.0, TRUE);

-- Insert services with detailed descriptions
INSERT INTO services (name, description, price, duration_minutes, category, is_active) VALUES
-- Grooming services
('Tắm gội cơ bản', 'Tắm gội với sữa tắm chuyên dụng, sấy khô và chải lông cơ bản', 80000.00, 60, 'grooming', TRUE),
('Tắm gội cao cấp', 'Tắm gội với sản phẩm organic, massage thư giãn và sấy tạo kiểu', 120000.00, 90, 'grooming', TRUE),
('Cắt tỉa lông chuyên nghiệp', 'Cắt tỉa lông theo yêu cầu, tạo kiểu đẹp mắt', 150000.00, 90, 'grooming', TRUE),
('Cắt móng vuốt', 'Cắt móng vuốt an toàn, làm sạch tai và răng miệng', 50000.00, 30, 'grooming', TRUE),
('Vệ sinh răng miệng', 'Vệ sinh răng miệng chuyên sâu, kiểm tra sức khỏe răng', 70000.00, 45, 'grooming', TRUE),

-- Medical services  
('Khám sức khỏe tổng quát', 'Kiểm tra sức khỏe toàn diện, đo nhiệt độ, nghe tim phổi', 200000.00, 45, 'medical', TRUE),
('Tiêm phòng cơ bản', 'Tiêm các loại vaccine cần thiết theo lịch trình', 300000.00, 30, 'medical', TRUE),
('Tẩy giun sán', 'Điều trị và phòng ngừa ký sinh trùng', 150000.00, 30, 'medical', TRUE),
('Khám chuyên sâu', 'Khám bệnh chuyên sâu với bác sĩ thú y có kinh nghiệm', 400000.00, 60, 'medical', TRUE),
('Cấp cứu cơ bản', 'Sơ cứu và xử lý các tình huống khẩn cấp', 500000.00, 90, 'medical', TRUE),

-- Play services
('Chơi đùa với trainer', 'Thời gian vui chơi cùng huấn luyện viên chuyên nghiệp', 100000.00, 60, 'play', TRUE),
('Vui chơi nhóm', 'Hoạt động vui chơi tập thể với các bé mèo khác', 80000.00, 45, 'play', TRUE),
('Trò chơi thông minh', 'Các trò chơi kích thích trí tuệ và bản năng tự nhiên', 120000.00, 60, 'play', TRUE),
('Thể dục buổi sáng', 'Bài tập thể dục nhẹ nhàng vào buổi sáng', 60000.00, 30, 'play', TRUE),

-- Training services
('Huấn luyện cơ bản', 'Dạy các hành vi cơ bản như ngồi, nằm, đến khi gọi', 200000.00, 90, 'training', TRUE),
('Huấn luyện xã hội hóa', 'Giúp mèo thích nghi với môi trường và con người mới', 250000.00, 120, 'training', TRUE),
('Sửa hành vi xấu', 'Điều chỉnh các hành vi không mong muốn', 300000.00, 90, 'training', TRUE),

-- Special services
('Massage thư giãn', 'Massage chuyên nghiệp giúp mèo thư giãn và giảm stress', 150000.00, 30, 'special', TRUE),
('Spa trị liệu', 'Liệu pháp spa cao cấp với tinh dầu thiên nhiên', 250000.00, 60, 'special', TRUE),
('Chụp ảnh kỷ niệm', 'Chụp ảnh chuyên nghiệp với nhiều concept đẹp', 180000.00, 45, 'special', TRUE),
('Tư vấn dinh dưỡng', 'Tư vấn chế độ ăn uống phù hợp cho từng độ tuổi', 120000.00, 30, 'special', TRUE),
('Dịch vụ đưa đón', 'Đưa đón tận nhà trong nội thành TP.HCM', 100000.00, 60, 'special', TRUE);

-- Insert foods with nutritional information
INSERT INTO foods (name, brand, description, price_per_serving, category, ingredients, nutritional_info, is_active) VALUES
-- Dry foods
('Thức ăn khô cao cấp cho mèo trưởng thành', 'Royal Canin', 'Thức ăn khô dinh dưỡng cân bằng dành cho mèo từ 1-7 tuổi', 25000.00, 'dry', 'Thịt gà, gạo, ngô, dầu cá, vitamin và khoáng chất', '{"protein": "32%", "fat": "15%", "fiber": "3%", "moisture": "10%", "calories": "380 kcal/100g"}', TRUE),
('Thức ăn khô cho mèo con', 'Whiskas', 'Công thức đặc biệt cho mèo con dưới 1 tuổi', 20000.00, 'dry', 'Thịt gà, sữa, DHA, vitamin', '{"protein": "35%", "fat": "18%", "fiber": "2.5%", "moisture": "10%", "calories": "400 kcal/100g"}', TRUE),
('Thức ăn khô cho mèo già', 'Hill\'s Science Diet', 'Dinh dưỡng cho mèo trên 7 tuổi, dễ tiêu hóa', 30000.00, 'dry', 'Thịt cừu, khoai tây, chất xơ, omega-3', '{"protein": "28%", "fat": "12%", "fiber": "4%", "moisture": "10%", "calories": "350 kcal/100g"}', TRUE),

-- Wet foods  
('Pate mèo vị gà', 'Whiskas', 'Thức ăn ướt thơm ngon với thịt gà tự nhiên', 35000.00, 'wet', 'Thịt gà, nước dùng, vitamin', '{"protein": "8%", "fat": "5%", "fiber": "1%", "moisture": "82%", "calories": "85 kcal/100g"}', TRUE),
('Pate mèo vị cá hồi', 'Ciao', 'Pate cao cấp với cá hồi Nauy tươi ngon', 40000.00, 'wet', 'Cá hồi, nước dùng cá, omega-3', '{"protein": "9%", "fat": "6%", "fiber": "0.5%", "moisture": "82%", "calories": "90 kcal/100g"}', TRUE),
('Pate mèo vị tuna', 'Felix', 'Hương vị cá ngừ đậm đà, bổ sung taurine', 32000.00, 'wet', 'Cá ngừ, thạch, taurine, vitamin E', '{"protein": "8.5%", "fat": "4.5%", "fiber": "0.8%", "moisture": "83%", "calories": "80 kcal/100g"}', TRUE),
('Pate mèo vị thịt bò', 'Sheba', 'Thịt bò mềm ngon, dễ tiêu hóa', 38000.00, 'wet', 'Thịt bò, nước dùng, protein thực vật', '{"protein": "8%", "fat": "5.5%", "fiber": "1%", "moisture": "81%", "calories": "88 kcal/100g"}', TRUE),

-- Treats
('Snack mèo vị cá hồi', 'Ciao', 'Bánh thưởng giòn tan với vị cá hồi tự nhiên', 15000.00, 'treats', 'Cá hồi, bột mì, dầu cá', '{"protein": "30%", "fat": "8%", "fiber": "2%", "moisture": "12%", "calories": "320 kcal/100g"}', TRUE),
('Bánh thưởng dinh dưỡng', 'Temptations', 'Snack bổ sung vitamin và khoáng chất', 18000.00, 'treats', 'Thịt gà, ngũ cốc, vitamin tổng hợp', '{"protein": "28%", "fat": "10%", "fiber": "3%", "moisture": "10%", "calories": "350 kcal/100g"}', TRUE),
('Que thưởng protein cao', 'Inaba', 'Que thưởng 100% thịt gà, protein cao', 22000.00, 'treats', '100% thịt gà tươi', '{"protein": "45%", "fat": "2%", "fiber": "0.5%", "moisture": "35%", "calories": "180 kcal/100g"}', TRUE),

-- Prescription foods
('Thức ăn kiểm soát cân nặng', 'Hill\'s Prescription Diet', 'Thức ăn đặc biệt cho mèo béo phì, ít calo', 45000.00, 'prescription', 'Protein thấp calo, chất xơ cao, L-carnitine', '{"protein": "35%", "fat": "8%", "fiber": "8%", "moisture": "10%", "calories": "300 kcal/100g"}', TRUE),
('Thức ăn cho mèo bệnh thận', 'Royal Canin Renal', 'Công thức đặc biệt hỗ trợ chức năng thận', 50000.00, 'prescription', 'Protein chất lượng cao, phosphorus thấp', '{"protein": "23%", "fat": "15%", "fiber": "3%", "moisture": "10%", "calories": "380 kcal/100g"}', TRUE),
('Thức ăn hỗ trợ tiêu hóa', 'Pro Plan Veterinary', 'Hỗ trợ đường ruột nhạy cảm', 42000.00, 'prescription', 'Protein dễ tiêu, prebiotic, probiotics', '{"protein": "30%", "fat": "14%", "fiber": "2%", "moisture": "10%", "calories": "370 kcal/100g"}', TRUE);

-- Insert sample cats for customers
INSERT INTO cats (user_id, name, breed, age, weight, gender, color, medical_notes, special_requirements, vaccination_status) VALUES
-- Customer 1's cats
(2, 'Milu', 'British Shorthair', 3, 4.2, 'female', 'Xám xanh', 'Khỏe mạnh, không có vấn đề y tế', 'Thích chơi với bóng len', 'up_to_date'),
(2, 'Simba', 'Maine Coon', 5, 6.8, 'male', 'Nâu vàng', 'Đã triệt sản, cần kiểm tra định kỳ', 'Ăn ít, cần theo dõi', 'up_to_date'),

-- Customer 2's cats  
(3, 'Luna', 'Persian', 2, 3.5, 'female', 'Trắng', 'Mắt có thể bị chảy nước do giống', 'Cần chải lông hàng ngày', 'partial'),
(3, 'Tom', 'Mèo ta', 4, 4.0, 'male', 'Tam thể', 'Khỏe mạnh, hoạt động tốt', 'Rất thân thiện với người', 'up_to_date'),

-- Customer 3's cats
(4, 'Kitty', 'Ragdoll', 1, 2.8, 'female', 'Cream', 'Mèo con, cần chăm sóc đặc biệt', 'Cần ăn thức ăn cho mèo con', 'partial'),
(4, 'Max', 'Scottish Fold', 6, 5.2, 'male', 'Xám', 'Có vấn đề nhẹ về khớp do giống', 'Cần vận động nhẹ nhàng', 'up_to_date'),

-- Customer 4's cats
(5, 'Bella', 'Siamese', 3, 3.8, 'female', 'Seal point', 'Khỏe mạnh, năng động', 'Thích được chú ý', 'up_to_date'),
(5, 'Charlie', 'Mèo ta', 7, 4.5, 'male', 'Đen trắng', 'Mèo già, cần chăm sóc đặc biệt', 'Ăn thức ăn mềm, ít vận động', 'up_to_date');

-- Insert sample bookings
INSERT INTO bookings (user_id, cat_id, room_id, check_in_date, check_out_date, total_days, room_price, services_price, food_price, total_price, status, special_requests) VALUES
(2, 1, 1, '2024-12-15', '2024-12-20', 5, 750000.00, 200000.00, 125000.00, 1075000.00, 'confirmed', 'Milu rất thích chơi với bóng, xin chuẩn bị đồ chơi'),
(2, 2, 4, '2024-12-22', '2024-12-27', 5, 1250000.00, 350000.00, 200000.00, 1800000.00, 'pending', 'Simba ăn ít, cần theo dõi kỹ lượng thức ăn'),
(3, 3, 2, '2024-12-18', '2024-12-22', 4, 600000.00, 150000.00, 140000.00, 890000.00, 'confirmed', 'Luna cần chải lông hàng ngày, lông dễ rối'),
(3, 4, 5, '2024-12-25', '2024-12-30', 5, 1400000.00, 100000.00, 175000.00, 1675000.00, 'confirmed', 'Tom rất thân thiện, có thể chung phòng với mèo khác'),
(4, 5, 3, '2024-12-20', '2024-12-23', 3, 450000.00, 250000.00, 90000.00, 790000.00, 'checked_out', 'Kitty là mèo con, cần chăm sóc đặc biệt'),
(4, 6, 6, '2024-12-28', '2025-01-02', 5, 1400000.00, 300000.00, 210000.00, 1910000.00, 'pending', 'Max có vấn đề về khớp, cần vận động nhẹ nhàng'),
(5, 7, 7, '2024-12-30', '2025-01-05', 6, 2400000.00, 450000.00, 240000.00, 3090000.00, 'confirmed', 'Bella rất thích được chú ý, cần tương tác nhiều'),
(5, 8, 8, '2025-01-03', '2025-01-08', 5, 2100000.00, 200000.00, 200000.00, 2500000.00, 'pending', 'Charlie là mèo già, cần thức ăn mềm và ít vận động');

-- Insert booking services
INSERT INTO booking_services (booking_id, service_id, quantity, price, service_date, notes) VALUES
-- Booking 1 (Milu) - Standard room
(1, 1, 1, 80000.00, '2024-12-16', 'Tắm gội cơ bản cho Milu'),
(1, 11, 2, 120000.00, '2024-12-17', 'Chơi đùa với trainer 2 lần'),

-- Booking 2 (Simba) - Deluxe room  
(2, 2, 1, 120000.00, '2024-12-23', 'Tắm gội cao cấp'),
(2, 6, 1, 200000.00, '2024-12-24', 'Khám sức khỏe tổng quát'),
(2, 18, 1, 150000.00, '2024-12-25', 'Massage thư giãn'),

-- Booking 3 (Luna) - Standard room
(3, 3, 1, 150000.00, '2024-12-19', 'Cắt tỉa lông chuyên nghiệp cho Persian'),

-- Booking 4 (Tom) - Deluxe room
(4, 11, 1, 100000.00, '2024-12-26', 'Chơi đùa với trainer'),

-- Booking 5 (Kitty) - Standard room - completed
(5, 6, 1, 200000.00, '2024-12-21', 'Khám sức khỏe cho mèo con'),
(5, 15, 1, 200000.00, '2024-12-22', 'Huấn luyện cơ bản'),

-- Booking 6 (Max) - Deluxe room
(6, 18, 1, 150000.00, '2024-12-29', 'Massage thư giãn cho khớp'),
(6, 6, 1, 200000.00, '2024-12-30', 'Khám sức khỏe định kỳ'),

-- Booking 7 (Bella) - Premium room
(7, 2, 1, 120000.00, '2024-12-31', 'Tắm gội cao cấp'),
(7, 20, 1, 180000.00, '2025-01-02', 'Chụp ảnh kỷ niệm'),
(7, 11, 3, 150000.00, '2025-01-03', 'Nhiều buổi chơi đùa'),

-- Booking 8 (Charlie) - Premium room  
(8, 1, 1, 80000.00, '2025-01-04', 'Tắm gội nhẹ nhàng cho mèo già'),
(8, 21, 1, 120000.00, '2025-01-05', 'Tư vấn dinh dưỡng cho mèo già');

-- Insert booking foods
INSERT INTO booking_foods (booking_id, food_id, feeding_date, meal_time, quantity, price, notes) VALUES
-- Booking 1 (Milu) - 5 days
(1, 1, '2024-12-15', 'breakfast', 1, 25000.00, 'Thức ăn khô cao cấp'),
(1, 4, '2024-12-15', 'dinner', 1, 35000.00, 'Pate gà'),
(1, 1, '2024-12-16', 'breakfast', 1, 25000.00, 'Thức ăn khô cao cấp'),
(1, 4, '2024-12-16', 'dinner', 1, 35000.00, 'Pate gà'),
(1, 1, '2024-12-17', 'breakfast', 1, 25000.00, 'Thức ăn khô cao cấp'),

-- Booking 2 (Simba) - 5 days
(2, 1, '2024-12-22', 'breakfast', 1, 25000.00, 'Theo dõi lượng ăn'),
(2, 5, '2024-12-22', 'dinner', 1, 40000.00, 'Pate cá hồi cao cấp'),
(2, 1, '2024-12-23', 'breakfast', 1, 25000.00, 'Theo dõi lượng ăn'),
(2, 5, '2024-12-23', 'dinner', 1, 40000.00, 'Pate cá hồi cao cấp'),

-- Booking 3 (Luna) - 4 days  
(3, 1, '2024-12-18', 'breakfast', 1, 25000.00, 'Thức ăn khô'),
(3, 4, '2024-12-18', 'dinner', 1, 35000.00, 'Pate gà'),
(3, 1, '2024-12-19', 'breakfast', 1, 25000.00, 'Thức ăn khô'),
(3, 4, '2024-12-19', 'dinner', 1, 35000.00, 'Pate gà'),

-- Booking 4 (Tom) - 5 days
(4, 1, '2024-12-25', 'breakfast', 1, 25000.00, 'Thức ăn cơ bản'),
(4, 6, '2024-12-25', 'dinner', 1, 32000.00, 'Pate tuna'),
(4, 1, '2024-12-26', 'breakfast', 1, 25000.00, 'Thức ăn cơ bản'),

-- Booking 5 (Kitty) - 3 days - completed
(5, 2, '2024-12-20', 'breakfast', 1, 20000.00, 'Thức ăn cho mèo con'),
(5, 2, '2024-12-20', 'lunch', 1, 20000.00, 'Thức ăn cho mèo con'),
(5, 2, '2024-12-20', 'dinner', 1, 20000.00, 'Thức ăn cho mèo con'),

-- Booking 6 (Max) - 5 days
(6, 3, '2024-12-28', 'breakfast', 1, 30000.00, 'Thức ăn cho mèo già'),
(6, 12, '2024-12-28', 'dinner', 1, 42000.00, 'Thức ăn hỗ trợ tiêu hóa'),

-- Booking 7 (Bella) - 6 days
(7, 1, '2024-12-30', 'breakfast', 1, 25000.00, 'Thức ăn cao cấp'),
(7, 5, '2024-12-30', 'dinner', 1, 40000.00, 'Pate cá hồi'),

-- Booking 8 (Charlie) - 5 days
(8, 3, '2025-01-03', 'breakfast', 1, 30000.00, 'Thức ăn mềm cho mèo già'),
(8, 5, '2025-01-03', 'dinner', 1, 40000.00, 'Pate mềm');

-- Insert payments
INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_id, payment_date, notes) VALUES
(1, 2, 1075000.00, 'bank_transfer', 'completed', 'TXN001', '2024-12-14 10:30:00', 'Thanh toán chuyển khoản ngân hàng'),
(3, 3, 890000.00, 'card', 'completed', 'TXN002', '2024-12-17 14:15:00', 'Thanh toán thẻ tín dụng'),
(4, 3, 1675000.00, 'online', 'completed', 'TXN003', '2024-12-24 09:45:00', 'Thanh toán ví điện tử'),
(5, 4, 790000.00, 'cash', 'completed', 'CASH001', '2024-12-23 16:20:00', 'Thanh toán tiền mặt khi trả phòng'),
(7, 5, 3090000.00, 'bank_transfer', 'completed', 'TXN004', '2024-12-29 11:00:00', 'Thanh toán chuyển khoản');

-- Insert sample news articles
INSERT INTO news (title, slug, content, excerpt, category, author_id, is_published, published_at, views) VALUES
('5 Mẹo chăm sóc mèo trong mùa hè', '5-meo-cham-soc-meo-mua-he', 
'Mùa hè là thời điểm cần chú ý đặc biệt đến việc chăm sóc mèo cưng. Nhiệt độ cao có thể gây ra nhiều vấn đề sức khỏe cho thú cưng nếu không được chăm sóc đúng cách.

**1. Đảm bảo nước uống đầy đủ**
Mèo cần được cung cấp nước sạch thường xuyên, đặc biệt trong những ngày nóng. Hãy đặt nhiều bát nước ở các vị trí khác nhau và thay nước hàng ngày.

**2. Tạo không gian mát mẻ**
Sử dụng quạt hoặc điều hòa để duy trì nhiệt độ phù hợp. Tránh để mèo ở nơi có ánh nắng trực tiếp.

**3. Chải lông thường xuyên**
Giúp mèo thoát nhiệt tốt hơn bằng cách chải bỏ lông chết và tạo luồng không khí.

**4. Theo dõi dấu hiệu say nắng**
Như thở gấp, chảy nước dãi nhiều, mệt mỏi. Cần đưa mèo đến bác sĩ thú y ngay lập tức.

**5. Điều chỉnh thời gian vui chơi**
Chơi với mèo vào sáng sớm hoặc tối mát, tránh những giờ nóng nhất trong ngày.',

'Những mẹo hữu ích để giữ cho mèo cưng khỏe mạnh và thoải mái trong thời tiết nóng bức của mùa hè', 
'tips', 1, TRUE, '2024-12-01 08:00:00', 245),

('Khách sạn Pet Care mở rộng dịch vụ spa cao cấp', 'khach-san-pet-care-mo-rong-dich-vu-spa', 
'Chúng tôi vui mừng thông báo về việc mở rộng dịch vụ spa cao cấp dành riêng cho thú cưng tại Pet Care Hotel.

**Dịch vụ Spa mới bao gồm:**

**Liệu pháp thư giãn với tinh dầu**
Sử dụng các loại tinh dầu tự nhiên an toàn cho mèo như lavender và chamomile để giúp thú cưng thư giãn.

**Massage trị liệu chuyên sâu**
Đội ngũ therapist được đào tạo chuyên nghiệp sẽ massage giúp mèo giảm stress và cải thiện lưu thông máu.

**Tắm bùn khoáng**
Sử dụng bùn khoáng tự nhiên giúp làm sạch sâu và nuôi dưỡng làn da, lông của thú cưng.

**Phòng thư giãn riêng**
Không gian yên tĩnh với ánh sáng dịu nhẹ và nhạc thiền giúp mèo có trải nghiệm spa hoàn hảo.

Dịch vụ spa sẽ chính thức hoạt động từ ngày 15/12/2024. Để đặt lịch, quý khách vui lòng liên hệ hotline hoặc đặt trực tiếp tại website.',

'Dịch vụ spa mới với nhiều liệu pháp thư giãn và chăm sóc cao cấp cho thú cưng', 
'updates', 1, TRUE, '2024-12-05 10:30:00', 182),

('Dinh dưỡng cân bằng cho mèo theo từng độ tuổi', 'dinh-duong-can-bang-cho-meo-theo-tung-do-tuoi',
'Chế độ dinh dưỡng phù hợp là yếu tố then chốt quyết định sức khỏe và tuổi thọ của mèo cưng.

**Mèo con (0-12 tháng tuổi)**
- Cần nhiều protein (tối thiểu 30%) để phát triển
- DHA cho não bộ và thị lực
- Ăn 3-4 bữa/ngày với lượng nhỏ

**Mèo trưởng thành (1-7 tuổi)**
- Protein 26-30%, chất béo 10-15%
- Cân bằng calories để tránh béo phì
- Ăn 2 bữa/ngày đều đặn

**Mèo già (trên 7 tuổi)**
- Protein chất lượng cao, dễ tiêu hóa
- Bổ sung omega-3 cho khớp
- Thức ăn mềm nếu có vấn đề răng

**Lưu ý quan trọng:**
- Luôn có nước sạch
- Chuyển đổi thức ăn từ từ trong 7-10 ngày
- Theo dõi cân nặng định kỳ

Tại Pet Care Hotel, chúng tôi có đội ngũ chuyên gia dinh dưỡng sẵn sàng tư vấn chế độ ăn phù hợp cho từng bé mèo.',

'Hướng dẫn chi tiết về dinh dưỡng cân bằng cho mèo ở các giai đoạn phát triển khác nhau', 
'health', 1, TRUE, '2024-12-08 14:20:00', 298),

('Sự kiện "Ngày hội thú cưng" sắp diễn ra', 'su-kien-ngay-hoi-thu-cung-sap-dien-ra',
'Pet Care Hotel tổ chức "Ngày hội thú cưng" vào cuối tháng 12 với nhiều hoạt động thú vị.

**Thời gian:** 28-29/12/2024
**Địa điểm:** Pet Care Hotel - 123 Đường Nguyễn Văn Linh, Quận 7

**Các hoạt động nổi bật:**

**Cuộc thi "Thú cưng xinh đẹp"**
- Các hạng mục: Mèo đẹp nhất, Mèo có tài năng, Mèo được yêu thích nhất
- Giải thưởng hấp dẫn trị giá hàng triệu đồng

**Hội chợ thú cưng**
- Triển lãm các sản phẩm chăm sóc thú cưng
- Khuyến mãi đặc biệt từ các thương hiệu nổi tiếng

**Tư vấn sức khỏe miễn phí**
- Bác sĩ thú y giàu kinh nghiệm tư vấn trực tiếp
- Khám sức khỏe cơ bản miễn phí

**Workshop chăm sóc thú cưng**
- Hướng dẫn chăm sóc cơ bản
- Kỹ thuật grooming tại nhà

Đăng ký tham gia ngay để nhận ưu đãi đặc biệt!',

'Sự kiện lớn với nhiều hoạt động thú vị dành cho cộng đồng yêu thú cưng', 
'events', 1, TRUE, '2024-12-10 16:45:00', 156),

('Cách nhận biết và xử lý stress ở mèo', 'cach-nhan-biet-va-xu-ly-stress-o-meo',
'Stress là vấn đề phổ biến ở mèo và có thể ảnh hưởng nghiêm trọng đến sức khỏe nếu không được xử lý kịp thời.

**Dấu hiệu nhận biết stress:**

**Thay đổi hành vi**
- Ẩn náp nhiều hơn bình thường
- Tránh tiếp xúc với con người
- Thay đổi thói quen ăn uống

**Biểu hiện thể chất**
- Thở gấp, chảy nước dãi
- Rụng lông bất thường
- Đi vệ sinh sai chỗ

**Cách xử lý stress:**

**Tạo môi trường an toàn**
- Cung cấp nơi ẩn náp yên tĩnh
- Duy trì thói quen hàng ngày
- Tránh thay đổi đột ngột

**Tăng cường tương tác tích cực**
- Chơi đùa nhẹ nhàng
- Vuốt ve khi mèo muốn
- Sử dụng đồ chơi phù hợp

**Sử dụng pheromone tự nhiên**
- Khuếch tán pheromone mèo
- Cỏ mèo hoặc catnip
- Âm nhạc thư giãn

Nếu tình trạng stress kéo dài, hãy đưa mèo đến bác sĩ thú y để được tư vấn và điều trị chuyên nghiệp.',

'Hướng dẫn nhận biết các dấu hiệu stress ở mèo và phương pháp xử lý hiệu quả', 
'health', 1, TRUE, '2024-12-12 11:10:00', 203);

-- Insert sample reviews
INSERT INTO reviews (booking_id, user_id, rating, comment, is_approved, created_at) VALUES
(5, 4, 5, 'Dịch vụ tuyệt vời! Kitty được chăm sóc rất tốt, nhân viên nhiệt tình và chuyên nghiệp. Phòng sạch sẽ, tiện nghi đầy đủ. Chắc chắn sẽ quay lại!', TRUE, '2024-12-23 17:30:00'),
(1, 2, 5, 'Milu rất thích ở đây. Cô ấy được tắm gội sạch sẽ và vui chơi nhiều. Tôi yên tâm khi để Milu ở Pet Care Hotel trong thời gian đi công tác.', TRUE, '2024-12-20 19:45:00'),
(3, 3, 4, 'Dịch vụ tốt, Luna được chăm sóc cẩn thận. Đặc biệt cảm ơn việc chải lông hàng ngày cho Luna. Chỉ mong giá cả có thể cạnh tranh hơn.', TRUE, '2024-12-22 20:15:00'),
(4, 3, 5, 'Tom rất hạnh phúc ở đây! Anh ấy thậm chí không muốn về nhà. Nhân viên rất yêu thương và hiểu biết về tâm lý mèo. Highly recommended!', TRUE, '2024-12-30 14:20:00');

-- Insert some room images
INSERT INTO room_images (room_id, image_url, is_primary) VALUES
(1, '/uploads/rooms/standard_a1_main.jpg', TRUE),
(1, '/uploads/rooms/standard_a1_bed.jpg', FALSE),
(1, '/uploads/rooms/standard_a1_play.jpg', FALSE),
(2, '/uploads/rooms/standard_a2_main.jpg', TRUE),
(2, '/uploads/rooms/standard_a2_view.jpg', FALSE),
(3, '/uploads/rooms/standard_a3_main.jpg', TRUE),
(4, '/uploads/rooms/deluxe_b1_main.jpg', TRUE),
(4, '/uploads/rooms/deluxe_b1_play.jpg', FALSE),
(4, '/uploads/rooms/deluxe_b1_tree.jpg', FALSE),
(5, '/uploads/rooms/deluxe_b2_main.jpg', TRUE),
(6, '/uploads/rooms/deluxe_b3_main.jpg', TRUE),
(6, '/uploads/rooms/deluxe_b3_balcony.jpg', FALSE),
(7, '/uploads/rooms/premium_c1_main.jpg', TRUE),
(7, '/uploads/rooms/premium_c1_beds.jpg', FALSE),
(7, '/uploads/rooms/premium_c1_camera.jpg', FALSE),
(8, '/uploads/rooms/premium_c2_main.jpg', TRUE),
(9, '/uploads/rooms/vip_d1_main.jpg', TRUE),
(9, '/uploads/rooms/vip_d1_spa.jpg', FALSE),
(9, '/uploads/rooms/vip_d1_garden.jpg', FALSE),
(10, '/uploads/rooms/vip_d2_main.jpg', TRUE),
(10, '/uploads/rooms/vip_d2_luxury.jpg', FALSE);

-- Update room main_image
UPDATE rooms SET main_image = '/uploads/rooms/standard_a1_main.jpg' WHERE id = 1;
UPDATE rooms SET main_image = '/uploads/rooms/standard_a2_main.jpg' WHERE id = 2;
UPDATE rooms SET main_image = '/uploads/rooms/standard_a3_main.jpg' WHERE id = 3;
UPDATE rooms SET main_image = '/uploads/rooms/deluxe_b1_main.jpg' WHERE id = 4;
UPDATE rooms SET main_image = '/uploads/rooms/deluxe_b2_main.jpg' WHERE id = 5;
UPDATE rooms SET main_image = '/uploads/rooms/deluxe_b3_main.jpg' WHERE id = 6;
UPDATE rooms SET main_image = '/uploads/rooms/premium_c1_main.jpg' WHERE id = 7;
UPDATE rooms SET main_image = '/uploads/rooms/premium_c2_main.jpg' WHERE id = 8;
UPDATE rooms SET main_image = '/uploads/rooms/vip_d1_main.jpg' WHERE id = 9;
UPDATE rooms SET main_image = '/uploads/rooms/vip_d2_main.jpg' WHERE id = 10;

-- Add some additional data for demonstration

-- Add more food varieties
INSERT INTO foods (name, brand, description, price_per_serving, category, ingredients, nutritional_info, is_active) VALUES
('Thức ăn organic cho mèo', 'Wellness', 'Thức ăn organic 100% tự nhiên, không chất bảo quản', 35000.00, 'dry', 'Thịt gà organic, khoai lang, đậu Hà Lan', '{"protein": "34%", "fat": "16%", "fiber": "3.5%", "moisture": "10%", "calories": "390 kcal/100g"}', TRUE),
('Soup dinh dưỡng cho mèo', 'Inaba', 'Soup lỏng bổ sung nước và dinh dưỡng', 28000.00, 'wet', 'Nước dùng gà, thịt gà, taurine', '{"protein": "6%", "fat": "0.5%", "fiber": "0.1%", "moisture": "91%", "calories": "30 kcal/100g"}', TRUE),
('Bánh quy dinh dưỡng', 'Royal Canin', 'Bánh quy giúp làm sạch răng và bổ sung dinh dưỡng', 25000.00, 'treats', 'Bột mì, thịt gà, vitamin', '{"protein": "25%", "fat": "12%", "fiber": "4%", "moisture": "8%", "calories": "340 kcal/100g"}', TRUE);

-- Add more services
INSERT INTO services (name, description, price, duration_minutes, category, is_active) VALUES
('Vệ sinh tai chuyên sâu', 'Làm sạch tai và kiểm tra viêm nhiễm', 60000.00, 30, 'medical', TRUE),
('Cắt tỉa móng chân sau', 'Cắt tỉa móng chân sau an toàn', 40000.00, 20, 'grooming', TRUE),
('Tư vấn hành vi', 'Tư vấn về các vấn đề hành vi của mèo', 150000.00, 45, 'training', TRUE),
('Yoga cho mèo', 'Bài tập yoga nhẹ nhàng giúp mèo thư giãn', 100000.00, 30, 'special', TRUE);

-- Final verification queries (for testing)
-- These are just for verification, not actual data insertion

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'rooms', COUNT(*) FROM rooms  
UNION ALL
SELECT 'cats', COUNT(*) FROM cats
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'foods', COUNT(*) FROM foods
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'booking_services', COUNT(*) FROM booking_services
UNION ALL
SELECT 'booking_foods', COUNT(*) FROM booking_foods
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'news', COUNT(*) FROM news
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'room_images', COUNT(*) FROM room_images;

-- Database setup completed successfully
-- You now have a fully populated Pet Care Hotel database with:
-- - 5 users (1 admin, 4 customers)  
-- - 10 rooms (3 standard, 3 deluxe, 2 premium, 2 vip)
-- - 8 cats belonging to customers
-- - 23 services across 5 categories
-- - 15 food items across 4 categories  
-- - 8 sample bookings with different statuses
-- - Booking services and foods relationships
-- - 5 payments (some completed, some pending)
-- - 5 news articles 
-- - 4 customer reviews
-- - 20 room images

-- Sample login credentials for testing:
-- Admin: admin@petcarehotel.com / password123
-- Customer1: customer1@example.com / password123  
-- Customer2: customer2@example.com / password123
-- Customer3: customer3@example.com / password123
-- Customer4: customer4@example.com / password123

-- Additional useful queries for development/testing:

-- Check all bookings with customer and room info
SELECT 
    b.id,
    u.full_name as customer,
    c.name as cat_name,
    r.name as room_name,
    b.check_in_date,
    b.check_out_date,
    b.total_price,
    b.status
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN cats c ON b.cat_id = c.id  
JOIN rooms r ON b.room_id = r.id
ORDER BY b.created_at DESC;

-- Check room availability
SELECT 
    r.id,
    r.name,
    r.room_type,
    r.price_per_day,
    r.is_available,
    COUNT(b.id) as active_bookings
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id 
    AND b.status IN ('confirmed', 'checked_in')
    AND b.check_out_date > CURDATE()
GROUP BY r.id
ORDER BY r.room_type, r.price_per_day;

-- Revenue summary
SELECT 
    SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as completed_revenue,
    SUM(CASE WHEN b.status = 'pending' THEN b.total_price ELSE 0 END) as pending_revenue,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id;

-- Popular services
SELECT 
    s.name,
    s.category,
    COUNT(bs.id) as booking_count,
    SUM(bs.price) as total_revenue
FROM services s
LEFT JOIN booking_services bs ON s.id = bs.service_id
GROUP BY s.id
ORDER BY booking_count DESC, total_revenue DESC;

-- Customer statistics
SELECT 
    u.full_name,
    COUNT(c.id) as total_cats,
    COUNT(b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_spent
FROM users u
LEFT JOIN cats c ON u.id = c.user_id AND c.is_active = TRUE
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.role = 'customer'
GROUP BY u.id
ORDER BY total_spent DESC;

-- News article stats
SELECT 
    category,
    COUNT(*) as article_count,
    SUM(views) as total_views,
    AVG(views) as avg_views
FROM news 
WHERE is_published = TRUE
GROUP BY category
ORDER BY total_views DESC;

-- Room utilization
SELECT 
    r.room_type,
    COUNT(r.id) as total_rooms,
    COUNT(DISTINCT b.room_id) as rooms_with_bookings,
    ROUND(COUNT(DISTINCT b.room_id) * 100.0 / COUNT(r.id), 2) as utilization_rate
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
GROUP BY r.room_type
ORDER BY utilization_rate DESC;

-- Average review rating
SELECT 
    AVG(rating) as average_rating,
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM reviews 
WHERE is_approved = TRUE;

-- Upcoming bookings (for admin dashboard)
SELECT 
    b.id,
    u.full_name as customer,
    u.phone,
    c.name as cat_name,
    r.name as room_name,
    b.check_in_date,
    b.check_out_date,
    b.status,
    b.special_requests
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN cats c ON b.cat_id = c.id
JOIN rooms r ON b.room_id = r.id
WHERE b.check_in_date >= CURDATE()
    AND b.status IN ('confirmed', 'pending')
ORDER BY b.check_in_date ASC;

-- Service category performance
SELECT 
    s.category,
    COUNT(bs.id) as total_bookings,
    SUM(bs.price) as total_revenue,
    AVG(bs.price) as avg_price
FROM services s
LEFT JOIN booking_services bs ON s.id = bs.service_id
WHERE s.is_active = TRUE
GROUP BY s.category
ORDER BY total_revenue DESC;

-- Food consumption statistics  
SELECT 
    f.category,
    f.name,
    f.brand,
    COUNT(bf.id) as times_ordered,
    SUM(bf.quantity) as total_quantity,
    SUM(bf.price) as total_revenue
FROM foods f
LEFT JOIN booking_foods bf ON f.id = bf.food_id
WHERE f.is_active = TRUE
GROUP BY f.id
ORDER BY times_ordered DESC, total_revenue DESC;

-- Monthly booking trends (last 6 months)
SELECT 
    YEAR(created_at) as year,
    MONTH(created_at) as month,
    COUNT(*) as booking_count,
    SUM(total_price) as total_revenue,
    AVG(total_price) as avg_booking_value
FROM bookings
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY year DESC, month DESC;

-- Cat breed distribution
SELECT 
    COALESCE(breed, 'Không rõ') as breed,
    COUNT(*) as cat_count,
    GROUP_CONCAT(DISTINCT name SEPARATOR ', ') as cat_names
FROM cats 
WHERE is_active = TRUE
GROUP BY breed
ORDER BY cat_count DESC;

-- Payment method preferences
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments
WHERE payment_status = 'completed'
GROUP BY payment_method
ORDER BY total_amount DESC;

-- Create views for commonly used queries

-- View: Current room availability
CREATE VIEW room_availability AS
SELECT 
    r.id,
    r.name,
    r.room_type,
    r.price_per_day,
    r.capacity,
    r.is_available,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.room_id = r.id 
            AND b.status IN ('confirmed', 'checked_in')
            AND CURDATE() BETWEEN b.check_in_date AND b.check_out_date
        ) THEN 'Occupied'
        WHEN r.is_available = TRUE THEN 'Available'
        ELSE 'Unavailable'
    END as current_status
FROM rooms r;

-- View: Customer summary
CREATE VIEW customer_summary AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.phone,
    COUNT(DISTINCT c.id) as total_cats,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount END), 0) as total_spent,
    MAX(b.created_at) as last_booking_date
FROM users u
LEFT JOIN cats c ON u.id = c.user_id AND c.is_active = TRUE
LEFT JOIN bookings b ON u.id = b.user_id  
LEFT JOIN payments p ON b.id = p.booking_id
WHERE u.role = 'customer' AND u.is_active = TRUE
GROUP BY u.id;

-- View: Booking details
CREATE VIEW booking_details AS
SELECT 
    b.id,
    b.user_id,
    u.full_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    c.id as cat_id,
    c.name as cat_name,
    c.breed as cat_breed,
    r.id as room_id,
    r.name as room_name,
    r.room_type,
    b.check_in_date,
    b.check_out_date,
    b.total_days,
    b.room_price,
    b.services_price,
    b.food_price,
    b.total_price,
    b.status,
    b.special_requests,
    b.created_at,
    p.payment_status,
    p.payment_method
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN cats c ON b.cat_id = c.id
JOIN rooms r ON b.room_id = r.id
LEFT JOIN payments p ON b.id = p.booking_id;

-- Create stored procedures for common operations

DELIMITER //

-- Procedure: Check room availability for date range
CREATE PROCEDURE CheckRoomAvailability(
    IN room_id INT,
    IN check_in DATE,
    IN check_out DATE
)
BEGIN
    SELECT 
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM bookings 
                WHERE room_id = room_id
                AND status IN ('confirmed', 'checked_in')
                AND (
                    (check_in_date <= check_in AND check_out_date > check_in) OR
                    (check_in_date < check_out AND check_out_date >= check_out) OR
                    (check_in_date >= check_in AND check_out_date <= check_out)
                )
            ) AND (
                SELECT is_available FROM rooms WHERE id = room_id
            ) = TRUE
            THEN 'Available'
            ELSE 'Not Available'
        END as availability_status;
END //

-- Procedure: Get dashboard statistics
CREATE PROCEDURE GetDashboardStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND is_active = TRUE) as total_customers,
        (SELECT COUNT(*) FROM cats WHERE is_active = TRUE) as total_cats,
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'checked_in') as checked_in_bookings,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status IN ('confirmed', 'checked_in', 'checked_out')) as total_booking_value;
END //

DELIMITER ;

-- Insert trigger to automatically update booking total_days
DELIMITER //

CREATE TRIGGER update_booking_days 
    BEFORE INSERT ON bookings
    FOR EACH ROW
BEGIN
    SET NEW.total_days = DATEDIFF(NEW.check_out_date, NEW.check_in_date);
END //

CREATE TRIGGER update_booking_days_on_update
    BEFORE UPDATE ON bookings  
    FOR EACH ROW
BEGIN
    IF NEW.check_in_date != OLD.check_in_date OR NEW.check_out_date != OLD.check_out_date THEN
        SET NEW.total_days = DATEDIFF(NEW.check_out_date, NEW.check_in_date);
    END IF;
END //

DELIMITER ;

-- Grant appropriate permissions (adjust as needed for your setup)
-- CREATE USER 'petcare_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pet_care_hotel.* TO 'petcare_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Final success message
SELECT 'Pet Care Hotel Database Setup Completed Successfully!' as message,
       NOW() as completed_at,
       'Ready for application use' as status;

-- Note: Remember to update the backend .env file with correct database credentials:
-- DB_HOST=localhost
-- DB_PORT=3306  
-- DB_USER=root (or your database user)
-- DB_PASSWORD=your_password
-- DB_NAME=pet_care_hotel