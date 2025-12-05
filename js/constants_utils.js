// Constants and DOM Elements
let roomCounts = {
  standard: 20,
  deluxe: 10,
  executive: 15,
};

// 订单数据
let orders = [];

// 登录状态
let isLoggedIn = false;
let currentUser = null;
let isAdmin = false;

// 搜索状态
let currentSearchTerm = '';

// API 基础URL
const API_BASE = 'api.php';

// --- 辅助函数 ---

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
};

// 计算天数
const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 获取 VIP 折扣
const getVipDiscount = (vipLevel) => {
  if (vipLevel === 'vip1') return 0.9;
  if (vipLevel === 'vip2') return 0.85;
  if (vipLevel === 'vip3') return 0.8;
  return 1.0;
};

// 获取房间价格
const getRoomPrice = (roomType) => {
  switch (roomType) {
    case 'standard': return 399;
    case 'deluxe': return 899;
    case 'executive': return 599;
    default: return 0;
  }
};

// 获取房间信息（用于模态框）
const getRoomDetails = (roomType) => {
  switch (roomType) {
    case 'standard':
      return {
        title: '标准双人间详情',
        price: 399,
        originalPrice: 449,
        info: [
          ['面积：', '30 平方米'],
          ['床型：', '两张单人床（1.2m×2m）'],
          ['最多入住：', '2人'],
          ['楼层：', '3-5层'],
          ['设施：', '免费WiFi、电视、独立卫浴、空调']
        ],
        images: ['images\\双人1.jpg', 'images\\双人2.jpg', 'images\\双人3.jpg', 'images\\双人4.jpg']
      };
    case 'deluxe':
      return {
        title: '豪华套房详情',
        price: 899,
        originalPrice: 1129,
        info: [
          ['面积：', '60 平方米'],
          ['床型：', '一张大床（2.0m×2m）'],
          ['最多入住：', '4人'],
          ['楼层：', '6-8层'],
          ['设施：', '免费WiFi、55寸电视、独立客厅、行政酒廊使用权']
        ],
        images: ['images\\豪华1.jpg', 'images\\豪华2.jpg', 'images\\豪华3.jpg', 'images\\豪华4.jpg']
      };
    case 'executive':
      return {
        title: '行政单间详情',
        price: 599,
        originalPrice: 700,
        info: [
          ['面积：', '40 平方米'],
          ['床型：', '一张大床（1.8m×2m）'],
          ['最多入住：', '2人'],
          ['楼层：', '9-10层'],
          ['设施：', '免费高速网络、办公桌、胶囊咖啡机、行政礼遇']
        ],
        images: ['images\\行政1.jpg', 'images\\行政2.jpg', 'images\\行政3.jpg', 'images\\行政4.jpg']
      };
    default:
      return {};
  }
};

// API 调用函数
const apiCall = async (action, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const url = `${API_BASE}?action=${action}`;
    const response = await fetch(url, options);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('API调用错误:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
};