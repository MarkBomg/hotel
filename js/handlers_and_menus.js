// --- 模态框与菜单逻辑 ---

// 切换移动菜单
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
  document.getElementById('mobileMenu')?.classList.toggle('hidden');
});

// 切换用户类型（桌面端）
document.getElementById('userTypeBtn')?.addEventListener('click', () => {
  document.getElementById('userTypeDropdown')?.classList.toggle('hidden');
});

// 切换用户类型（移动端）
document.getElementById('mobileUserTypeBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('mobileUserTypeDropdown')?.classList.toggle('hidden');
});

// 隐藏下拉菜单
document.addEventListener('click', (e) => {
  if (document.getElementById('userTypeDropdown') && !document.getElementById('userTypeBtn')?.contains(e.target) && !document.getElementById('userTypeDropdown')?.contains(e.target)) {
    document.getElementById('userTypeDropdown').classList.add('hidden');
  }
  if (document.getElementById('mobileUserTypeDropdown') && !document.getElementById('mobileUserTypeBtn')?.contains(e.target) && !document.getElementById('mobileUserTypeDropdown')?.contains(e.target)) {
    document.getElementById('mobileUserTypeDropdown').classList.add('hidden');
  }
});

// 切换用户类型处理函数
const handleUserTypeChange = (type) => {
  // 总是先退出当前登录状态
  isLoggedIn = false;
  currentUser = null;
  isAdmin = false;
  document.getElementById('userTypeDropdown')?.classList.add('hidden');
  document.getElementById('mobileUserTypeDropdown')?.classList.add('hidden');

  if (type === 'admin') {
    // 弹出管理员登录模态框
    document.getElementById('adminLoginModal')?.classList.remove('hidden');
    if (document.getElementById('userTypeText')) document.getElementById('userTypeText').textContent = '管理员';
    if (document.querySelector('#mobileUserTypeBtn span')) document.querySelector('#mobileUserTypeBtn span').textContent = '管理员';
    updateUI();
  } else {
    // 切换回个人用户状态
    if (document.getElementById('userTypeText')) document.getElementById('userTypeText').textContent = '个人用户';
    if (document.querySelector('#mobileUserTypeBtn span')) document.querySelector('#mobileUserTypeBtn span').textContent = '个人用户';
    updateUI();
  }
};

// 桌面端用户类型切换事件
document.querySelectorAll('#userTypeDropdown a').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    handleUserTypeChange(e.target.dataset.type);
  });
});

// 移动端用户类型切换事件
document.querySelectorAll('#mobileUserTypeDropdown a').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    handleUserTypeChange(e.target.dataset.type);
  });
});

// 管理员登录模态框控制
document.getElementById('closeAdminLoginModal')?.addEventListener('click', () => {
  document.getElementById('adminLoginModal')?.classList.add('hidden');
  handleUserTypeChange('personal');
});

// 登录/注册模态框控制
document.getElementById('loginBtn')?.addEventListener('click', () => {
  document.getElementById('loginModal')?.classList.remove('hidden');
});
document.getElementById('mobileLoginBtn')?.addEventListener('click', () => {
  document.getElementById('loginModal')?.classList.remove('hidden');
});
document.getElementById('closeLoginModal')?.addEventListener('click', () => {
  document.getElementById('loginModal')?.classList.add('hidden');
});

// 登录/注册标签页切换
document.getElementById('loginTab')?.addEventListener('click', () => {
  document.getElementById('loginTab')?.classList.add('border-primary', 'text-primary');
  document.getElementById('loginTab')?.classList.remove('border-transparent', 'text-gray-500');
  document.getElementById('registerTab')?.classList.remove('border-primary', 'text-primary');
  document.getElementById('registerTab')?.classList.add('border-transparent', 'text-gray-500');
  document.getElementById('loginForm')?.classList.remove('hidden');
  document.getElementById('registerForm')?.classList.add('hidden');
});

