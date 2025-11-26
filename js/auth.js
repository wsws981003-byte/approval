// 인증 관련 함수

// 로그인 모달 표시
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('mainContainer').style.display = 'none';
}

// 메인 콘텐츠 표시
function showMainContent() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('mainContainer').style.display = 'block';
    updateUserInfo();
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('ID와 비밀번호를 입력해주세요.');
        return;
    }

    // 최신 데이터 동기화 (Supabase 또는 localStorage에서 불러오기)
    await syncData();

    // 승인된 사용자인지 확인 (ID로만 검색)
    const approvedUser = approvedUsers.find(u => u.username === username);
    if (!approvedUser) {
        alert('승인되지 않은 사용자이거나 존재하지 않는 ID입니다. 대표님의 승인을 기다려주세요.');
        return;
    }

    // 비밀번호 확인 (간단한 체크 - 실제로는 해시 비교 필요)
    if (approvedUser.password !== password) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 승인된 사용자의 역할을 자동으로 가져옴
    currentUser = {
        username: username,
        role: approvedUser.role, // 승인된 사용자의 역할 자동 설정
        loginTime: new Date().toISOString()
    };

    // localStorage에 저장하여 새로고침 후에도 로그인 상태 유지
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainContent();
    await init();
    // 대시보드 섹션 활성화
    showSection('dashboard', null);
}

// 회원가입 모달 표시
function showRegisterModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('registerModal').classList.add('active');
}

// 회원가입 모달 닫기
function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerModal').querySelector('form').reset();
    document.getElementById('loginModal').classList.add('active');
}

// 회원가입 처리
function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const role = document.getElementById('registerRole').value;
    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const email = document.getElementById('registerEmail').value.trim();

    if (!username || !password || !role || !name) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    if (password.length < 4) {
        alert('비밀번호는 4자 이상이어야 합니다.');
        return;
    }

    // 이미 승인된 사용자인지 확인
    const existingApproved = approvedUsers.find(u => u.username === username);
    if (existingApproved) {
        alert('이미 가입된 사용자입니다.');
        return;
    }

    // 이미 대기 중인 요청이 있는지 확인
    const existingRequest = userRequests.find(r => r.username === username && r.status === 'pending');
    if (existingRequest) {
        alert('이미 회원가입 요청이 대기 중입니다.');
        return;
    }

    const request = {
        id: Date.now(),
        username: username,
        password: password, // 실제로는 해시화 필요
        role: role,
        name: name,
        phone: phone,
        email: email,
        status: 'pending',
        requestedAt: new Date().toISOString()
    };

    // 첫 번째 대표님 계정은 자동 승인
    const isFirstCEO = role === 'ceo' && approvedUsers.filter(u => u.role === 'ceo').length === 0;
    
    if (isFirstCEO) {
        // 자동 승인
        const approvedUser = {
            username: username,
            password: password,
            role: role,
            name: name,
            phone: phone,
            email: email,
            approvedAt: new Date().toISOString(),
            approvedBy: 'system'
        };
        
        // Supabase 또는 localStorage에 저장
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            (async () => {
                await dataService.saveApprovedUser(approvedUser);
                await syncData();
                alert('첫 번째 대표님 계정이 자동으로 승인되었습니다. 로그인해주세요.');
                closeRegisterModal();
            })();
            return;
        } else {
            approvedUsers.push(approvedUser);
            localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
        }
        
        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.approvedBy = 'system';
        
        alert('첫 번째 대표님 계정이 자동으로 승인되었습니다. 로그인해주세요.');
    } else {
        // Supabase 또는 localStorage에 저장
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            (async () => {
                const saved = await dataService.saveUserRequest(request);
                if (saved) {
                    await syncData(); // 데이터 동기화
                    alert('회원가입 요청이 제출되었습니다. 대표님의 승인을 기다려주세요.');
                    closeRegisterModal();
                } else {
                    alert('회원가입 요청 저장 중 오류가 발생했습니다.');
                }
            })();
            return; // 비동기 처리 중이므로 여기서 종료
        } else {
            userRequests.push(request);
            localStorage.setItem('userRequests', JSON.stringify(userRequests));
            alert('회원가입 요청이 제출되었습니다. 대표님의 승인을 기다려주세요.');
        }
    }
    
    closeRegisterModal();
}

// 로그아웃 처리
function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        // 알림 체크 중지
        if (typeof stopNotificationCheck === 'function') {
            stopNotificationCheck();
        }
        
        currentUser = null;
        // localStorage에서 제거 (혹시 남아있을 수 있으므로)
        localStorage.removeItem('currentUser');
        showLoginModal();
        // 모든 섹션 숨기기
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    }
}

// 사용자 정보 업데이트
function updateUserInfo() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userRole').textContent = `(${getRoleText(currentUser.role)})`;
}

