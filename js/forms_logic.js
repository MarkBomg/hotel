// --- 表单提交与核心逻辑 ---

// 登录表单提交
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername')?.value.trim();
  const password = document.getElementById('loginPassword')?.value.trim();

  const result = await apiCall('login', 'POST', { username, password });
  
  if (result.success) {
    isLoggedIn = true;
    currentUser = result.user;
    isAdmin = result.user.role === 'admin';
    document.getElementById('loginModal')?.classList.add('hidden');
    alert(`登录成功！欢迎${isAdmin ? '管理员' : '回来'}，${currentUser.username}！`);
    updateUI();
    fetchAndUpdateRooms();
  } else {
    alert('登录失败: ' + result.message);
  }
});

// 注册表单提交
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername')?.value.trim();
  const password = document.getElementById('registerPassword')?.value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword')?.value.trim();
  const vipLevel = document.getElementById('registerVipLevel')?.value;
  const avatar = document.getElementById('registerAvatar')?.value;

  if (password !== confirmPassword) {
    alert('两次输入的密码不一致！');
    return;
  }

  const result = await apiCall('register', 'POST', {
    username,
    password,
    vip_level: vipLevel,
    avatar
  });
  
  if (result.success) {
    isLoggedIn = true;
    currentUser = result.user;
    isAdmin = false;
    document.getElementById('loginModal')?.classList.add('hidden');
    alert(`注册成功！欢迎您，${vipLevel === 'none' ? '非' : vipLevel.toUpperCase()} 用户 ${username}！`);
    updateUI();
  } else {
    alert('注册失败: ' + result.message);
  }
});

// 管理员登录表单提交
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('adminUsername')?.value.trim();
  const password = document.getElementById('adminPassword')?.value.trim();

  const result = await apiCall('login', 'POST', { username, password });
  
  if (result.success && result.user.role === 'admin') {
    isAdmin = true;
    isLoggedIn = true;
    currentUser = result.user;
    document.getElementById('adminLoginModal')?.classList.add('hidden');
    alert('管理员登录成功！');
    updateUI();
    updateAdminOrderLists();
    fetchAndUpdateRooms();
  } else {
    alert('管理员登录失败: ' + (result.message || '非管理员账号'));
  }
});

// 退出登录
const handleLogout = () => {
  isLoggedIn = false;
  currentUser = null;
  isAdmin = false;
  alert('已退出登录。');
  updateUI();
};

document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);

// 预订按钮点击事件
document.querySelectorAll('.book-room-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const roomType = e.target.dataset.room;
    roomModal?.classList.add('hidden');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    
    if (document.getElementById('bookingRoomType')) {
      document.getElementById('bookingRoomType').value = roomType;
    }
    
    if (isLoggedIn && currentUser) {
      if (document.getElementById('bookingName')) document.getElementById('bookingName').value = currentUser.username;
      if (document.getElementById('bookingPhone')) document.getElementById('bookingPhone').value = '138****1234';
      if (document.getElementById('bookingVipLevel')) document.getElementById('bookingVipLevel').value = currentUser.vip_level;
    } else {
      alert('请先登录或注册，再进行预订！');
      document.getElementById('loginModal')?.classList.remove('hidden');
    }
  });
});

// 英雄区搜索按钮
document.getElementById('heroSearchBtn')?.addEventListener('click', () => {
  const checkIn = document.getElementById('heroCheckIn')?.value;
  const checkOut = document.getElementById('heroCheckOut')?.value;
  const display = document.getElementById('heroDateDisplay');
  const inDisplay = document.getElementById('heroCheckInDisplay');
  const outDisplay = document.getElementById('heroCheckOutDisplay');

  if (checkIn && checkOut && checkIn < checkOut) {
    if (inDisplay) inDisplay.textContent = formatDate(checkIn);
    if (outDisplay) outDisplay.textContent = formatDate(checkOut);
    if (display) display.classList.remove('hidden');
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
  } else if (checkIn && checkOut) {
    alert('退房日期必须晚于入住日期！');
  } else {
    alert('请选择入住和退房日期！');
  }
});

// 预订表单日期输入同步到显示
const updateBookingDisplay = () => {
  const checkIn = document.getElementById('bookingCheckIn')?.value;
  const checkOut = document.getElementById('bookingCheckOut')?.value;
  const display = document.getElementById('bookingDateDisplay');
  const inDisplay = document.getElementById('bookingCheckInDisplay');
  const outDisplay = document.getElementById('bookingCheckOutDisplay');

  if (checkIn && checkOut) {
    if (inDisplay) inDisplay.textContent = formatDate(checkIn);
    if (outDisplay) outDisplay.textContent = formatDate(checkOut);
    if (display) display.classList.remove('hidden');
  } else {
    if (display) display.classList.add('hidden');
  }
};

document.getElementById('bookingCheckIn')?.addEventListener('change', updateBookingDisplay);
document.getElementById('bookingCheckOut')?.addEventListener('change', updateBookingDisplay);

// 提交预订按钮
document.getElementById('submitBooking')?.addEventListener('click', async () => {
  if (!isLoggedIn || !currentUser) {
    alert('请先登录或注册！');
    document.getElementById('loginModal')?.classList.remove('hidden');
    return;
  }

  const roomType = document.getElementById('bookingRoomType')?.value;
  const checkIn = document.getElementById('bookingCheckIn')?.value;
  const checkOut = document.getElementById('bookingCheckOut')?.value;
  const name = document.getElementById('bookingName')?.value.trim();
  const phone = document.getElementById('bookingPhone')?.value.trim();
  const vipLevel = document.getElementById('bookingVipLevel')?.value;

  if (!roomType || !checkIn || !checkOut || !name || !phone) {
    alert('请填写所有必填信息！');
    return;
  }

  if (checkIn >= checkOut) {
    alert('退房日期必须晚于入住日期！');
    return;
  }

  if (roomCounts[roomType] <= 0) {
    alert('抱歉，该房型当前已满房！');
    return;
  }

  const result = await apiCall('create_order', 'POST', {
    user_id: currentUser.id,
    room_type: roomType,
    check_in: checkIn,
    check_out: checkOut,
    contact_name: name,
    contact_phone: phone,
    vip_level: vipLevel
  });

  if (result.success) {
    // 更新本地房间计数
    roomCounts[roomType]--;
    updateRoomCountsDisplay();
    
    const roomTitle = roomType === 'standard' ? '标准双人间' : roomType === 'deluxe' ? '豪华套房' : '行政单间';

    // 填充模态框数据
    if (modalRoomInfo) modalRoomInfo.textContent = `${roomTitle}，共 ${result.nights} 晚`;
    if (modalTotalPrice) modalTotalPrice.textContent = `总价：¥${result.final_price} (已享受 VIP ${vipLevel.toUpperCase()} 折扣)`;

    // 清空预订表单数据
    document.getElementById('bookingForm')?.reset();
    updateBookingDisplay();
    
    // 显示成功模态框
    bookingSuccessModal?.classList.remove('hidden');
  } else {
    alert('预订失败: ' + result.message);
  }
});