document.getElementById('registerTab')?.addEventListener('click', () => {
  document.getElementById('registerTab')?.classList.add('border-primary', 'text-primary');
  document.getElementById('registerTab')?.classList.remove('border-transparent', 'text-gray-500');
  document.getElementById('loginTab')?.classList.remove('border-primary', 'text-primary');
  document.getElementById('loginTab')?.classList.add('border-transparent', 'text-gray-500');
  document.getElementById('registerForm')?.classList.remove('hidden');
  document.getElementById('loginForm')?.classList.add('hidden');
});

// 礼遇详情模态框控制
document.getElementById('viewMorePrivilegeBtn')?.addEventListener('click', () => {
  document.getElementById('privilegeModal')?.classList.remove('hidden');
});
document.getElementById('closePrivilegeModal')?.addEventListener('click', () => {
  document.getElementById('privilegeModal')?.classList.add('hidden');
});

// 我的订单模态框控制
const handleMyOrdersClick = async () => {
  if (!currentUser) return;
  
  const result = await apiCall(`get_user_orders&user_id=${currentUser.id}`);
  if (result.success) {
    renderOrdersList(document.getElementById('ordersList'), result.orders);
    document.getElementById('ordersModal')?.classList.remove('hidden');
  } else {
    alert('获取订单失败: ' + result.message);
  }
};

document.getElementById('myOrdersBtn')?.addEventListener('click', handleMyOrdersClick);
document.getElementById('mobileMyOrdersBtn')?.addEventListener('click', handleMyOrdersClick);
document.getElementById('closeOrdersModal')?.addEventListener('click', () => {
  document.getElementById('ordersModal')?.classList.add('hidden');
});

// 预订成功模态框
const bookingSuccessModal = document.getElementById('bookingSuccessModal');
const modalRoomInfo = document.getElementById('modalRoomInfo');
const modalTotalPrice = document.getElementById('modalTotalPrice');
const closeBookingSuccessModal = document.getElementById('closeBookingSuccessModal');

closeBookingSuccessModal?.addEventListener('click', () => {
  bookingSuccessModal?.classList.add('hidden');
  handleMyOrdersClick();
});

// 客房详情模态框控制 
const roomModal = document.getElementById('roomModal');
const modalRoomTitle = document.getElementById('modalRoomTitle');
const detailMainImg = document.getElementById('detailMainImg');
const detailThumbnails = document.getElementById('detailThumbnails');
const detailRoomInfo = document.getElementById('detailRoomInfo');
const roomModalBookBtn = roomModal?.querySelector('.book-room-btn');

document.querySelectorAll('.view-room-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const roomType = btn.dataset.room;
    const details = getRoomDetails(roomType);
    if (!details || !roomModal) return;

    modalRoomTitle.textContent = details.title;
    detailMainImg.src = details.images[0];
    detailMainImg.setAttribute('alt', details.title);

    // 更新价格
    const priceElement = roomModal.querySelector('.room-details .text-3xl.font-bold');
    const originalPriceElement = roomModal.querySelector('.room-details .line-through');
    if (priceElement) priceElement.innerHTML = `¥${details.price} /晚 <span class="text-base text-gray-500 line-through">¥${details.originalPrice}</span>`;

    // 更新房间信息
    detailRoomInfo.innerHTML = details.info.map(([label, value]) => `
      <li class="flex justify-between">
        <span class="text-gray-600">${label}</span>
        <span>${value}</span>
      </li>
    `).join('');

    // 切换缩略图显示
    document.querySelectorAll('#detailThumbnails img').forEach(img => {
      if (img.dataset.room === roomType) {
        img.classList.remove('hidden');
      } else {
        img.classList.add('hidden');
      }
    });

    // 绑定预订按钮的房型
    if (roomModalBookBtn) roomModalBookBtn.dataset.room = roomType;

    roomModal.classList.remove('hidden');
  });
});

document.getElementById('closeModal')?.addEventListener('click', () => {
  roomModal?.classList.add('hidden');
});

// 缩略图切换主图
detailThumbnails?.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG' && detailMainImg) {
    detailMainImg.src = e.target.dataset.img;
  }
});
