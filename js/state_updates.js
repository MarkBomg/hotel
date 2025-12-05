// --- 状态更新函数 ---

// 从API获取并更新房间信息
const fetchAndUpdateRooms = async () => {
  const result = await apiCall('get_rooms');
  
  if (result.success) {
    // 更新本地房间计数
    result.rooms.forEach(room => {
      roomCounts[room.type_code] = room.available_count;
    });
    
    // 更新UI显示
    updateRoomCountsDisplay();
  } else {
    console.error('获取房间信息失败:', result.message);
  }
};

// 更新剩余房间数显示
const updateRoomCountsDisplay = () => {
  document.getElementById('standardRemaining').textContent = roomCounts.standard;
  document.getElementById('deluxeRemaining').textContent = roomCounts.deluxe;
  document.getElementById('executiveRemaining').textContent = roomCounts.executive;
  
  // 管理员专区
  const adminStandardInput = document.getElementById('standardRooms');
  const adminDeluxeInput = document.getElementById('deluxeRooms');
  const adminExecutiveInput = document.getElementById('executiveRooms');
  
  if (adminStandardInput) {
    adminStandardInput.value = roomCounts.standard;
    const adminStandardRemaining = document.getElementById('adminStandardRemaining');
    if (adminStandardRemaining) {
      adminStandardRemaining.textContent = `${roomCounts.standard}/${roomCounts.standard}`;
    }
  }
  if (adminDeluxeInput) {
    adminDeluxeInput.value = roomCounts.deluxe;
    const adminDeluxeRemaining = document.getElementById('adminDeluxeRemaining');
    if (adminDeluxeRemaining) {
      adminDeluxeRemaining.textContent = `${roomCounts.deluxe}/${roomCounts.deluxe}`;
    }
  }
  if (adminExecutiveInput) {
    adminExecutiveInput.value = roomCounts.executive;
    const adminExecutiveRemaining = document.getElementById('adminExecutiveRemaining');
    if (adminExecutiveRemaining) {
      adminExecutiveRemaining.textContent = `${roomCounts.executive}/${roomCounts.executive}`;
    }
  }

  const updateProgressBar = (room, current, total) => {
    const progressBarContainer = document.querySelector(`#admin${room}Remaining`);
    if (!progressBarContainer) return;
    
    const nextSibling = progressBarContainer.nextElementSibling;
    if (!nextSibling) return;
    
    const progressBar = nextSibling.querySelector('div');
    if (!progressBar) return;
    
    const percentage = total > 0 ? (current / total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    progressBar.className = `h-2 rounded-full ${percentage > 70 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'}`;
  };

  if (adminStandardInput) updateProgressBar('Standard', roomCounts.standard, parseInt(adminStandardInput.value));
  if (adminDeluxeInput) updateProgressBar('Deluxe', roomCounts.deluxe, parseInt(adminDeluxeInput.value));
  if (adminExecutiveInput) updateProgressBar('Executive', roomCounts.executive, parseInt(adminExecutiveInput.value));

  // 房间数变化时，如果图表已初始化，则更新
  if (occupancyChart) {
    updateChart(); 
  }
};

// 更新用户界面（登录/管理员状态）
const updateUI = () => {
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const myOrdersBtn = document.getElementById('myOrdersBtn');
  const adminSection = document.getElementById('adminSection');
  const userTypeText = document.getElementById('userTypeText');
  const userTypeBtn = document.getElementById('userTypeBtn');
  const vipBadge = document.getElementById('vipBadge');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');

  const mobileUserInfo = document.getElementById('mobileUserInfo');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileMyOrdersBtn = document.getElementById('mobileMyOrdersBtn');
  const mobileUserTypeText = document.querySelector('#mobileUserTypeBtn span');
  const mobileVipBadge = document.getElementById('mobileVipBadge');
  const mobileUserName = document.getElementById('mobileUserName');
  const mobileUserAvatar = document.getElementById('mobileUserAvatar');

  // 需要隐藏的页面主要区域
  const roomsSection = document.getElementById('rooms');
  const bookingSection = document.getElementById('booking');
  const vipSection = document.getElementById('vip');
  const heroSection = document.getElementById('heroSection');
  const consumerNavLinks = document.getElementById('consumerNavLinks');
  const mobileConsumerNavLinks = document.getElementById('mobileConsumerNavLinks');

  // 重置所有状态
  if (userInfo) userInfo.classList.add('hidden');
  if (loginBtn) loginBtn.classList.remove('hidden');
  if (myOrdersBtn) myOrdersBtn.classList.add('hidden');
  if (adminSection) adminSection.classList.add('hidden');
  if (userTypeBtn) userTypeBtn.classList.remove('hidden'); 

  if (mobileUserInfo) mobileUserInfo.classList.add('hidden');
  if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
  if (mobileMyOrdersBtn) mobileMyOrdersBtn.classList.add('hidden');

  // 默认显示用户区内容
  if (roomsSection) roomsSection.classList.remove('hidden');
  if (bookingSection) bookingSection.classList.remove('hidden');
  if (vipSection) vipSection.classList.remove('hidden');
  if (consumerNavLinks) consumerNavLinks.classList.remove('hidden');
  if (mobileConsumerNavLinks) mobileConsumerNavLinks.classList.remove('hidden');
  if (heroSection) heroSection.classList.remove('hidden');

  if (isAdmin) {
    // 管理员状态
    if (userInfo) userInfo.classList.remove('hidden');
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userTypeBtn) userTypeBtn.classList.add('hidden');
    if (adminSection) adminSection.classList.remove('hidden');
    if (userTypeText) userTypeText.textContent = '管理员';
    if (userName) userName.textContent = 'Admin';
    if (userAvatar) userAvatar.src = 'https://picsum.photos/32/32?random=0';
    if (vipBadge) vipBadge.classList.add('hidden');
    if (myOrdersBtn) myOrdersBtn.classList.add('hidden');

    if (mobileUserInfo) mobileUserInfo.classList.remove('hidden');
    if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
    if (mobileUserTypeText) mobileUserTypeText.textContent = '管理员';
    if (mobileUserName) mobileUserName.textContent = 'Admin';
    if (mobileUserAvatar) mobileUserAvatar.src = 'https://picsum.photos/32/32?random=0';
    if (mobileVipBadge) mobileVipBadge.classList.add('hidden');
    if (mobileMyOrdersBtn) mobileMyOrdersBtn.classList.add('hidden');

    // 隐藏客房展示/预定流程/VIP服务/英雄区
    if (roomsSection) roomsSection.classList.add('hidden');
    if (bookingSection) bookingSection.classList.add('hidden');
    if (vipSection) vipSection.classList.add('hidden');
    if (consumerNavLinks) consumerNavLinks.classList.add('hidden');
    if (mobileConsumerNavLinks) mobileConsumerNavLinks.classList.add('hidden');
    if (heroSection) heroSection.classList.add('hidden');
    
    // 初始化图表和订单
    initializeChart(); 
    updateChart(); 
    updateAdminOrderLists();

  } else if (isLoggedIn && currentUser) {
    // 已登录个人用户状态
    if (userInfo) userInfo.classList.remove('hidden');
    if (loginBtn) loginBtn.classList.add('hidden');
    if (myOrdersBtn) myOrdersBtn.classList.remove('hidden');
    if (userTypeText) userTypeText.textContent = '个人用户'; 

    if (mobileUserInfo) mobileUserInfo.classList.remove('hidden');
    if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
    if (mobileMyOrdersBtn) mobileMyOrdersBtn.classList.remove('hidden');
    if (mobileUserTypeText) mobileUserTypeText.textContent = '个人用户';

    if (userName) userName.textContent = currentUser.username;
    if (userAvatar) userAvatar.src = currentUser.avatar;
    if (mobileUserName) mobileUserName.textContent = currentUser.username;
    if (mobileUserAvatar) mobileUserAvatar.src = currentUser.avatar;

    if (currentUser.vip_level !== 'none') {
      if (vipBadge) vipBadge.classList.remove('hidden');
      if (mobileVipBadge) mobileVipBadge.classList.remove('hidden');
    } else {
      if (vipBadge) vipBadge.classList.add('hidden');
      if (mobileVipBadge) mobileVipBadge.classList.add('hidden');
    }

  } else {
    // 未登录个人用户状态
    if (userTypeText) userTypeText.textContent = '个人用户'; 
    if (mobileUserTypeText) mobileUserTypeText.textContent = '个人用户';
  }
};

