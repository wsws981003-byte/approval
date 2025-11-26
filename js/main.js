// 메인 초기화 및 공통 함수

// 역할별 권한 체크
function hasPermission(action) {
    if (!currentUser) return false;
    
    // 대표님 또는 본사는 모든 권한
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
        return true;
    }
    
    // 현장소장 또는 현장 권한 체크
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
        const managerPermissions = [
            'view_dashboard',
            'create_approval',
            'view_own_approvals',
            'approve_own_site',
            'reject_own_site'
        ];
        return managerPermissions.includes(action);
    }
    
    // 관리부 또는 기타는 읽기 전용
    if (currentUser.role === 'admin_dept' || currentUser.role === 'other') {
        const readOnlyPermissions = [
            'view_dashboard',
            'view_own_approvals'
        ];
        return readOnlyPermissions.includes(action);
    }
    
    return false;
}

// 현장소장이 해당 현장의 담당자인지 확인
function isSiteManager(siteId) {
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'site')) return false;
    const site = sites.find(s => s.id === siteId);
    return site && site.manager === currentUser.username;
}

// 역할에 따른 UI 업데이트
async function updateUIByRole() {
    if (!currentUser) return;

    // 현장 관리 버튼 (대표님만)
    const addSiteButton = document.getElementById('addSiteButtonContainer');
    if (addSiteButton) {
        addSiteButton.style.display = hasPermission('manage_sites') ? 'block' : 'none';
    }

    // 현장 관리 메뉴 (대표님만)
    const sitesNavBtn = document.querySelector('.nav-btn[onclick*="showSection(\'sites\'"]');
    if (sitesNavBtn) {
        sitesNavBtn.style.display = hasPermission('manage_sites') ? 'inline-block' : 'none';
    }

    // 회원가입 요청 관리 메뉴 (본사만)
    const userRequestsNavBtn = document.getElementById('userRequestsNavBtn');
    if (userRequestsNavBtn) {
        userRequestsNavBtn.style.display = (currentUser.role === 'ceo' || currentUser.role === 'headquarters') ? 'inline-block' : 'none';
    }

    // 백업 조회 메뉴 (본사/기타)
    const backupViewerNavBtn = document.getElementById('backupViewerNavBtn');
    if (backupViewerNavBtn) {
        backupViewerNavBtn.style.display = (currentUser.role === 'ceo' || currentUser.role === 'headquarters' || currentUser.role === 'admin_dept' || currentUser.role === 'other') ? 'inline-block' : 'none';
    }

    // 현장 삭제 버튼 (대표님만)
    if (typeof loadSites === 'function') {
        await loadSites();
    }
    if (typeof loadApprovals === 'function') {
        await loadApprovals();
    }
    if (typeof loadPendingApprovals === 'function') {
        await loadPendingApprovals();
    }
    
    // 회원가입 요청 목록 로드 (본사만)
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
        await loadUserRequests();
    }
}

// 섹션 전환
async function showSection(sectionId, event) {
    // 모든 섹션에서 active 클래스 제거 및 인라인 스타일 초기화
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.opacity = '';
        s.style.transform = '';
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // 대상 섹션 활성화
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 클릭된 버튼에 active 클래스 추가
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // 이벤트가 없으면 버튼을 찾아서 활성화
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(sectionId)) {
                btn.classList.add('active');
            }
        });
    }
    
    if (sectionId === 'approvals') {
        await loadApprovals();
    } else if (sectionId === 'pending') {
        await loadPendingApprovals();
    } else if (sectionId === 'date-query') {
        // 날짜별 조회 섹션 활성화 시 달력 초기화
        currentCalendarDate = new Date();
        initCalendar();
        const dateInput = document.getElementById('dateQueryInput');
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            loadApprovalsByDate();
        }
    } else if (sectionId === 'dashboard') {
        updateDashboard();
        // 차트 초기화 (대시보드 섹션 활성화 시)
        if (typeof initCharts === 'function') {
            setTimeout(() => initCharts(), 100);
        }
    } else if (sectionId === 'sites') {
        loadSites();
    } else if (sectionId === 'new-approval') {
        if (typeof updateApprovalSites === 'function') {
            await updateApprovalSites();
        } else {
            console.error('updateApprovalSites 함수를 찾을 수 없습니다.');
        }
    } else if (sectionId === 'user-requests') {
        await loadUserRequests();
    } else if (sectionId === 'backup-viewer') {
        // 백업 뷰어는 파일 로드 시 자동 표시
        initBackupSelectors();
    } else if (sectionId === 'my-info') {
        loadMyInfo();
    }
}

// 초기화
async function init() {
    // Supabase 초기화 (설정되어 있으면)
    if (typeof initSupabase === 'function') {
        const supabaseConnected = initSupabase();
        if (supabaseConnected) {
            console.log('✅ Supabase 모드로 실행 중');
        } else {
            console.log('ℹ️ localStorage 모드로 실행 중');
        }
    }
    
    // 데이터 동기화 (Supabase 또는 localStorage에서 불러오기)
    await syncData();
    
    // 기본 대표님 계정 초기화
    await initializeDefaultCEO();
    
    // 로그인 상태 확인
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    showMainContent();
    
    // 함수가 정의되어 있는지 확인 후 호출
    if (typeof loadSites === 'function') {
        await loadSites();
    }
    if (typeof loadApprovals === 'function') {
        await loadApprovals();
    }
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
    if (typeof updateApprovalSites === 'function') {
        await updateApprovalSites();
    }
    if (typeof updateSiteFilter === 'function') {
        updateSiteFilter();
    }
    if (typeof updateUIByRole === 'function') {
        await updateUIByRole();
    }
    
    // 알림 초기화
    initNotifications();
    
    // 대시보드 섹션 활성화 (로그인 시 기본 화면)
    showSection('dashboard', null);
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const siteModal = document.getElementById('siteModal');
    const detailModal = document.getElementById('approvalDetailModal');
    const registerModal = document.getElementById('registerModal');
    const advancedSearchModal = document.getElementById('advancedSearchModal');
    const notificationModal = document.getElementById('notificationModal');
    const editApprovalModal = document.getElementById('editApprovalModal');
    const editUserModal = document.getElementById('editUserModal');
    
    if (event.target === siteModal) {
        closeSiteModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
    if (event.target === registerModal) {
        closeRegisterModal();
    }
    if (event.target === advancedSearchModal) {
        closeAdvancedSearchModal();
    }
    if (event.target === notificationModal) {
        closeNotificationModal();
    }
    if (event.target === editApprovalModal) {
        closeEditApprovalModal();
    }
    
    if (event.target === editUserModal) {
        closeEditUserModal();
    }
}

// 초기화 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

