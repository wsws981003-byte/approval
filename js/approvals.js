// 결재 관리 함수

// 결재 저장 헬퍼 함수
async function saveApprovalToStorage(approval) {
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        // Supabase에 저장
        const saved = await dataService.saveApproval(approval);
        if (saved) {
            await syncData(); // 데이터 동기화
            return true;
        }
        return false;
    } else {
        // localStorage에 저장
        approvals.push(approval);
        localStorage.setItem('approvals', JSON.stringify(approvals));
        return true;
    }
}

// 결재 업데이트 헬퍼 함수
async function updateApprovalInStorage(approvalId, updates) {
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        // Supabase에 업데이트
        const updated = await dataService.updateApproval(approvalId, updates);
        if (updated) {
            await syncData(); // 데이터 동기화
            return true;
        }
        return false;
    } else {
        // localStorage에 업데이트
        const index = approvals.findIndex(a => a.id === approvalId);
        if (index !== -1) {
            approvals[index] = { ...approvals[index], ...updates };
            localStorage.setItem('approvals', JSON.stringify(approvals));
            return true;
        }
        return false;
    }
}

// 첨부 파일 미리보기
function previewAttachment(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval || !approval.attachmentData) {
        alert('첨부 파일을 찾을 수 없습니다.');
        return;
    }
    
    // base64 데이터를 Blob으로 변환
    const byteCharacters = atob(approval.attachmentData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Blob URL 생성하여 새 창에서 열기
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // 메모리 정리를 위해 약간의 지연 후 revoke
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// 첨부 파일 다운로드
function downloadAttachment(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval || !approval.attachmentData) {
        alert('첨부 파일을 찾을 수 없습니다.');
        return;
    }
    
    // base64 데이터를 Blob으로 변환
    const byteCharacters = atob(approval.attachmentData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = approval.attachmentFileName || 'attachment.pdf';
    link.click();
    URL.revokeObjectURL(url);
}

// 첨부 파일 변경 처리
function handleAttachmentChange(event) {
    const file = event.target.files[0];
    const infoDiv = document.getElementById('attachmentInfo');
    
    if (!file) {
        infoDiv.textContent = '';
        return;
    }
    
    // 파일 크기 확인 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        event.target.value = '';
        infoDiv.textContent = '';
        return;
    }
    
    // PDF 파일인지 확인
    if (file.type !== 'application/pdf') {
        alert('PDF 파일만 업로드 가능합니다.');
        event.target.value = '';
        infoDiv.textContent = '';
        return;
    }
    
    // 파일 정보 표시
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    infoDiv.textContent = `✓ ${file.name} (${fileSize}MB)`;
}

// 수정 모달 첨부 파일 변경 처리
function handleEditAttachmentChange(event) {
    const file = event.target.files[0];
    const infoDiv = document.getElementById('editAttachmentInfo');
    
    if (!file) {
        // 파일이 없으면 기존 파일 정보 유지
        return;
    }
    
    // 파일 크기 확인 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        event.target.value = '';
        return;
    }
    
    // PDF 파일인지 확인
    if (file.type !== 'application/pdf') {
        alert('PDF 파일만 업로드 가능합니다.');
        event.target.value = '';
        return;
    }
    
    // 파일 정보 표시
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    infoDiv.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: #d4edda; border-radius: 8px; color: #155724;">
            <strong>새 첨부 파일:</strong> ${file.name} (${fileSize}MB)
        </div>
    `;
}

// 결재 번호 생성 함수
function generateApprovalNumber() {
    const currentYear = new Date().getFullYear();
    const yearApprovals = approvals.filter(a => {
        const approvalYear = new Date(a.createdAt).getFullYear();
        return approvalYear === currentYear;
    });
    
    // 해당 연도의 결재 번호 중 가장 큰 번호 찾기
    let maxNumber = 0;
    yearApprovals.forEach(a => {
        if (a.approvalNumber) {
            const match = a.approvalNumber.match(/AP-\d{4}-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        }
    });
    
    // 다음 번호 생성
    const nextNumber = maxNumber + 1;
    return `AP-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
}

