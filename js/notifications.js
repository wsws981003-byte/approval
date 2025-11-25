// 알림 관리 시스템

let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
let notificationCheckInterval = null;

// 알림 초기화
function initNotifications() {
    updateNotificationBadge();
    startNotificationCheck();
    
    // 브라우저 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// 알림 생성
function createNotification(type, title, message, approvalId = null, userId = null) {
    // pending 타입 알림의 경우, 같은 결재에 대한 알림이 이미 있으면 생성하지 않음
    if (type === 'pending' && approvalId) {
        const existingNotification = notifications.find(n => 
            n.approvalId === approvalId && 
            n.type === 'pending' &&
            (!userId || n.userId === userId)
        );
        
        if (existingNotification) {
            console.log('이미 존재하는 결재 승인 대기 알림:', approvalId);
            return null; // 알림 생성하지 않음
        }
    }
    
    const notification = {
        id: Date.now(),
        type: type, // 'pending', 'approved', 'rejected', 'system'
        title: title,
        message: message,
        approvalId: approvalId,
        userId: userId,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    notifications.unshift(notification);
    
    // 최대 100개까지만 저장
    if (notifications.length > 100) {
        notifications = notifications.slice(0, 100);
    }
    
    saveNotifications();
    updateNotificationBadge();
    showNotificationToast(notification);
    
    // 브라우저 알림 표시
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            tag: `approval-${approvalId || 'system'}`
        });
    }
    
    return notification;
}

// 승인 대기 알림 생성 (결재 제출 시)
function notifyPendingApproval(approval) {
    // 한 개의 결재당 한 번만 알림 생성
    // 이미 이 결재에 대한 pending 알림이 있는지 확인 (사용자 무관)
    const existingNotification = notifications.find(n => 
        n.approvalId === approval.id && 
        n.type === 'pending'
    );
    
    if (existingNotification) {
        console.log('이미 존재하는 결재 승인 대기 알림:', approval.id);
        return; // 이미 알림이 있으면 생성하지 않음
    }
    
    // 승인 권한이 있는 모든 사용자에게 알림 전송
    // 대표님은 항상 알림 받음
    // 현장소장은 해당 현장의 담당자인 경우 알림 받음
    
    // 본사(대표님)에게 알림
    if (approvedUsers && approvedUsers.length > 0) {
        const ceoUsers = approvedUsers.filter(u => u.role === 'ceo' || u.role === 'headquarters');
        ceoUsers.forEach(ceo => {
            // 작성자가 아닌 경우에만 알림
            if (ceo.username !== approval.author) {
                createNotification(
                    'pending',
                    '결재 승인 대기',
                    `"${approval.title}" 결재가 승인을 기다리고 있습니다.`,
                    approval.id,
                    ceo.username
                );
            }
        });
    }
    
    // 현장소장에게 알림 (해당 현장의 담당자인 경우)
    const site = sites.find(s => s.id === approval.siteId || s.name === approval.siteName);
    if (site && site.manager) {
        const managerUser = approvedUsers.find(u => u.username === site.manager);
        if (managerUser && (managerUser.role === 'manager' || managerUser.role === 'site') && managerUser.username !== approval.author) {
            createNotification(
                'pending',
                '결재 승인 대기',
                `"${approval.title}" 결재가 승인을 기다리고 있습니다.`,
                approval.id,
                managerUser.username
            );
        }
    }
}

// 승인 완료 알림 생성
function notifyApprovalApproved(approval) {
    // 이미 같은 결재에 대한 승인 알림이 있는지 확인
    const existingNotification = notifications.find(n => 
        n.approvalId === approval.id && 
        n.type === 'approved' && 
        n.userId === approval.author
    );
    
    // 이미 알림이 있으면 생성하지 않음
    if (existingNotification) {
        return;
    }
    
    // 작성자에게 알림
    const approvalNumber = approval.approvalNumber || approval.id;
    createNotification(
        'approved',
        '결재 승인 완료',
        `"${approval.title}" 결재가 승인되었습니다.`,
        approval.id,
        approval.author
    );
}

// 반려 알림 생성
function notifyApprovalRejected(approval) {
    // 이미 같은 결재에 대한 반려 알림이 있는지 확인
    const existingNotification = notifications.find(n => 
        n.approvalId === approval.id && 
        n.type === 'rejected' && 
        n.userId === approval.author
    );
    
    // 이미 알림이 있으면 생성하지 않음
    if (existingNotification) {
        return;
    }
    
    // 작성자에게 알림
    const approvalNumber = approval.approvalNumber || approval.id;
    createNotification(
        'rejected',
        '결재 반려',
        `"${approval.title}" 결재가 반려되었습니다.`,
        approval.id,
        approval.author
    );
}

// 알림 저장
function saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// 알림 배지 업데이트
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    const unreadCount = notifications.filter(n => !n.read && 
        (!n.userId || n.userId === currentUser?.username)).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// 알림 토스트 표시
