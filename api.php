<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 数据库连接配置
$host = 'localhost';
$dbname = 'hotel_management';
$username = 'root';
$password = 'Linux@2024';

// 创建数据库连接
$conn = new mysqli($host, $username, $password, $dbname);

// 检查连接
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => '数据库连接失败: ' . $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8");

// 获取请求方法
$method = $_SERVER['REQUEST_METHOD'];

// 获取请求数据
if ($method == 'POST' || $method == 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
}

// API 路由
$request = $_GET['action'] ?? '';

switch ($request) {
    case 'login':
        if ($method == 'POST') {
            loginUser($conn, $input);
        }
        break;
        
    case 'register':
        if ($method == 'POST') {
            registerUser($conn, $input);
        }
        break;
        
    case 'get_rooms':
        getRooms($conn);
        break;
        
    case 'update_room_counts':
        if ($method == 'POST') {
            updateRoomCounts($conn, $input);
        }
        break;
        
    case 'create_order':
        if ($method == 'POST') {
            createOrder($conn, $input);
        }
        break;
        
    case 'get_user_orders':
        if ($method == 'GET') {
            $userId = $_GET['user_id'] ?? 0;
            getUserOrders($conn, $userId);
        }
        break;
        
    case 'get_all_orders':
        if ($method == 'GET') {
            getAllOrders($conn);
        }
        break;
        
    case 'update_order_status':
        if ($method == 'PUT') {
            updateOrderStatus($conn, $input);
        }
        break;
        
    case 'search_orders':
        if ($method == 'GET') {
            $searchTerm = $_GET['search_term'] ?? '';
            searchOrders($conn, $searchTerm);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => '未知的API请求']);
        break;
}

// 用户登录
function loginUser($conn, $data) {
    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
        return;
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    try {
        $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if ($user && $user['password'] === $password) {
            // 登录成功
            unset($user['password']); // 不返回密码
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => '用户名或密码错误']);
        }
        $stmt->close();
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => '登录失败: ' . $e->getMessage()]);
    }
}

// 用户注册
function registerUser($conn, $data) {
    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
        return;
    }
    
    $username = $data['username'];
    $password = $data['password'];
    $vipLevel = $data['vip_level'] ?? 'none';
    $avatar = $data['avatar'] ?? 'https://picsum.photos/32/32?random=2';
    
    try {
        // 检查用户名是否已存在
        $checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $checkStmt->bind_param("s", $username);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->fetch_assoc()) {
            echo json_encode(['success' => false, 'message' => '用户名已存在']);
            $checkStmt->close();
            return;
        }
        $checkStmt->close();
        
        // 插入新用户
        $stmt = $conn->prepare("INSERT INTO users (username, password, role, vip_level, avatar) VALUES (?, ?, 'personal', ?, ?)");
        $stmt->bind_param("ssss", $username, $password, $vipLevel, $avatar);
        $stmt->execute();
        
        $userId = $stmt->insert_id;
        
        // 返回新用户信息
        $userStmt = $conn->prepare("SELECT id, username, role, vip_level, avatar, created_at FROM users WHERE id = ?");
        $userStmt->bind_param("i", $userId);
        $userStmt->execute();
        $result = $userStmt->get_result();
        $user = $result->fetch_assoc();
        
        echo json_encode(['success' => true, 'user' => $user]);
        
        $stmt->close();
        $userStmt->close();
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => '注册失败: ' . $e->getMessage()]);
    }
}

// 获取所有客房信息
function getRooms($conn) {
    try {
        $result = $conn->query("SELECT * FROM room_types");
        $rooms = [];
        while ($row = $result->fetch_assoc()) {
            $rooms[] = $row;
        }
        
        echo json_encode(['success' => true, 'rooms' => $rooms]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => '获取客房信息失败: ' . $e->getMessage()]);
    }
}

// 更新客房数量
function updateRoomCounts($conn, $data) {
    if (!isset($data['room_counts'])) {
        echo json_encode(['success' => false, 'message' => '缺少房间数量数据']);
        return;
    }
    
    try {
        $conn->autocommit(FALSE); // 开始事务
        
        foreach ($data['room_counts'] as $roomType => $count) {
            $stmt = $conn->prepare("UPDATE room_types SET total_count = ?, available_count = ? WHERE type_code = ?");
            $stmt->bind_param("iis", $count, $count, $roomType);
            $stmt->execute();
            $stmt->close();
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => '客房数量更新成功']);
    } catch(Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => '更新客房数量失败: ' . $e->getMessage()]);
    } finally {
        $conn->autocommit(TRUE); // 恢复自动提交模式
    }
}