// 결재 제출
function submitApproval(event) {
    event.preventDefault();
    const siteId = parseInt(document.getElementById('approvalSite').value);
    const site = sites.find(s => s.id === siteId);
    
    if (!site) {
        alert('현장을 선택해주세요.');
        return;
    }

    // 작성자 필드가 비어있으면 현재 사용자명으로 자동 설정
    let author = document.getElementById('approvalAuthor').value.trim();
    if (!author && currentUser) {
        author = currentUser.username;
    }
    
    const approval = {
        id: Date.now(),
        approvalNumber: generateApprovalNumber(),
        title: document.getElementById('approvalTitle').value,
        siteId: siteId,
        siteName: site.name,
        author: author,
        content: document.getElementById('approvalContent').value,
        attachment: null,
        attachmentFileName: null,
        attachmentData: null,
        status: 'pending',
        currentStep: 0,
        totalSteps: site.steps,
        approvers: [...site.approvers],
        approvals: Array(site.steps).fill(null),
        createdAt: new Date().toISOString()
    };
    
    // 첨부 파일 처리
    const attachmentInput = document.getElementById('approvalAttachment');
    if (attachmentInput.files && attachmentInput.files.length > 0) {
        const file = attachmentInput.files[0];
        approval.attachmentFileName = file.name;
        
        // 파일을 base64로 변환
        const reader = new FileReader();
        reader.onload = async function(e) {
            approval.attachmentData = e.target.result; // base64 문자열
            
            // 결재 저장
            if (typeof dataService !== 'undefined') {
                const saved = await dataService.saveApproval(approval);
                if (saved) {
                    console.log('결재 저장 성공:', saved);
                    await syncData(); // 데이터 동기화
                    console.log('데이터 동기화 완료, approvals 개수:', approvals.length);
                } else {
                    console.error('결재 저장 실패');
                    alert('결재 저장 중 오류가 발생했습니다.');
                    return;
                }
            } else {
                approvals.push(approval);
                localStorage.setItem('approvals', JSON.stringify(approvals));
                console.log('결재 저장 완료 (localStorage), approvals 개수:', approvals.length);
            }
            
            document.getElementById('approvalForm').reset();
            document.getElementById('attachmentInfo').textContent = '';
            // 작성자 필드를 현재 사용자의 이름으로 다시 설정
            if (currentUser) {
                const authorInput = document.getElementById('approvalAuthor');
                if (authorInput) {
                    const user = approvedUsers.find(u => u.username === currentUser.username);
                    if (user && user.name) {
                        authorInput.value = user.name;
                    } else {
                        authorInput.value = currentUser.username;
                    }
                }
            }
            alert('결재가 제출되었습니다.');
            await showSection('approvals', null);
            await loadApprovals();
            await loadPendingApprovals();
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
            
            // 승인 대기 알림 생성
            if (typeof notifyPendingApproval === 'function') {
                notifyPendingApproval(approval);
            }
        };
        reader.onerror = function() {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsDataURL(file);
    } else {
        // 첨부 파일이 없는 경우
        if (typeof dataService !== 'undefined') {
            (async () => {
                const saved = await dataService.saveApproval(approval);
                if (saved) {
                    console.log('결재 저장 성공:', saved);
                    await syncData(); // 데이터 동기화
                    console.log('데이터 동기화 완료, approvals 개수:', approvals.length);
                } else {
                    console.error('결재 저장 실패');
                    alert('결재 저장 중 오류가 발생했습니다.');
                    return;
                }
                document.getElementById('approvalForm').reset();
                document.getElementById('attachmentInfo').textContent = '';
                // 작성자 필드를 현재 사용자명으로 다시 설정
                if (currentUser) {
                    const authorInput = document.getElementById('approvalAuthor');
                    if (authorInput) {
                        authorInput.value = currentUser.username;
                    }
                }
                alert('결재가 제출되었습니다.');
                await showSection('approvals', null);
                await loadApprovals();
                await loadPendingApprovals();
                if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }
                if (typeof notifyPendingApproval === 'function') {
                    notifyPendingApproval(approval);
                }
            })();
        } else {
            approvals.push(approval);
            localStorage.setItem('approvals', JSON.stringify(approvals));
            document.getElementById('approvalForm').reset();
            document.getElementById('attachmentInfo').textContent = '';
            alert('결재가 제출되었습니다.');
            (async () => {
                await showSection('approvals', null);
                await loadApprovals();
                await loadPendingApprovals();
                if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }
                if (typeof notifyPendingApproval === 'function') {
                    notifyPendingApproval(approval);
                }
            })();
        }
    }
}

