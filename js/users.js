// 사용자 관리 함수

// 내 정보 로드
function loadMyInfo() {
    if (!currentUser) return;

    const user = approvedUsers.find(u => u.username === currentUser.username);
    if (!user) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
    }

    document.getElementById('myInfoUsername').value = user.username;
    document.getElementById('myInfoName').value = user.name || '';
    document.getElementById('myInfoPhone').value = user.phone || '';
    document.getElementById('myInfoEmail').value = user.email || '';
    document.getElementById('myInfoRole').value = getRoleText(user.role);
}

// 사용자 정보 수정
async function updateMyInfo(event) {
    event.preventDefault();
    if (!currentUser) return;

    const user = approvedUsers.find(u => u.username === currentUser.username);
    if (!user) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
    }

    const name = document.getElementById('myInfoName').value.trim();
    const phone = document.getElementById('myInfoPhone').value.trim();
    const email = document.getElementById('myInfoEmail').value.trim();

    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }

    // 사용자 정보 업데이트
    const updates = {
        name: name,
        phone: phone || null,
        email: email || null
    };

    // Supabase 또는 localStorage에 업데이트
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        const updated = await dataService.updateApprovedUser(currentUser.username, updates);
        if (updated) {
            await syncData();
            alert('정보가 수정되었습니다.');
        } else {
            alert('정보 수정 중 오류가 발생했습니다.');
            return;
        }
    } else {
        user.name = name;
        user.phone = phone;
        user.email = email;
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
        alert('정보가 수정되었습니다.');
    }
    
    // 헤더의 사용자 정보도 업데이트
    updateUserInfo();
}

// 비밀번호 변경
async function changePassword(event) {
    event.preventDefault();
    if (!currentUser) return;

    const user = approvedUsers.find(u => u.username === currentUser.username);
    if (!user) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
    }

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

    // 현재 비밀번호 확인
    if (user.password !== currentPassword) {
        alert('현재 비밀번호가 일치하지 않습니다.');
        return;
    }

    // 새 비밀번호 확인
    if (newPassword !== newPasswordConfirm) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }

    if (newPassword.length < 4) {
        alert('비밀번호는 4자 이상이어야 합니다.');
        return;
    }

    // Supabase 또는 localStorage에 비밀번호 업데이트
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        const updated = await dataService.updateApprovedUser(currentUser.username, { password: newPassword });
        if (updated) {
            await syncData();
            document.getElementById('passwordChangeForm').reset();
            alert('비밀번호가 변경되었습니다.');
        } else {
            alert('비밀번호 변경 중 오류가 발생했습니다.');
        }
    } else {
        user.password = newPassword;
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
        document.getElementById('passwordChangeForm').reset();
        alert('비밀번호가 변경되었습니다.');
    }
}

