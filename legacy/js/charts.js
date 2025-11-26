// 통계 차트 관리

let monthlyChart = null;
let siteChart = null;
let statusChart = null;

// 차트 초기화
function initCharts() {
    renderMonthlyChart();
    renderSiteChart();
    renderStatusChart();
}

// 월별 결재 통계 차트
function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // 최근 6개월 데이터 수집
    const months = [];
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(`${date.getMonth() + 1}월`);
        
        // 해당 월의 결재 수 계산
        let userApprovals = approvals;
        if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
            userApprovals = approvals.filter(a => a.author === currentUser.username);
        }
        
        const monthApprovals = userApprovals.filter(a => {
            const approvalDate = new Date(a.createdAt);
            return approvalDate.getFullYear() === date.getFullYear() &&
                   approvalDate.getMonth() === date.getMonth();
        });
        
        data.push(monthApprovals.length);
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: '결재 수',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 현장별 결재 현황 차트
function renderSiteChart() {
    const ctx = document.getElementById('siteChart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (siteChart) {
        siteChart.destroy();
    }
    
    // 현장별 결재 수 계산
    let userApprovals = approvals;
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        userApprovals = approvals.filter(a => a.author === currentUser.username);
    }
    
    const siteCounts = {};
    userApprovals.forEach(approval => {
        const siteName = approval.siteName || '미지정';
        siteCounts[siteName] = (siteCounts[siteName] || 0) + 1;
    });
    
    const labels = Object.keys(siteCounts);
    const data = Object.values(siteCounts);
    
    // 색상 생성
    const colors = [
        'rgba(102, 126, 234, 0.6)',
        'rgba(118, 75, 162, 0.6)',
        'rgba(255, 107, 107, 0.6)',
        'rgba(46, 213, 115, 0.6)',
        'rgba(255, 165, 2, 0.6)',
        'rgba(0, 184, 148, 0.6)',
        'rgba(116, 185, 255, 0.6)',
        'rgba(255, 159, 67, 0.6)'
    ];
    
    siteChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// 상태별 통계 차트
function renderStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (statusChart) {
        statusChart.destroy();
    }
    
    // 상태별 결재 수 계산
    let userApprovals = approvals;
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        userApprovals = approvals.filter(a => a.author === currentUser.username);
    }
    
    const statusCounts = {
        'pending': 0,
        'processing': 0,
        'approved': 0,
        'rejected': 0
    };
    
    userApprovals.forEach(approval => {
        if (approval.status === 'pending' || approval.status === 'processing') {
            if (approval.status === 'pending') {
                statusCounts.pending++;
            } else {
                statusCounts.processing++;
            }
        } else if (approval.status === 'approved') {
            statusCounts.approved++;
        } else if (approval.status === 'rejected') {
            statusCounts.rejected++;
        }
    });
    
    statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['대기 중', '진행 중', '승인 완료', '반려'],
            datasets: [{
                label: '결재 수',
                data: [
                    statusCounts.pending,
                    statusCounts.processing,
                    statusCounts.approved,
                    statusCounts.rejected
                ],
                backgroundColor: [
                    'rgba(255, 165, 2, 0.6)',
                    'rgba(116, 185, 255, 0.6)',
                    'rgba(46, 213, 115, 0.6)',
                    'rgba(255, 107, 107, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 165, 2, 1)',
                    'rgba(116, 185, 255, 1)',
                    'rgba(46, 213, 115, 1)',
                    'rgba(255, 107, 107, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 모든 차트 업데이트
function updateAllCharts() {
    renderMonthlyChart();
    renderSiteChart();
    renderStatusChart();
}