// 결재 목록 로드
async function loadApprovals() {
    const tbody = document.getElementById('approvalsTableBody');
    
    // DataService를 통해 최신 데이터 로드 (Supabase 또는 localStorage)
    if (typeof dataService !== 'undefined') {
        approvals = await dataService.getApprovals();
        console.log('결재 데이터 로드 완료 (Supabase), 개수:', approvals.length);
    } else {
        approvals = JSON.parse(localStorage.getItem('approvals')) || [];
        console.log('결재 데이터 로드 완료 (localStorage), 개수:', approvals.length);
    }
    
    if (approvals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">결재 내역이 없습니다.</td></tr>';
        return;
    }
    
    console.log('현재 사용자:', currentUser);
    console.log('로드된 결재 목록:', approvals.map(a => ({ id: a.id, title: a.title, author: a.author })));
    
    // 고급 검색이 활성화되어 있으면 고급 검색 결과 표시
    if (typeof advancedSearchActive !== 'undefined' && advancedSearchActive) {
        if (typeof displayAdvancedSearchResults === 'function') {
            displayAdvancedSearchResults();
            return;
        }
    }
    
    const filtered = getFilteredApprovals();
    console.log('필터링된 결재 목록:', filtered.map(a => ({ id: a.id, title: a.title, author: a.author })));
    tbody.innerHTML = filtered.map(approval => {
        const canApprove = canUserApprove(approval);
        const showActions = (approval.status === 'pending' || approval.status === 'processing') && canApprove;
        const approvalNumber = approval.approvalNumber || approval.id;
        
        const canCancelRejection = approval.status === 'rejected' && 
                                    currentUser && 
                                    (currentUser.role === 'ceo' || currentUser.role === 'headquarters');
        
        const canEdit = canEditApproval(approval);
        const canDelete = canDeleteApproval(approval);
        
        return `
        <tr>
            <td>${approvalNumber}</td>
            <td>${approval.title}</td>
            <td>${approval.siteName}</td>
            <td>${approval.author}</td>
            <td><span class="badge badge-${getStatusClass(approval.status)}">${getStatusText(approval.status)}</span></td>
            <td>${formatDate(approval.createdAt)}</td>
            <td>
                <button class="btn btn-primary" onclick="viewApprovalDetail(${approval.id})" style="padding: 5px 10px; font-size: 14px;">상세</button>
                ${showActions ? 
                    `<button class="btn btn-success" onclick="approveStep(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">승인</button>
                     <button class="btn btn-danger" onclick="rejectApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">반려</button>` : ''}
                ${canCancelApproval(approval) ? 
                    `<button class="btn btn-warning" onclick="cancelApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px; background: #ffc107; color: #000;">승인 취소</button>` : ''}
                ${canCancelRejection ? 
                    `<button class="btn btn-success" onclick="cancelRejection(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">반려 취소</button>` : ''}
                ${canEdit ? 
                    `<button class="btn btn-info" onclick="editApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px; background: #17a2b8; color: white;">수정</button>` : ''}
                ${canDelete ? 
                    `<button class="btn btn-danger" onclick="deleteApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">삭제</button>` : ''}
            </td>
        </tr>
    `;
    }).join('');
}

// 대기 중인 결재 목록 로드
async function loadPendingApprovals() {
    const tbody = document.getElementById('pendingTableBody');
    if (!tbody) return;
    
    // 최신 데이터 동기화 (Supabase 또는 localStorage)
    if (typeof dataService !== 'undefined') {
        approvals = await dataService.getApprovals();
    } else {
        approvals = JSON.parse(localStorage.getItem('approvals')) || [];
    }
    
    let pending = approvals.filter(a => a.status === 'pending' || a.status === 'processing');
    
    // 현장은 자신이 작성한 결재만 보기
    // 기타와 본사는 모든 결재를 볼 수 있음
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        const user = approvedUsers.find(u => u.username === currentUser.username);
        const userName = user ? user.name : null;
        
        pending = pending.filter(a => {
            return a.author === currentUser.username || 
                   (userName && a.author === userName);
        });
    }
    
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">대기 중인 결재가 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = pending.map(approval => {
        const canApprove = canUserApprove(approval);
        const approvalNumber = approval.approvalNumber || approval.id;
        const canEdit = canEditApproval(approval);
        const canDelete = canDeleteApproval(approval);
        
        return `
        <tr>
            <td>${approvalNumber}</td>
            <td>${approval.title}</td>
            <td>${approval.siteName}</td>
            <td>${approval.author}</td>
            <td>${approval.currentStep + 1}/${approval.totalSteps} (${approval.approvers[approval.currentStep] || '미지정'})</td>
            <td>${formatDate(approval.createdAt)}</td>
            <td>
                <button class="btn btn-primary" onclick="viewApprovalDetail(${approval.id})" style="padding: 5px 10px; font-size: 14px;">상세</button>
                ${canApprove ? 
                    `<button class="btn btn-success" onclick="approveStep(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">승인</button>
                     <button class="btn btn-danger" onclick="rejectApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">반려</button>` : 
                    '<span style="color: #999; font-size: 14px;">권한 없음</span>'}
                ${canCancelApproval(approval) ? 
                    `<button class="btn btn-warning" onclick="cancelApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px; background: #ffc107; color: #000;">승인 취소</button>` : ''}
                ${canEdit ? 
                    `<button class="btn btn-info" onclick="editApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px; background: #17a2b8; color: white;">수정</button>` : ''}
                ${canDelete ? 
                    `<button class="btn btn-danger" onclick="deleteApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">삭제</button>` : ''}
            </td>
        </tr>
    `;
    }).join('');
}

// 필터링된 결재 목록 가져오기
function getFilteredApprovals() {
    const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    const statusFilter = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : '';
    const siteFilter = document.getElementById('siteFilter') ? document.getElementById('siteFilter').value : '';
    
    let filtered = approvals.filter(approval => {
        const matchSearch = !search || approval.title.toLowerCase().includes(search);
        const matchStatus = !statusFilter || approval.status === statusFilter;
        const matchSite = !siteFilter || approval.siteId === parseInt(siteFilter);
        return matchSearch && matchStatus && matchSite;
    });
    
    // 현장은 자신이 작성한 결재만 보기
    // 기타와 본사는 모든 결재를 볼 수 있음
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        // 현장은 자신이 작성한 결재만 보기
        // 작성자 필드에 입력한 값이 현재 사용자의 username 또는 name과 일치하는지 확인
        const user = approvedUsers.find(u => u.username === currentUser.username);
        const userName = user ? user.name : null;
        
        filtered = filtered.filter(approval => {
            return approval.author === currentUser.username || 
                   (userName && approval.author === userName);
        });
    }
    // 본사와 기타는 모든 결재를 볼 수 있음 (필터링 없음)
    
    return filtered;
}