// 회원가입 요청 목록 로드
async function loadUserRequests() {
    // 최신 데이터 동기화
    if (typeof dataService !== 'undefined') {
        await syncData();
    } else {
        userRequests = JSON.parse(localStorage.getItem('userRequests')) || [];
    }
    
    const pendingRequests = userRequests.filter(r => r.status === 'pending');
    const tbody = document.getElementById('userRequestsTableBody');
    
    if (pendingRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">대기 중인 회원가입 요청이 없습니다.</td></tr>';
    } else {
        tbody.innerHTML = pendingRequests.map(request => {
            return `
                <tr>
                    <td>${request.id}</td>
                    <td>${request.username}</td>
                    <td>${request.name}</td>
                    <td>${getRoleText(request.role)}</td>
                    <td>${request.phone || '-'}</td>
                    <td>${request.email || '-'}</td>
                    <td>${formatDate(request.requestedAt)}</td>
                    <td>
                        <button class="btn btn-success" onclick="approveUserRequest(${request.id})" style="padding: 5px 10px; font-size: 14px;">승인</button>
                        <button class="btn btn-danger" onclick="rejectUserRequest(${request.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">거부</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // 승인된 사용자 목록
    const approvedTbody = document.getElementById('approvedUsersTableBody');
    if (approvedUsers.length === 0) {
        approvedTbody.innerHTML = '<tr><td colspan="7" class="empty-state">승인된 사용자가 없습니다.</td></tr>';
    } else {
        approvedTbody.innerHTML = approvedUsers.map(user => {
            const isDefaultAdmin = user.username === 'admin' && user.role === 'ceo';
            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.name}</td>
                    <td>${getRoleText(user.role)}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${user.email || '-'}</td>
                    <td>${formatDate(user.approvedAt)}</td>
                    <td>
                        <button class="btn btn-primary" onclick="editUserInfo('${user.username}')" style="padding: 5px 10px; font-size: 14px;">수정</button>
                        ${isDefaultAdmin ? 
                            '<span style="color: #999; font-size: 14px; margin-left: 5px;">삭제 불가</span>' : 
                            `<button class="btn btn-danger" onclick="removeApprovedUser('${user.username}')" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">삭제</button>`}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // 삭제된 사용자 목록
    const deletedTbody = document.getElementById('deletedUsersTableBody');
    if (deletedUsers.length === 0) {
        deletedTbody.innerHTML = '<tr><td colspan="8" class="empty-state">삭제된 사용자가 없습니다.</td></tr>';
    } else {
        deletedTbody.innerHTML = deletedUsers.map(user => {
            return `
                <tr style="opacity: 0.7;">
                    <td>${user.username}</td>
                    <td>${user.name}</td>
                    <td>${getRoleText(user.role)}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${user.email || '-'}</td>
                    <td>${formatDate(user.deletedAt)}</td>
                    <td>${user.deletedBy || '-'}</td>
                    <td>
                        <button class="btn btn-success" onclick="restoreDeletedUser('${user.username}')" style="padding: 5px 10px; font-size: 14px;">복구</button>
                        <button class="btn btn-danger" onclick="permanentlyDeleteUser('${user.username}')" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">영구 삭제</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// 회원가입 요청 승인
async function approveUserRequest(requestId) {
    const request = userRequests.find(r => r.id === requestId);
    if (!request) return;

    if (confirm(`${request.name}(${request.username})님의 회원가입을 승인하시겠습니까?`)) {
        // 승인된 사용자 목록에 추가
        const approvedUser = {
            username: request.username,
            password: request.password,
            role: request.role,
            name: request.name,
            phone: request.phone,
            email: request.email,
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser.username
        };

        // Supabase 또는 localStorage에 저장
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            await dataService.saveApprovedUser(approvedUser);
            await dataService.updateUserRequest(requestId, {
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentUser.username
            });
            await syncData();
        } else {
            approvedUsers.push(approvedUser);
            localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
            
            // 요청 상태 업데이트
            request.status = 'approved';
            request.approvedAt = new Date().toISOString();
            request.approvedBy = currentUser.username;
            localStorage.setItem('userRequests', JSON.stringify(userRequests));
        }

        await loadUserRequests();
        alert('회원가입이 승인되었습니다.');
    }
}

// 회원가입 요청 거부
async function rejectUserRequest(requestId) {
    const request = userRequests.find(r => r.id === requestId);
    if (!request) return;

    const reason = prompt('거부 사유를 입력하세요 (선택사항):');
    
    // 요청 상태 업데이트
    const updates = {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: currentUser.username
    };
    if (reason) {
        updates.rejection_reason = reason;
    }
    
    // Supabase 또는 localStorage에 저장
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        await dataService.updateUserRequest(requestId, updates);
        await syncData();
    } else {
        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();
        request.rejectedBy = currentUser.username;
        if (reason) {
            request.rejectionReason = reason;
        }
        localStorage.setItem('userRequests', JSON.stringify(userRequests));
    }

    await loadUserRequests();
    alert('회원가입 요청이 거부되었습니다.');
}

// 승인된 사용자 삭제
async function removeApprovedUser(username) {
    // 기본 대표님 계정은 삭제 불가
    if (username === 'admin') {
        alert('기본 대표님 계정(admin)은 삭제할 수 없습니다.');
        return;
    }
    
    if (confirm(`${username} 사용자를 삭제하시겠습니까? 이 사용자는 더 이상 로그인할 수 없습니다.\n\n삭제된 계정은 나중에 복구할 수 있습니다.`)) {
        const userToDelete = approvedUsers.find(u => u.username === username);
        if (userToDelete) {
            // 삭제된 사용자 정보에 삭제 시간 추가
            const deletedUser = {
                ...userToDelete,
                deletedAt: new Date().toISOString(),
                deletedBy: currentUser ? currentUser.username : 'system'
            };
            
            // Supabase 또는 localStorage에 저장
            if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
                // 삭제된 사용자 테이블에 저장
                await dataService.saveDeletedUser(deletedUser);
                // 승인된 사용자 테이블에서 삭제
                await dataService.deleteApprovedUser(username);
                await syncData();
            } else {
                deletedUsers.push(deletedUser);
                localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers));
                approvedUsers = approvedUsers.filter(u => u.username !== username);
                localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
            }
            
            await loadUserRequests();
            alert('사용자가 삭제되었습니다.');
        }
    }
}

// 삭제된 사용자 복구
async function restoreDeletedUser(username) {
    const deletedUser = deletedUsers.find(u => u.username === username);
    if (!deletedUser) {
        alert('삭제된 사용자를 찾을 수 없습니다.');
        return;
    }
    
    // 이미 승인된 사용자 목록에 있는지 확인
    const existingUser = approvedUsers.find(u => u.username === username);
    if (existingUser) {
        alert('이미 승인된 사용자 목록에 존재하는 사용자입니다.');
        return;
    }
    
    if (confirm(`${deletedUser.name}(${username}) 사용자를 복구하시겠습니까?`)) {
        // 삭제 정보 제거하고 승인된 사용자 목록에 추가
        const restoredUser = {
            username: deletedUser.username,
            password: deletedUser.password,
            role: deletedUser.role,
            name: deletedUser.name,
            phone: deletedUser.phone || '',
            email: deletedUser.email || '',
            approvedAt: deletedUser.approvedAt,
            approvedBy: deletedUser.approvedBy || 'system'
        };
        
        // Supabase 또는 localStorage에 저장
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            // 승인된 사용자 테이블에 저장
            await dataService.saveApprovedUser(restoredUser);
            // 삭제된 사용자 테이블에서 제거
            await dataService.permanentlyDeleteUser(username);
            await syncData();
        } else {
            approvedUsers.push(restoredUser);
            localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
            
            // 삭제된 사용자 목록에서 제거
            deletedUsers = deletedUsers.filter(u => u.username !== username);
            localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers));
        }
        
        await loadUserRequests();
        alert('사용자가 복구되었습니다.');
    }
}

// 사용자 영구 삭제
async function permanentlyDeleteUser(username) {
    if (confirm(`${username} 사용자를 영구적으로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        // Supabase 또는 localStorage에서 삭제
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            await dataService.permanentlyDeleteUser(username);
            await syncData();
        } else {
            deletedUsers = deletedUsers.filter(u => u.username !== username);
            localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers));
        }
        
        await loadUserRequests();
        alert('사용자가 영구적으로 삭제되었습니다.');
    }
}

// 사용자 정보 수정 모달 열기 (본사만)
function editUserInfo(username) {
    // 본사만 수정 가능
    if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters')) {
        alert('사용자 정보 수정은 본사만 가능합니다.');
        return;
    }
    
    const user = approvedUsers.find(u => u.username === username);
    if (!user) {
        alert('사용자를 찾을 수 없습니다.');
        return;
    }
    
    // 기본 대표님 계정은 역할 변경 불가
    const isDefaultAdmin = username === 'admin' && (user.role === 'ceo' || user.role === 'headquarters');
    
    // 모달에 데이터 채우기
    document.getElementById('editUserUsername').value = user.username;
    document.getElementById('editUserUsernameDisplay').value = user.username;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPassword').value = '';
    
    // 기본 대표님 계정은 역할 변경 불가
    if (isDefaultAdmin) {
        document.getElementById('editUserRole').disabled = true;
        document.getElementById('editUserRole').style.background = '#f8f9fa';
    } else {
        document.getElementById('editUserRole').disabled = false;
        document.getElementById('editUserRole').style.background = 'white';
    }
    
    // 모달 표시
    document.getElementById('editUserModal').classList.add('active');
}

// 사용자 정보 수정 모달 닫기
function closeEditUserModal() {
    document.getElementById('editUserModal').classList.remove('active');
    document.getElementById('editUserForm').reset();
}

// 사용자 정보 업데이트 (본사용)
async function updateApprovedUserInfo(event) {
    event.preventDefault();
    
    // 본사만 수정 가능
    if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters')) {
        alert('사용자 정보 수정은 본사만 가능합니다.');
        return;
    }
    
    const username = document.getElementById('editUserUsername').value;
    const name = document.getElementById('editUserName').value.trim();
    const role = document.getElementById('editUserRole').value;
    const phone = document.getElementById('editUserPhone').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const newPassword = document.getElementById('editUserPassword').value;
    
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (newPassword && newPassword.length < 4) {
        alert('비밀번호는 4자 이상이어야 합니다.');
        return;
    }
    
    const user = approvedUsers.find(u => u.username === username);
    if (!user) {
        alert('사용자를 찾을 수 없습니다.');
        return;
    }
    
    // 업데이트할 데이터 준비
    const updates = {
        name: name,
        role: role,
        phone: phone || null,
        email: email || null
    };
    
    // 비밀번호가 입력된 경우에만 업데이트
    if (newPassword) {
        updates.password = newPassword;
    }
    
    // Supabase 또는 localStorage에 업데이트
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        const updated = await dataService.updateApprovedUser(username, updates);
        if (updated) {
            await syncData();
            alert('사용자 정보가 수정되었습니다.');
            closeEditUserModal();
            await loadUserRequests();
        } else {
            alert('사용자 정보 수정 중 오류가 발생했습니다.');
        }
    } else {
        // localStorage 업데이트
        user.name = name;
        user.role = role;
        user.phone = phone;
        user.email = email;
        if (newPassword) {
            user.password = newPassword;
        }
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
        alert('사용자 정보가 수정되었습니다.');
        closeEditUserModal();
        loadUserRequests();
    }
}

