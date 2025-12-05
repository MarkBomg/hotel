-- 创建数据库
CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

-- 用户表 (包含个人用户和管理员)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- 明文存储(实际项目中应加密)
    role ENUM('admin', 'personal') NOT NULL DEFAULT 'personal',
    vip_level ENUM('none', 'vip1', 'vip2', 'vip3') DEFAULT 'none',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客房类型表
CREATE TABLE room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(20) NOT NULL UNIQUE, -- standard, deluxe, executive
    name VARCHAR(50) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    total_count INT NOT NULL DEFAULT 0,
    available_count INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255)
);

-- 订单表
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_type_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INT NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    vip_level ENUM('none', 'vip1', 'vip2', 'vip3') DEFAULT 'none',
    base_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    final_price DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- 插入默认管理员账号
INSERT INTO users (username, password, role) VALUES 
('admin1', 'admin123', 'admin'),
('admin2', 'admin123', 'admin');

-- 插入客房类型数据
INSERT INTO room_types (type_code, name, description, base_price, original_price, total_count, available_count, image_url) VALUES 
('standard', '标准双人间', '舒适简约，经济之选，适合短期出差或旅行。', 399.00, 449.00, 20, 20, 'images/标准双人间.jpg'),
('deluxe', '豪华套房', '奢华宽敞，独立客厅，尊享行政酒廊待遇。', 899.00, 1129.00, 10, 10, 'images/豪华套房.jpg'),
('executive', '行政单间', '高层景观，商务办公设施齐全，行政礼遇。', 599.00, 700.00, 15, 15, 'images/行政单间.jpg');

-- 创建索引优化查询性能
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_dates ON orders(check_in, check_out);