// --- 管理员客房数量管理 ---

// 绑定增减按钮事件
const setupRoomCounter = (type) => {
  const input = document.getElementById(`${type}Rooms`);
  const decBtn = document.getElementById(`dec${type.charAt(0).toUpperCase() + type.slice(1)}`);
  const incBtn = document.getElementById(`inc${type.charAt(0).toUpperCase() + type.slice(1)}`);

  decBtn?.addEventListener('click', () => {
    let val = parseInt(input.value);
    if (val > 0) {
      input.value = val - 1;
      updateRoomCountsDisplay();
    }
  });

  incBtn?.addEventListener('click', () => {
    let val = parseInt(input.value);
    input.value = val + 1;
    updateRoomCountsDisplay();
  });
};

setupRoomCounter('standard');
setupRoomCounter('deluxe');
setupRoomCounter('executive');

// 保存客房数量
document.getElementById('saveRoomCounts')?.addEventListener('click', async () => {
  const roomCountsData = {
    standard: parseInt(document.getElementById('standardRooms')?.value || roomCounts.standard),
    deluxe: parseInt(document.getElementById('deluxeRooms')?.value || roomCounts.deluxe),
    executive: parseInt(document.getElementById('executiveRooms')?.value || roomCounts.executive)
  };

  const result = await apiCall('update_room_counts', 'POST', {
    room_counts: roomCountsData
  });

  if (result.success) {
    // 更新本地房间计数
    roomCounts = roomCountsData;
    updateRoomCountsDisplay();
    alert('客房总数量已保存！');
  } else {
    alert('保存失败: ' + result.message);
  }
});

// 刷新订单列表（管理员）
document.getElementById('viewAllOrders')?.addEventListener('click', () => {
  if (isAdmin) {
    updateAdminOrderLists();
    alert('订单列表已刷新。');
  }
});

// 管理员订单列表Tab切换
document.getElementById('adminOngoingListTab')?.addEventListener('click', () => {
    document.getElementById('adminOngoingOrders')?.classList.remove('hidden');
    document.getElementById('adminHistoryOrders')?.classList.add('hidden');
    document.getElementById('adminOngoingListTab').classList.add('border-primary', 'text-primary');
    document.getElementById('adminHistoryListTab').classList.remove('border-primary', 'text-primary');
});

document.getElementById('adminHistoryListTab')?.addEventListener('click', () => {
    document.getElementById('adminOngoingOrders')?.classList.add('hidden');
    document.getElementById('adminHistoryOrders')?.classList.remove('hidden');
    document.getElementById('adminHistoryListTab').classList.add('border-primary', 'text-primary');
    document.getElementById('adminOngoingListTab').classList.remove('border-primary', 'text-primary');
});

// --- Chart.js 初始化与更新 ---
let occupancyChart;

const initializeChart = () => {
  if (occupancyChart) return; 

  const canvasElement = document.getElementById('roomOccupancyChart');
  if (!canvasElement) return; 
  const ctx = canvasElement.getContext('2d');

  const today = new Date();
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }));
  }

  // 模拟历史数据，最后一位是当前数据
  const dataStandard = [19, 18, 17, 19, 18, 18, roomCounts.standard];
  const dataDeluxe = [9, 10, 8, 9, 10, 9, roomCounts.deluxe];
  const dataExecutive = [14, 15, 13, 14, 15, 14, roomCounts.executive];

  occupancyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '标准双人间',
          data: dataStandard,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: '豪华套房',
          data: dataDeluxe,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: '行政单间',
          data: dataExecutive,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: '近7日客房空置趋势' }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '剩余房间数'
          }
        }
      }
    }
  });
};

const updateChart = () => {
  if (occupancyChart) {
    const dataStandard = occupancyChart.data.datasets[0].data;
    const dataDeluxe = occupancyChart.data.datasets[1].data;
    const dataExecutive = occupancyChart.data.datasets[2].data;

    // 更新最后一个数据点
    dataStandard[dataStandard.length - 1] = roomCounts.standard;
    dataDeluxe[dataDeluxe.length - 1] = roomCounts.deluxe;
    dataExecutive[dataExecutive.length - 1] = roomCounts.executive;

    occupancyChart.update();
  }
};

// --- 页面初始化 ---
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndUpdateRooms();
  updateUI();
  setupSearchFunctionality();
});