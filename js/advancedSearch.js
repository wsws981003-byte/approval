// 고급 검색 기능

let advancedSearchActive = false;
let advancedSearchResults = [];

// 고급 검색 모달 열기
function showAdvancedSearchModal() {
    const modal = document.getElementById('advancedSearchModal');
    if (!modal) return;
    
    // 현장 목록 업데이트
    updateAdvancedSearchSites();
    
    modal.classList.add('active');
}

// 고급 검색 모달 닫기
function closeAdvancedSearchModal() {
    const modal = document.getElementById('advancedSearchModal');
    if (!modal) return;
    
    modal.classList.remove('active');
}

// 고급 검색 현장 목록 업데이트
function updateAdvancedSearchSites() {
    const siteSelect = document.getElementById('advancedSearchSite');
    if (!siteSelect) return;
    
    // 기존 옵션 제거 (전체 현장 제외)
    while (siteSelect.children.length > 1) {
        siteSelect.removeChild(siteSelect.lastChild);
    }
    
    // 현장 목록 추가
    sites.forEach(site => {
        const option = document.createElement('option');
        option.value = site.id;
        option.textContent = site.name;
        siteSelect.appendChild(option);
    });
}

// 고급 검색 수행
function performAdvancedSearch(event) {
    event.preventDefault();
    
    const keyword = document.getElementById('advancedSearchKeyword').value.trim().toLowerCase();
    const author = document.getElementById('advancedSearchAuthor').value.trim().toLowerCase();
    const siteId = document.getElementById('advancedSearchSite').value;
    const status = document.getElementById('advancedSearchStatus').value;
    const startDate = document.getElementById('advancedSearchStartDate').value;
    const endDate = document.getElementById('advancedSearchEndDate').value;
    
    // 검색 조건이 하나도 없으면 경고
    if (!keyword && !author && !siteId && !status && !startDate && !endDate) {
        alert('최소 하나 이상의 검색 조건을 입력해주세요.');
        return;
    }
    
    // 검색 시작
    let filtered = approvals;
    
    // 키워드 검색 (제목, 내용)
    if (keyword) {
        filtered = filtered.filter(approval => {
            const titleMatch = approval.title.toLowerCase().includes(keyword);
            const contentMatch = approval.content && approval.content.toLowerCase().includes(keyword);
            return titleMatch || contentMatch;
        });
    }
    
    // 작성자 검색
    if (author) {
        filtered = filtered.filter(approval => {
            const authorName = approval.author.toLowerCase();
            return authorName.includes(author);
        });
    }
    
    // 현장 검색
    if (siteId) {
        filtered = filtered.filter(approval => approval.siteId === parseInt(siteId));
    }
    
    // 상태 검색
    if (status) {
        filtered = filtered.filter(approval => approval.status === status);
    }
    
    // 기간 검색
    if (startDate || endDate) {
        filtered = filtered.filter(approval => {
            const approvalDate = new Date(approval.createdAt);
            approvalDate.setHours(0, 0, 0, 0);
            
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return approvalDate >= start && approvalDate <= end;
            } else if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                return approvalDate >= start;
            } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return approvalDate <= end;
            }
            return true;
        });
    }
    
    // 현장은 자신이 작성한 결재만 보기
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        filtered = filtered.filter(approval => 
            approval.author === currentUser.username
        );
    }
    
    // 검색 결과 저장
    advancedSearchResults = filtered;
    advancedSearchActive = true;
    
    // 검색 해제 버튼 표시
    const clearBtn = document.getElementById('clearAdvancedSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = 'inline-block';
    }
    
    // 검색 결과 정보 표시
    const resultInfo = document.getElementById('searchResultInfo');
    const resultCount = document.getElementById('searchResultCount');
    if (resultInfo && resultCount) {
        resultInfo.style.display = 'block';
        resultCount.textContent = `${filtered.length}건`;
    }
    
    // 모달 닫기
    closeAdvancedSearchModal();
    
    // 검색 결과 표시
    displayAdvancedSearchResults();
    
    // 결재 목록 섹션으로 이동
    showSection('approvals', null);
}

// 고급 검색 결과 표시
function displayAdvancedSearchResults() {
    const tbody = document.getElementById('approvalsTableBody');
    if (!tbody) return;
    
    if (advancedSearchResults.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">검색 결과가 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = advancedSearchResults.map(approval => {
        const canApprove = canUserApprove(approval);
        const showActions = (approval.status === 'pending' || approval.status === 'processing') && canApprove;
        const approvalNumber = approval.approvalNumber || approval.id;
        const canCancelRejection = approval.status === 'rejected' && 
                                    currentUser && 
                                    (currentUser.role === 'ceo' || currentUser.role === 'headquarters');
        
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
            </td>
        </tr>
    `;
    }).join('');
}

// 고급 검색 초기화
function resetAdvancedSearch() {
    document.getElementById('advancedSearchKeyword').value = '';
    document.getElementById('advancedSearchAuthor').value = '';
    document.getElementById('advancedSearchSite').value = '';
    document.getElementById('advancedSearchStatus').value = '';
    document.getElementById('advancedSearchStartDate').value = '';
    document.getElementById('advancedSearchEndDate').value = '';
}

// 고급 검색 해제 (일반 필터로 돌아가기)
function clearAdvancedSearch() {
    advancedSearchActive = false;
    advancedSearchResults = [];
    
    // 검색 해제 버튼 숨기기
    const clearBtn = document.getElementById('clearAdvancedSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // 검색 결과 정보 숨기기
    const resultInfo = document.getElementById('searchResultInfo');
    if (resultInfo) {
        resultInfo.style.display = 'none';
    }
    
    // 검색 폼 초기화
    resetAdvancedSearch();
    
    // 일반 필터로 다시 로드
    if (typeof filterApprovals === 'function') {
        filterApprovals();
    } else if (typeof loadApprovals === 'function') {
        loadApprovals();
    }
}