// 사용자가 해당 결재를 승인할 수 있는지 확인
function canUserApprove(approval) {
    if (!currentUser) return false;
    
    // 본사는 모든 결재 승인 가능
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
        return true;
    }
    
    // 기타는 승인 권한 없음 (조회만 가능)
    if (currentUser.role === 'admin_dept' || currentUser.role === 'other') {
        return false;
    }
    
    // 현장은 자신이 담당하는 현장의 결재만 승인 가능
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
        return isSiteManager(approval.siteId);
    }
    
    return false;
}

// 사용자가 해당 결재의 승인을 취소할 수 있는지 확인
function canCancelApproval(approval) {
    if (!currentUser) return false;
    
    // 승인 완료된 결재만 취소 가능
    if (approval.status !== 'approved' && approval.status !== 'processing') {
        return false;
    }
    
    // 최소 1단계 이상 승인되어 있어야 함
    if (approval.currentStep === 0) {
        return false;
    }
    
    // 이전 단계의 승인 정보 확인
    const previousStep = approval.currentStep - 1;
    const previousApproval = approval.approvals[previousStep];
    
    if (!previousApproval || previousApproval.status !== 'approved') {
        return false;
    }
    
    // 본사는 모든 결재의 승인 취소 가능
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
        return true;
    }
    
    // 승인한 사람만 취소 가능
    if (previousApproval.approver === currentUser.username) {
        return true;
    }
    
    return false;
}

// 결재 필터링
function filterApprovals() {
    // 고급 검색이 활성화되어 있으면 해제
    if (typeof advancedSearchActive !== 'undefined' && advancedSearchActive) {
        if (typeof clearAdvancedSearch === 'function') {
            clearAdvancedSearch();
            return;
        }
    }
    
    loadApprovals();
}

// 대시보드에서 상태별 결재 목록 보기
async function filterApprovalsByStatus(status) {
    // 결재 목록 섹션으로 이동 (부드러운 전환)
    await showSection('approvals', null);
    
    // 상태 필터 설정
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        if (status === '') {
            // 전체 결재인 경우 필터 초기화
            statusFilter.value = '';
        } else {
            statusFilter.value = status;
        }
    }
    
    // 검색 입력 초기화
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 현장 필터 초기화
    const siteFilter = document.getElementById('siteFilter');
    if (siteFilter) {
        siteFilter.value = '';
    }
    
    // 고급 검색 해제
    if (typeof advancedSearchActive !== 'undefined' && advancedSearchActive) {
        if (typeof clearAdvancedSearch === 'function') {
            clearAdvancedSearch();
        }
    }
    
    // 결재 목록 로드
    await loadApprovals();
    
    // 부드러운 스크롤로 상단으로 이동
    const contentArea = document.querySelector('.content');
    if (contentArea) {
        contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 결재 승인
async function approveStep(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    if (!canUserApprove(approval)) {
        alert('이 결재를 승인할 권한이 없습니다.');
        return;
    }

    // 현재 단계의 결재자 이름 확인
    const currentApproverName = approval.approvers[approval.currentStep] || '';
    
    // 본사는 자동으로 현재 사용자명 사용 (프롬프트 없음)
    let approver = currentUser.username;
    
    // 본사는 approvedUsers에서 이름 찾기
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
        const user = approvedUsers.find(u => u.username === currentUser.username);
        if (user && user.name) {
            approver = user.name;
        } else {
            approver = currentUser.username;
        }
    } else if (currentUser.role === 'manager' || currentUser.role === 'site') {
        // 현장소장은 자신의 이름으로만 승인 가능 (결재자가 지정되지 않은 경우 허용)
        if (currentApproverName && currentApproverName !== currentUser.username && !approval.approvers.includes(currentUser.username)) {
            alert('현재 단계의 결재자가 아닙니다.');
            return;
        }
        // 현장소장도 이름 사용
        const user = approvedUsers.find(u => u.username === currentUser.username);
        if (user && user.name) {
            approver = user.name;
        } else {
            approver = currentUser.username;
        }
    }

    approval.approvals[approval.currentStep] = {
        approver: approver,
        approvedAt: new Date().toISOString(),
        status: 'approved'
    };

    approval.currentStep++;
    
    if (approval.currentStep >= approval.totalSteps) {
        approval.status = 'approved';
    } else {
        approval.status = 'processing';
    }

    // 결재 업데이트 저장
    await updateApprovalInStorage(approvalId, {
        currentStep: approval.currentStep,
        status: approval.status,
        approvals: approval.approvals
    });
    
    await loadApprovals();
    await loadPendingApprovals();
    updateDashboard();
    
    // 승인 완료 알림 (모든 단계 완료 시)
    if (approval.status === 'approved') {
        notifyApprovalApproved(approval);
    }
    
    alert('승인되었습니다.');
}

