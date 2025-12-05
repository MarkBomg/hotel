// --- 订单渲染函数 ---

// 渲染单个订单卡片
const renderOrderCard = (order, isAdminView = false) => {
  const nights = order.nights || calculateNights(order.check_in, order.check_out);
  const price = order.base_price || getRoomPrice(order.type_code);
  const discount = order.discount || getVipDiscount(order.vip_level);
  const finalPrice = order.final_price || Math.round(price * nights * discount);
  const roomTitle = order.room_name || (order.type_code === 'standard' ? '标准双人间' : order.type_code === 'deluxe' ? '豪华套房' : '行政单间');

  let statusColor = '';
  let statusText = '';
  let statusIcon = '';
  let actionButton = '';

  switch (order.status) {
    case 'Pending':
      statusColor = 'bg-yellow-100 text-yellow-800';
      statusText = '待确认';
      statusIcon = 'fas fa-hourglass-half';
      if (isAdminView) {
        actionButton = `
          <button class="approve-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition mb-1 md:mb-0" data-id="${order.id}">
            <i class="fas fa-check mr-1"></i>确认入住
          </button>
          <button class="cancel-btn bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded transition" data-id="${order.id}">
            <i class="fas fa-times mr-1"></i>取消订单
          </button>
        `;
      }
      break;
    case 'Confirmed':
      statusColor = 'bg-green-100 text-green-800';
      statusText = '已确认/入住中';
      statusIcon = 'fas fa-door-open';
      if (isAdminView) {
        actionButton = `
          <button class="checkout-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition mb-1 md:mb-0" data-id="${order.id}">
            <i class="fas fa-sign-out-alt mr-1"></i>办理退房
          </button>
          <button class="cancel-btn bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded transition" data-id="${order.id}">
            <i class="fas fa-times mr-1"></i>取消订单
          </button>
        `;
      }
      break;
    case 'Completed':
      statusColor = 'bg-blue-100 text-blue-800';
      statusText = '已完成';
      statusIcon = 'fas fa-bed';
      break;
    case 'Cancelled':
      statusColor = 'bg-gray-200 text-gray-800';
      statusText = '已取消';
      statusIcon = 'fas fa-ban';
      break;
  }

  const adminInfo = isAdminView ? `
    <div class="mb-2">
      <p class="text-sm text-gray-600">预订人: <span class="font-medium text-dark">${order.username}</span></p>
      <p class="text-sm text-gray-600">VIP等级: <span class="font-medium text-dark">${order.vip_level === 'none' ? '非VIP' : order.vip_level.toUpperCase()}</span></p>
    </div>
  ` : '';
  
  const adminActions = isAdminView ? `<div class="flex flex-col md:flex-row md:space-x-2 mt-2 md:mt-0">${actionButton}</div>` : '';

  return `
    <div class="bg-white rounded-lg p-4 border card-shadow flex flex-col md:flex-row justify-between items-start md:items-center">
      <div class="mb-3 md:mb-0">
        <h4 class="text-lg font-bold text-primary">${roomTitle}</h4>
        <p class="text-sm text-gray-600">${formatDate(order.check_in)} 至 ${formatDate(order.check_out)} (${nights}晚)</p>
        ${adminInfo}
        <p class="text-sm text-gray-600">联系人: ${order.contact_name} / ${order.contact_phone}</p>
      </div>
      <div class="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
        <div>
          <p class="text-xl font-bold text-red-600">¥${finalPrice}</p>
          <p class="text-xs text-gray-500 line-through">¥${price * nights}</p>
        </div>
        <span class="${statusColor} text-xs font-semibold px-3 py-1 rounded-full flex items-center">
          <i class="${statusIcon} mr-1"></i>${statusText}
        </span>
        ${adminActions}
      </div>
    </div>
  `;
};

// 更新管理员订单列表
const updateAdminOrderLists = async () => {
  let result;
  
  if (currentSearchTerm) {
    // 如果有搜索词，使用搜索API
    result = await apiCall(`search_orders&search_term=${encodeURIComponent(currentSearchTerm)}`);
  } else {
    // 否则获取所有订单
    result = await apiCall('get_all_orders');
  }
  
  if (result.success) {
    // 更新搜索结果信息（如果有搜索）
    if (currentSearchTerm) {
      const searchResultsInfo = document.getElementById('searchResultsInfo');
      const searchTermDisplay = document.getElementById('searchTermDisplay');
      
      if (searchResultsInfo && searchTermDisplay) {
        searchTermDisplay.textContent = `"${currentSearchTerm}" - 找到 ${result.orders.length} 条记录`;
        searchResultsInfo.classList.remove('hidden');
      }
    } else {
      const searchResultsInfo = document.getElementById('searchResultsInfo');
      if (searchResultsInfo) {
        searchResultsInfo.classList.add('hidden');
      }
    }
    
    // 正在进行的订单: Pending, Confirmed
    const ongoingOrders = result.orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed');
    renderOrdersList(document.getElementById('adminOngoingOrdersList'), ongoingOrders, true);

    // 历史订单: Completed, Cancelled
    const historyOrders = result.orders.filter(o => o.status === 'Completed' || o.status === 'Cancelled');
    renderOrdersList(document.getElementById('adminHistoryOrdersList'), historyOrders, true);
  } else {
    console.error('获取订单失败:', result.message);
  }
};

// 渲染订单列表
const renderOrdersList = (containerElement, orderArray, isAdminView = false) => {
  if (!containerElement) return;
    
  containerElement.innerHTML = '';
  if (orderArray.length === 0) {
    containerElement.innerHTML = `<p class="text-gray-500 text-center py-4">
      ${containerElement.id === 'ordersList' ? '您暂无订单（预订后将显示此处）' : '该列表暂无订单'}
    </p>`;
    return;
  }

  containerElement.innerHTML = orderArray.map(order => renderOrderCard(order, isAdminView)).join('');

  // 绑定管理员操作按钮事件
  if (isAdminView) {
    // 确认入住 (Pending -> Confirmed)
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderId = parseInt(e.target.dataset.id);
        const result = await apiCall('update_order_status', 'PUT', {
          order_id: orderId,
          status: 'Confirmed'
        });
        
        if (result.success) {
          updateAdminOrderLists();
          fetchAndUpdateRooms();
        } else {
          alert('操作失败: ' + result.message);
        }
      });
    });

    // 办理退房 (Confirmed -> Completed)
    document.querySelectorAll('.checkout-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderId = parseInt(e.target.dataset.id);
        const result = await apiCall('update_order_status', 'PUT', {
          order_id: orderId,
          status: 'Completed'
        });
        
        if (result.success) {
          updateAdminOrderLists();
          fetchAndUpdateRooms();
        } else {
          alert('操作失败: ' + result.message);
        }
      });
    });
      
    // 取消订单 (Pending/Confirmed -> Cancelled)
    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderId = parseInt(e.target.dataset.id);
        const result = await apiCall('update_order_status', 'PUT', {
          order_id: orderId,
          status: 'Cancelled'
        });
        
        if (result.success) {
          updateAdminOrderLists();
          fetchAndUpdateRooms();
        } else {
          alert('操作失败: ' + result.message);
        }
      });
    });
  }
};