// --- 搜索功能 ---

// 设置搜索功能
const setupSearchFunctionality = () => {
    const searchInput = document.getElementById('orderSearchInput');
    const searchBtn = document.getElementById('orderSearchBtn');
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchTermDisplay = document.getElementById('searchTermDisplay');

    // 搜索按钮点击事件
    searchBtn?.addEventListener('click', handleOrderSearch);
    
    // 回车键搜索
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleOrderSearch();
        }
    });
    
    // 清除搜索
    clearSearchBtn?.addEventListener('click', () => {
        currentSearchTerm = '';
        if (searchInput) searchInput.value = '';
        if (searchResultsInfo) searchResultsInfo.classList.add('hidden');
        updateAdminOrderLists();
    });
};

// 处理订单搜索
const handleOrderSearch = async () => {
    const searchInput = document.getElementById('orderSearchInput');
    const searchTerm = searchInput?.value.trim();
    
    if (!searchTerm) {
        alert('请输入搜索关键词');
        return;
    }
    
    currentSearchTerm = searchTerm;
    
    const result = await apiCall(`search_orders&search_term=${encodeURIComponent(searchTerm)}`);
    
    if (result.success) {
        // 显示搜索结果信息
        const searchResultsInfo = document.getElementById('searchResultsInfo');
        const searchTermDisplay = document.getElementById('searchTermDisplay');
        
        if (searchResultsInfo && searchTermDisplay) {
            searchTermDisplay.textContent = `"${searchTerm}" - 找到 ${result.orders.length} 条记录`;
            searchResultsInfo.classList.remove('hidden');
        }
        
        // 渲染搜索结果到两个列表
        const ongoingOrders = result.orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed');
        const historyOrders = result.orders.filter(o => o.status === 'Completed' || o.status === 'Cancelled');
        
        renderOrdersList(document.getElementById('adminOngoingOrdersList'), ongoingOrders, true);
        renderOrdersList(document.getElementById('adminHistoryOrdersList'), historyOrders, true);
    } else {
        alert('搜索失败: ' + result.message);
    }
};