// 결재 반려
async function rejectApproval(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    if (!canUserApprove(approval)) {
        alert('이 결재를 반려할 권한이 없습니다.');
        return;
    }

    const reason = prompt('반려 사유를 입력하세요:');
    if (reason === null || !reason.trim()) {
        if (reason === null) return;
        alert('반려 사유를 입력해주세요.');
        return;
    }

    const approver = currentUser.username;

    approval.status = 'rejected';
    approval.rejectedAt = new Date().toISOString();
    approval.rejectionReason = reason;
    approval.approvals[approval.currentStep] = {
        approver: approver,
        rejectedAt: new Date().toISOString(),
        status: 'rejected',
        reason: reason
    };

    // 결재 업데이트 저장
    await updateApprovalInStorage(approvalId, {
        status: approval.status,
        rejectedAt: approval.rejectedAt,
        rejectionReason: approval.rejectionReason,
        approvals: approval.approvals
    });
    
    await loadApprovals();
    loadPendingApprovals();
    updateDashboard();
    
    // 반려 알림
    notifyApprovalRejected(approval);
    
    alert('반려되었습니다.');
}

// 결재 승인 취소
async function cancelApproval(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    if (!canCancelApproval(approval)) {
        alert('승인 취소 권한이 없습니다.');
        return;
    }

    const previousStep = approval.currentStep - 1;
    const previousApproval = approval.approvals[previousStep];
    const approvalNumber = approval.approvalNumber || approval.id;
    
    if (!confirm(`결재 번호 ${approvalNumber}의 ${previousStep + 1}단계 승인을 취소하시겠습니까?\n\n승인자: ${previousApproval.approver}`)) {
        return;
    }

    // 이전 단계의 승인 정보 제거
    approval.approvals[previousStep] = null;
    
    // 현재 단계를 이전 단계로 되돌리기
    approval.currentStep = previousStep;
    
    // 상태 업데이트
    if (approval.currentStep === 0) {
        approval.status = 'pending';
    } else {
        approval.status = 'processing';
    }

    // 결재 업데이트 저장
    await updateApprovalInStorage(approvalId, {
        currentStep: approval.currentStep,
        status: approval.status,
        approvals: approval.approvals
    });
    
    await loadApprovals();
    await loadPendingApprovals();
    updateDashboard();
    alert('승인이 취소되었습니다.');
}

// 반려 취소
async function cancelRejection(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    // 본사만 반려 취소 가능
    if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters')) {
        alert('반려 취소는 본사만 가능합니다.');
        return;
    }

    // 반려된 결재인지 확인
    if (approval.status !== 'rejected') {
        alert('반려된 결재만 취소할 수 있습니다.');
        return;
    }

    const approvalNumber = approval.approvalNumber || approval.id;
    const rejectionReason = approval.rejectionReason || '사유 없음';
    
    if (!confirm(`결재 번호 ${approvalNumber}의 반려를 취소하시겠습니까?\n\n반려 사유: ${rejectionReason}\n\n취소 후 결재는 다시 승인 절차를 진행합니다.`)) {
        return;
    }

    // 반려 정보 제거
    approval.rejectedAt = null;
    approval.rejectionReason = null;
    
    // 반려된 단계의 승인 정보 제거
    if (approval.approvals && approval.approvals[approval.currentStep]) {
        approval.approvals[approval.currentStep] = null;
    }
    
    // 결재 단계를 처음부터 다시 시작
    approval.currentStep = 0;
    approval.status = 'pending';

    // 결재 업데이트 저장
    await updateApprovalInStorage(approvalId, {
        status: approval.status,
        currentStep: approval.currentStep,
        rejectedAt: null,
        rejectionReason: null,
        approvals: approval.approvals
    });
    
    await loadApprovals();
    await loadPendingApprovals();
    updateDashboard();
    
    // 승인 대기 알림 생성
    notifyPendingApproval(approval);
    
    alert('반려가 취소되었습니다. 결재가 다시 승인 절차를 진행합니다.');
}