// 创建订单
function createOrder($conn, $data) {
    $required = ['user_id', 'room_type', 'check_in', 'check_out', 'contact_name', 'contact_phone'];
    
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            echo json_encode(['success' => false, 'message' => "缺少必要字段: $field"]);
            return;
        }
    }
    
    $userId = $data['user_id'];
    $roomTypeCode = $data['room_type'];
    $checkIn = $data['check_in'];
    $checkOut = $data['check_out'];
    $contactName = $data['contact_name'];
    $contactPhone = $data['contact_phone'];
    $vipLevel = $data['vip_level'] ?? 'none';
    
    try {
        $conn->autocommit(FALSE); // 开始事务
        
        // 获取房型信息
        $roomStmt = $conn->prepare("SELECT * FROM room_types WHERE type_code = ?");
        $roomStmt->bind_param("s", $roomTypeCode);
        $roomStmt->execute();
        $result = $roomStmt->get_result();
        $room = $result->fetch_assoc();
        
        if (!$room) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => '房型不存在']);
            $roomStmt->close();
            return;
        }
        $roomStmt->close();
        
        // 检查是否有空房
        if ($room['available_count'] <= 0) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => '该房型已满房']);
            return;
        }
        
        // 计算天数
        $checkInDate = new DateTime($checkIn);
        $checkOutDate = new DateTime($checkOut);
        $nights = $checkInDate->diff($checkOutDate)->days;
        
        // 获取VIP折扣
        $discount = getVipDiscount($vipLevel);
        $basePrice = $room['base_price'] * $nights;
        $finalPrice = round($basePrice * $discount, 2);
        
        // 创建订单
        $orderStmt = $conn->prepare("
            INSERT INTO orders (user_id, room_type_id, check_in, check_out, nights, contact_name, contact_phone, vip_level, base_price, discount, final_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $orderStmt->bind_param(
            "iissiissddd", 
            $userId, 
            $room['id'], 
            $checkIn, 
            $checkOut, 
            $nights, 
            $contactName, 
            $contactPhone, 
            $vipLevel, 
            $basePrice, 
            $discount, 
            $finalPrice
        );
        $orderStmt->execute();
        
        // 减少可用房间数
        $updateStmt = $conn->prepare("UPDATE room_types SET available_count = available_count - 1 WHERE id = ? AND available_count > 0");
        $updateStmt->bind_param("i", $room['id']);
        $updateStmt->execute();
        
        $conn->commit();
        
        $orderId = $orderStmt->insert_id;
        echo json_encode([
            'success' => true, 
            'message' => '订单创建成功',
            'order_id' => $orderId,
            'nights' => $nights,
            'final_price' => $finalPrice
        ]);
        
        $orderStmt->close();
        $updateStmt->close();
    } catch(Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => '创建订单失败: ' . $e->getMessage()]);
    } finally {
        $conn->autocommit(TRUE); // 恢复自动提交模式
    }
}

// 获取用户订单
function getUserOrders($conn, $userId) {
    try {
        $stmt = $conn->prepare("
            SELECT o.*, rt.type_code, rt.name as room_name, rt.base_price as room_base_price
            FROM orders o
            JOIN room_types rt ON o.room_type_id = rt.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        echo json_encode(['success' => true, 'orders' => $orders]);
        $stmt->close();
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => '获取订单失败: ' . $e->getMessage()]);
    }
}

// 获取所有订单（管理员用）
function getAllOrders($conn) {
    try {
        $result = $conn->query("
            SELECT o.*, u.username, rt.type_code, rt.name as room_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN room_types rt ON o.room_type_id = rt.id
            ORDER BY o.created_at DESC
        ");
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        echo json_encode(['success' => true, 'orders' => $orders]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => '获取订单失败: ' . $e->getMessage()]);
    }
}

// 搜索订单
function searchOrders($conn, $searchTerm) {
    if (empty($searchTerm)) {
        echo json_encode(['success' => false, 'message' => '搜索关键词不能为空']);
        return;
    }
    
    try {
        $searchTerm = "%$searchTerm%";
        $stmt = $conn->prepare("
            SELECT o.*, u.username, rt.type_code, rt.name as room_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN room_types rt ON o.room_type_id = rt.id
            WHERE u.username LIKE ? OR o.contact_name LIKE ? OR o.contact_phone LIKE ?
            ORDER BY o.created_at DESC
        ");
        $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        echo json_encode(['success' => true, 'orders' => $orders]);
        $stmt->close();
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => '搜索订单失败: ' . $e->getMessage()]);
    }
}

// 更新订单状态
function updateOrderStatus($conn, $data) {
    if (!isset($data['order_id']) || !isset($data['status'])) {
        echo json_encode(['success' => false, 'message' => '缺少订单ID或状态']);
        return;
    }
    
    $orderId = $data['order_id'];
    $status = $data['status'];
    
    try {
        $conn->autocommit(FALSE); // 开始事务
        
        // 获取订单信息
        $orderStmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
        $orderStmt->bind_param("i", $orderId);
        $orderStmt->execute();
        $result = $orderStmt->get_result();
        $order = $result->fetch_assoc();
        
        if (!$order) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => '订单不存在']);
            $orderStmt->close();
            return;
        }
        $orderStmt->close();
        
        // 更新订单状态
        $updateStmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $updateStmt->bind_param("si", $status, $orderId);
        $updateStmt->execute();
        
        // 如果订单被取消或完成，恢复房间可用数量
        if (($order['status'] === 'Pending' || $order['status'] === 'Confirmed') && 
            ($status === 'Cancelled' || $status === 'Completed')) {
            $roomStmt = $conn->prepare("UPDATE room_types SET available_count = available_count + 1 WHERE id = ?");
            $roomStmt->bind_param("i", $order['room_type_id']);
            $roomStmt->execute();
            $roomStmt->close();
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => '订单状态更新成功']);
        $updateStmt->close();
    } catch(Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => '更新订单状态失败: ' . $e->getMessage()]);
    } finally {
        $conn->autocommit(TRUE); // 恢复自动提交模式
    }
}

// 获取VIP折扣
function getVipDiscount($vipLevel) {
    switch ($vipLevel) {
        case 'vip1': return 0.9;
        case 'vip2': return 0.85;
        case 'vip3': return 0.8;
        default: return 1.0;
    }
}

// 关闭数据库连接
$conn->close();
?>