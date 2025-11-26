// 데이터 저장소 (전역 변수 - UI 업데이트용)
let sites = [];
let approvals = [];
// currentUser는 localStorage에 저장하여 새로고침 후에도 로그인 상태 유지
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let userRequests = [];
let approvedUsers = [];
let deletedUsers = [];

// 데이터 동기화 함수 (Supabase 또는 localStorage에서 불러오기)
async function syncData() {
    // currentUser는 보존 (로그인 상태 유지)
    const savedCurrentUser = currentUser;
    
    if (typeof dataService !== 'undefined') {
        sites = await dataService.getSites();
        approvals = await dataService.getApprovals();
        userRequests = await dataService.getUserRequests();
        approvedUsers = await dataService.getApprovedUsers();
        deletedUsers = await dataService.getDeletedUsers();
    } else {
        // dataService가 없으면 localStorage 사용
        sites = JSON.parse(localStorage.getItem('sites')) || [];
        approvals = JSON.parse(localStorage.getItem('approvals')) || [];
        userRequests = JSON.parse(localStorage.getItem('userRequests')) || [];
        approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];
        deletedUsers = JSON.parse(localStorage.getItem('deletedUsers')) || [];
    }
    
    // currentUser 복원 (로그인 상태 유지)
    if (savedCurrentUser) {
        currentUser = savedCurrentUser;
    } else {
        // 저장된 currentUser가 없으면 localStorage에서 불러오기
        currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }
}

// 기본 대표님 계정 초기화 (최초 1회만 또는 삭제된 경우 복구)
async function initializeDefaultCEO() {
    await syncData(); // 최신 데이터 불러오기
    
    const defaultCEOUsername = 'admin';
    const existingAdmin = approvedUsers.find(u => u.username === defaultCEOUsername && u.role === 'ceo');
    
    // 기본 대표님 계정이 없으면 생성/복구
    if (!existingAdmin) {
        const defaultCEO = {
            username: defaultCEOUsername,
            password: 'admin123',
            role: 'ceo',
            name: '대표님',
            phone: '',
            email: '',
            approvedAt: new Date().toISOString(),
            approvedBy: 'system'
        };
        
        if (typeof dataService !== 'undefined') {
            await dataService.saveApprovedUser(defaultCEO);
        } else {
            approvedUsers.push(defaultCEO);
            localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
        }
        
        await syncData(); // 데이터 다시 불러오기
    }
}