// 결재 상세 보기
function viewApprovalDetail(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    const site = sites.find(s => s.id === approval.siteId);
    document.getElementById('detailTitle').textContent = approval.title;
    
    const approvalNumber = approval.approvalNumber || approval.id;
    let html = `
        <div style="margin-bottom: 20px;">
            <p><strong>결재 번호:</strong> ${approvalNumber}</p>
            <p><strong>현장:</strong> ${approval.siteName}</p>
            <p><strong>작성자:</strong> ${approval.author}</p>
            <p><strong>작성일:</strong> ${formatDate(approval.createdAt)}</p>
            <p><strong>상태:</strong> <span class="badge badge-${getStatusClass(approval.status)}">${getStatusText(approval.status)}</span></p>
        </div>
        <div style="margin-bottom: 20px;">
            <strong>내용:</strong>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; white-space: pre-wrap;">${approval.content}</div>
        </div>
    `;

    // 첨부 파일 표시
    if (approval.attachmentData && approval.attachmentFileName) {
        // base64 데이터를 다운로드 링크로 변환
        html += `<div style="margin-bottom: 20px;">
            <strong>첨부:</strong> 
            <button class="btn btn-primary" onclick="previewAttachment(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 10px;">
                👁️ ${approval.attachmentFileName} 미리보기
            </button>
            <button class="btn btn-secondary" onclick="downloadAttachment(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">
                📥 다운로드
            </button>
        </div>`;
    } else if (approval.attachment) {
        // 기존 URL 방식 (하위 호환성)
        html += `<div style="margin-bottom: 20px;"><strong>첨부:</strong> <a href="${approval.attachment}" target="_blank">${approval.attachment}</a></div>`;
    }

    html += '<div style="margin-top: 30px;"><strong>결재 라인:</strong>';
    for (let i = 0; i < approval.totalSteps; i++) {
        const approvalData = approval.approvals[i];
        const isCurrent = i === approval.currentStep && approval.status !== 'approved' && approval.status !== 'rejected';
        const isCompleted = approvalData && approvalData.status === 'approved';
        const isRejected = approvalData && approvalData.status === 'rejected';
        
        let className = 'approval-line';
        if (isCompleted) className += ' completed';
        if (isRejected) className += ' rejected';

        html += `
            <div class="${className}">
                <strong>${i + 1}단계: ${approval.approvers[i] || '미지정'}</strong>
                ${isCurrent ? '<span style="color: #ffc107;">⏳ 대기 중</span>' : ''}
                ${isCompleted ? `<span style="color: #28a745;">✓ 승인 완료 (${formatDate(approvalData.approvedAt)})</span>` : ''}
                ${isRejected ? `<span style="color: #dc3545;">✗ 반려 (${approvalData.reason || ''})</span>` : ''}
                ${!isCurrent && !isCompleted && !isRejected ? '<span style="color: #999;">대기 중</span>' : ''}
            </div>
        `;
    }
    html += '</div>';

    if (approval.rejectionReason) {
        html += `<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px;"><strong>반려 사유:</strong> ${approval.rejectionReason}</div>`;
    }

    document.getElementById('detailContent').innerHTML = html;
    document.getElementById('approvalDetailModal').classList.add('active');
}

// 결재 상세 모달 닫기
function closeDetailModal() {
    document.getElementById('approvalDetailModal').classList.remove('active');
}

// 결재 삭제 권한 확인
function canDeleteApproval(approval) {
    if (!currentUser) return false;
    
    // 본사는 모든 결재 삭제 가능
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
        return true;
    }
    
    // 작성자는 본인이 작성한 pending/processing 상태의 결재만 삭제 가능
    if (approval.author === currentUser.username && 
        (approval.status === 'pending' || approval.status === 'processing')) {
        return true;
    }
    
    return false;
}