function showNotificationToast(notification) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-toast-${notification.type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${notification.title}</strong>
            <p>${notification.message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// 알림 목록 로드
function loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    // 현재 사용자 관련 알림만 필터링
    const userNotifications = notifications.filter(n => 
        !n.userId || n.userId === currentUser?.username
    );
    
    if (userNotifications.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 40px; text-align: center; color: #999;">알림이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = userNotifications.map(notification => {
        const date = new Date(notification.createdAt);
        const dateStr = date.toLocaleString('ko-KR');
        const readClass = notification.read ? 'read' : 'unread';
        const typeIcon = {
            'pending': '⏳',
            'approved': '✅',
            'rejected': '❌',
            'system': 'ℹ️'
        }[notification.type] || 'ℹ️';
        
        return `
            <div class="notification-item ${readClass}">
                <div class="notification-icon">${typeIcon}</div>
                <div class="notification-content" onclick="viewNotification(${notification.id}, ${notification.approvalId || 'null'})" style="flex: 1; cursor: pointer;">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-date">${dateStr}</div>
                </div>
                <button class="notification-delete-btn" onclick="event.stopPropagation(); deleteNotification(${notification.id})" title="삭제">
                    <span style="font-size: 18px; color: #999;">&times;</span>
                </button>
                ${!notification.read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `;
    }).join('');
}

// 알림 확인
function viewNotification(notificationId, approvalId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    // 읽음 처리
    notification.read = true;
    saveNotifications();
    updateNotificationBadge();
    loadNotifications();
    
    // 같은 결재에 대한 다른 읽지 않은 알림도 읽음 처리 (중복 알림 방지)
    if (approvalId) {
        notifications.forEach(n => {
            if (n.approvalId === approvalId && 
                n.type === notification.type && 
                !n.read && 
                n.id !== notificationId) {
                n.read = true;
            }
        });
        saveNotifications();
        updateNotificationBadge();
        loadNotifications();
    }
    
    // 결재 상세 보기
    if (approvalId) {
        closeNotificationModal();
        viewApprovalDetail(approvalId);
    }
}

// 모든 알림 읽음 처리
function markAllNotificationsAsRead() {
    notifications.forEach(n => {
        if (!n.userId || n.userId === currentUser?.username) {
            n.read = true;
        }
    });
    saveNotifications();
    updateNotificationBadge();
    loadNotifications();
}

// 알림 삭제
function deleteNotification(notificationId) {
    if (confirm('이 알림을 삭제하시겠습니까?')) {
        notifications = notifications.filter(n => n.id !== notificationId);
        saveNotifications();
        updateNotificationBadge();
        loadNotifications();
    }
}

// 모든 알림 삭제
function deleteAllNotifications() {
    if (!currentUser) return;
    
    const userNotificationCount = notifications.filter(n => 
        !n.userId || n.userId === currentUser.username
    ).length;
    
    if (userNotificationCount === 0) {
        alert('삭제할 알림이 없습니다.');
        return;
    }
    
    if (confirm(`모든 알림(${userNotificationCount}개)을 삭제하시겠습니까?`)) {
        // 현재 사용자 관련 알림만 삭제
        notifications = notifications.filter(n => 
            n.userId && n.userId !== currentUser.username
        );
        saveNotifications();
        updateNotificationBadge();
        loadNotifications();
    }
}

// 알림 모달 열기
function showNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (!modal) return;
    
    modal.classList.add('active');
    loadNotifications();
}

// 알림 모달 닫기
function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (!modal) return;
    
    modal.classList.remove('active');
}

// 주기적으로 승인 대기 알림 체크
function startNotificationCheck() {
    // 이미 실행 중이면 중지
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
    }
    
    // 30초마다 체크
    notificationCheckInterval = setInterval(() => {
        if (!currentUser) return;
        
        const pendingApprovals = approvals.filter(a => 
            (a.status === 'pending' || a.status === 'processing') &&
            a.author !== currentUser.username &&
            canUserApprove(a)
        );
        
        pendingApprovals.forEach(approval => {
            // 현재 사용자가 승인 권한이 있는 경우에만 알림 체크
            if (canUserApprove(approval)) {
                // 이미 이 결재에 대한 pending 알림이 있는지 확인 (읽음 여부와 관계없이)
                const existingNotification = notifications.find(n => 
                    n.approvalId === approval.id && 
                    n.type === 'pending'
                );
                
                // 한 개의 결재당 한 번만 알림 생성
                if (!existingNotification) {
                    createNotification(
                        'pending',
                        '결재 승인 대기',
                        `"${approval.title}" 결재가 승인을 기다리고 있습니다.`,
                        approval.id,
                        currentUser.username
                    );
                }
            }
        });
    }, 30000); // 30초마다 체크
}

// 알림 체크 중지
function stopNotificationCheck() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
    }
}