// 결재 삭제
async function deleteApproval(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) {
        alert('결재를 찾을 수 없습니다.');
        return;
    }
    
    if (!canDeleteApproval(approval)) {
        alert('결재 삭제 권한이 없습니다.\n\n본인이 작성한 대기 중인 결재만 삭제할 수 있습니다.');
        return;
    }
    
    const approvalNumber = approval.approvalNumber || approval.id;
    if (confirm(`결재 번호 ${approvalNumber} (${approval.title})를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            await dataService.deleteApproval(approvalId);
            await syncData();
        } else {
            approvals = approvals.filter(a => a.id !== approvalId);
            localStorage.setItem('approvals', JSON.stringify(approvals));
        }
        updateDashboard();
        await loadApprovals();
        await loadPendingApprovals();
        alert('결재가 삭제되었습니다.');
    }
}

// 대시보드 업데이트
function updateDashboard() {
    // 현장소장은 자신이 작성한 결재만 집계
    // 기타와 본사는 모든 결재를 집계
    let userApprovals = approvals;
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        const user = approvedUsers.find(u => u.username === currentUser.username);
        const userName = user ? user.name : null;
        
        userApprovals = approvals.filter(a => {
            return a.author === currentUser.username || 
                   (userName && a.author === userName);
        });
    }
    
    const total = userApprovals.length;
    const pending = userApprovals.filter(a => a.status === 'pending' || a.status === 'processing').length;
    const approved = userApprovals.filter(a => a.status === 'approved').length;
    const rejected = userApprovals.filter(a => a.status === 'rejected').length;

    document.getElementById('totalApprovals').textContent = total;
    document.getElementById('pendingApprovals').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;

    // 최근 결재 내역
    const recent = [...userApprovals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const tbody = document.getElementById('recentTableBody');
    const canDelete = currentUser && (currentUser.role === 'ceo' || currentUser.role === 'headquarters');
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">결재 내역이 없습니다.</td></tr>';
    } else {
        tbody.innerHTML = recent.map(approval => {
            const approvalNumber = approval.approvalNumber || approval.id;
            return `
            <tr>
                <td>${approvalNumber}</td>
                <td>${approval.title}</td>
                <td>${approval.siteName}</td>
                <td>${approval.author}</td>
                <td><span class="badge badge-${getStatusClass(approval.status)}">${getStatusText(approval.status)}</span></td>
                <td>${formatDate(approval.createdAt)}</td>
                <td>
                    ${canDelete ? `<button class="btn btn-danger" onclick="deleteApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px;">삭제</button>` : '-'}
                </td>
            </tr>
        `;
        }).join('');
    }
    
    // 차트 업데이트
    if (typeof updateAllCharts === 'function') {
        updateAllCharts();
    }
}

// 결재 수정 권한 확인
function canEditApproval(approval) {
    if (!currentUser) return false;
    
    // 본사는 수정 불가 (삭제만 가능)
    // 작성자는 본인이 작성한 pending/processing/rejected 상태의 결재만 수정 가능
    if (approval.author === currentUser.username && 
        (approval.status === 'pending' || approval.status === 'processing' || approval.status === 'rejected')) {
        return true;
    }
    
    return false;
}

// 결재 수정 (반려된 결재 또는 대기 중인 결재)
function editApproval(approvalId) {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) {
        alert('결재를 찾을 수 없습니다.');
        return;
    }
    
    if (!canEditApproval(approval)) {
        alert('결재 수정 권한이 없습니다.\n\n본인이 작성한 대기 중이거나 반려된 결재만 수정할 수 있습니다.');
        return;
    }
    
    // 수정 가능한 상태 확인
    if (approval.status === 'approved') {
        alert('이미 승인 완료된 결재는 수정할 수 없습니다.');
        return;
    }
    
    // 수정 모달 열기
    showEditApprovalModal(approval);
}

// 반려된 결재 수정 (하위 호환성 유지)
function editRejectedApproval(approvalId) {
    editApproval(approvalId);
}

// 결재 수정 모달 표시
function showEditApprovalModal(approval) {
    const modal = document.getElementById('editApprovalModal');
    if (!modal) return;
    
    // 모달 제목 동적 변경
    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) {
        if (approval.status === 'rejected') {
            modalTitle.textContent = '반려된 결재 수정';
        } else if (approval.status === 'pending' || approval.status === 'processing') {
            modalTitle.textContent = '결재 수정';
        } else {
            modalTitle.textContent = '결재 수정';
        }
    }
    
    // 제출 버튼 텍스트 동적 변경
    const submitButton = modal.querySelector('button[type="submit"]');
    if (submitButton) {
        if (approval.status === 'rejected') {
            submitButton.textContent = '수정 후 다시 제출';
        } else {
            submitButton.textContent = '수정 저장';
        }
    }
    
    // 기존 데이터 채우기
    document.getElementById('editApprovalId').value = approval.id;
    document.getElementById('editApprovalTitle').value = approval.title;
    document.getElementById('editApprovalContent').value = approval.content || '';
    
    // 현장 선택
    const siteSelect = document.getElementById('editApprovalSite');
    siteSelect.innerHTML = '';
    sites.forEach(site => {
        const option = document.createElement('option');
        option.value = site.id;
        option.textContent = site.name;
        if (site.id === approval.siteId || site.name === approval.siteName) {
            option.selected = true;
        }
        siteSelect.appendChild(option);
    });
    
    // 작성자
    document.getElementById('editApprovalAuthor').value = approval.author;
    
    // 기존 첨부 파일 정보 표시
    const attachmentInfo = document.getElementById('editAttachmentInfo');
    if (approval.attachmentFileName) {
        attachmentInfo.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <strong>기존 첨부 파일:</strong> ${approval.attachmentFileName}
                <button type="button" class="btn btn-sm btn-secondary" onclick="clearEditAttachment()" style="margin-left: 10px; padding: 5px 10px;">제거</button>
            </div>
        `;
    } else {
        attachmentInfo.innerHTML = '';
    }
    
    // 반려 사유 표시 (반려된 결재인 경우만)
    const rejectionInfo = document.getElementById('editRejectionInfo');
    if (approval.status === 'rejected' && approval.rejectionReason) {
        rejectionInfo.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>반려 사유:</strong> ${approval.rejectionReason}
            </div>
        `;
    } else {
        rejectionInfo.innerHTML = '';
    }
    
    modal.classList.add('active');
}

// 결재 수정 모달 닫기
function closeEditApprovalModal() {
    const modal = document.getElementById('editApprovalModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.getElementById('editApprovalForm').reset();
    document.getElementById('editAttachmentInfo').innerHTML = '';
    document.getElementById('editRejectionInfo').innerHTML = '';
}

// 수정된 결재 제출
function submitEditedApproval(event) {
    event.preventDefault();
    
    const approvalId = parseInt(document.getElementById('editApprovalId').value);
    const approval = approvals.find(a => a.id === approvalId);
    
    if (!approval) {
        alert('결재를 찾을 수 없습니다.');
        return;
    }
    
    const siteId = parseInt(document.getElementById('editApprovalSite').value);
    const site = sites.find(s => s.id === siteId);
    
    if (!site) {
        alert('현장을 선택해주세요.');
        return;
    }
    
    // 결재 정보 업데이트
    approval.title = document.getElementById('editApprovalTitle').value;
    approval.content = document.getElementById('editApprovalContent').value;
    approval.siteId = siteId;
    approval.siteName = site.name;
    approval.author = document.getElementById('editApprovalAuthor').value;
    
    // 상태 초기화 (반려된 결재인 경우에만)
    if (approval.status === 'rejected') {
        approval.status = 'pending';
        approval.currentStep = 0;
        approval.totalSteps = site.steps;
        approval.approvers = [...site.approvers];
        approval.approvals = Array(site.steps).fill(null);
        
        // 반려 정보 제거
        approval.rejectedAt = null;
        approval.rejectionReason = null;
    }
    // pending/processing 상태인 경우에는 상태는 유지하되, 단계 정보만 업데이트
    else if (approval.status === 'pending' || approval.status === 'processing') {
        // 현장이 변경된 경우에만 단계 정보 업데이트
        if (approval.siteId !== siteId) {
            approval.totalSteps = site.steps;
            approval.approvers = [...site.approvers];
            // 현재 단계가 새로운 총 단계보다 크면 조정
            if (approval.currentStep >= site.steps) {
                approval.currentStep = site.steps - 1;
            }
            // approvals 배열 크기 조정
            if (approval.approvals.length !== site.steps) {
                const newApprovals = Array(site.steps).fill(null);
                for (let i = 0; i < Math.min(approval.approvals.length, site.steps); i++) {
                    newApprovals[i] = approval.approvals[i];
                }
                approval.approvals = newApprovals;
            }
        }
    }
    
    // 수정일 추가
    approval.updatedAt = new Date().toISOString();
    approval.originalCreatedAt = approval.createdAt; // 원본 작성일 보존
    
    // 첨부 파일 처리
    const attachmentInput = document.getElementById('editApprovalAttachment');
    if (attachmentInput.files && attachmentInput.files.length > 0) {
        const file = attachmentInput.files[0];
        approval.attachmentFileName = file.name;
        
        // 파일을 base64로 변환
        const reader = new FileReader();
        reader.onload = async function(e) {
            approval.attachmentData = e.target.result;
            
            // 결재 업데이트 저장
            if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
                await updateApprovalInStorage(approvalId, {
                    title: approval.title,
                    content: approval.content,
                    siteId: approval.siteId,
                    siteName: approval.siteName,
                    author: approval.author,
                    attachmentFileName: approval.attachmentFileName,
                    attachmentData: approval.attachmentData,
                    status: approval.status,
                    currentStep: approval.currentStep,
                    totalSteps: approval.totalSteps,
                    approvers: approval.approvers,
                    approvals: approval.approvals,
                    rejectedAt: approval.rejectedAt,
                    rejectionReason: approval.rejectionReason,
                    updatedAt: approval.updatedAt,
                    originalCreatedAt: approval.originalCreatedAt
                });
                await syncData();
            } else {
                localStorage.setItem('approvals', JSON.stringify(approvals));
            }
            
            closeEditApprovalModal();
            alert('결재가 수정되어 다시 제출되었습니다.');
            showSection('approvals', null);
            loadApprovals();
            loadPendingApprovals();
            updateDashboard();
            
            // 승인 대기 알림 생성
            notifyPendingApproval(approval);
        };
        reader.onerror = function() {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsDataURL(file);
    } else {
        // 첨부 파일이 없으면 기존 파일 유지 (제거 버튼을 눌렀을 경우 처리)
        const attachmentInfo = document.getElementById('editAttachmentInfo');
        if (!attachmentInfo.querySelector('div')) {
            // 첨부 파일이 제거된 경우
            approval.attachmentFileName = null;
            approval.attachmentData = null;
        }
        
        // 결재 업데이트 저장
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            (async () => {
                await updateApprovalInStorage(approvalId, {
                    title: approval.title,
                    content: approval.content,
                    siteId: approval.siteId,
                    siteName: approval.siteName,
                    author: approval.author,
                    attachmentFileName: approval.attachmentFileName,
                    attachmentData: approval.attachmentData,
                    status: approval.status,
                    currentStep: approval.currentStep,
                    totalSteps: approval.totalSteps,
                    approvers: approval.approvers,
                    approvals: approval.approvals,
                    rejectedAt: approval.rejectedAt,
                    rejectionReason: approval.rejectionReason,
                    updatedAt: approval.updatedAt,
                    originalCreatedAt: approval.originalCreatedAt
                });
                await syncData();
                closeEditApprovalModal();
                alert('결재가 수정되어 다시 제출되었습니다.');
                showSection('approvals', null);
                loadApprovals();
                loadPendingApprovals();
                updateDashboard();
                notifyPendingApproval(approval);
            })();
        } else {
            localStorage.setItem('approvals', JSON.stringify(approvals));
            closeEditApprovalModal();
            alert('결재가 수정되어 다시 제출되었습니다.');
            showSection('approvals', null);
            loadApprovals();
            loadPendingApprovals();
            updateDashboard();
            notifyPendingApproval(approval);
        }
    }
}

// 수정 모달에서 첨부 파일 제거
function clearEditAttachment() {
    const attachmentInfo = document.getElementById('editAttachmentInfo');
    attachmentInfo.innerHTML = '';
    
    // 파일 입력 초기화
    const attachmentInput = document.getElementById('editApprovalAttachment');
    if (attachmentInput) {
        attachmentInput.value = '';
    }
}

