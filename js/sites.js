// 현장 관리 함수

async function loadSites() {
    const tbody = document.getElementById('sitesTableBody');
    if (!tbody) return;
    
    // DataService를 통해 최신 데이터 로드 (Supabase 또는 localStorage)
    if (typeof dataService !== 'undefined') {
        sites = await dataService.getSites();
    } else {
        sites = JSON.parse(localStorage.getItem('sites')) || [];
    }
    
    if (sites.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">등록된 현장이 없습니다.</td></tr>';
        return;
    }
    
    const canDelete = hasPermission('manage_sites');
    tbody.innerHTML = sites.map((site, index) => `
        <tr>
            <td>${site.name}</td>
            <td>${site.location}</td>
            <td>${site.manager}</td>
            <td>${site.steps}단계</td>
            <td>
                ${canDelete ? `<button class="btn btn-danger" onclick="deleteSite(${site.id})" style="padding: 5px 10px; font-size: 14px;">삭제</button>` : '<span style="color: #999;">-</span>'}
            </td>
        </tr>
    `).join('');
}

function showAddSiteModal() {
    console.log('showAddSiteModal 함수 호출됨');
    const modal = document.getElementById('siteModal');
    console.log('모달 요소:', modal);
    if (modal) {
        // 모달 강제 표시
        modal.style.display = 'flex';
        modal.classList.add('active');
        console.log('모달 active 클래스 추가됨, 현재 클래스:', modal.className);
        
        // 모달이 실제로 표시되는지 확인
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(modal);
            console.log('모달 display:', computedStyle.display);
            console.log('모달 visibility:', computedStyle.visibility);
            console.log('모달 z-index:', computedStyle.zIndex);
            
            if (computedStyle.display === 'none') {
                console.error('모달이 표시되지 않습니다. 강제로 표시합니다.');
                modal.style.display = 'flex';
                modal.style.zIndex = '10000';
            }
        }, 50);
    } else {
        console.error('siteModal element not found');
        alert('모달을 찾을 수 없습니다. 페이지를 새로고침해주세요.');
    }
}

function closeSiteModal() {
    const modal = document.getElementById('siteModal');
    modal.classList.remove('active');
    modal.style.display = '';  // 인라인 스타일 제거
    modal.querySelector('form').reset();
}

async function addSite(event) {
    event.preventDefault();
    
    // 모든 사용자가 현장 추가 가능 (권한 체크 제거)
    
    const steps = parseInt(document.getElementById('siteSteps').value);
    
    if (steps < 1 || steps > 10) {
        alert('결재 단계 수는 1~10 사이여야 합니다.');
        return;
    }

    // 결재 단계 수만큼 빈 결재자 배열 생성 (나중에 설정 가능)
    const approvers = Array(steps).fill('');

    const site = {
        id: Date.now(),
        name: document.getElementById('siteName').value,
        location: document.getElementById('siteLocation').value,
        manager: document.getElementById('siteManager').value,
        steps: steps,
        approvers: approvers
    };

    // 전역 sites 배열 업데이트
    if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
        (async () => {
            const saved = await dataService.saveSite(site);
            if (saved) {
                await syncData(); // 데이터 동기화
                await loadSites();
                await updateApprovalSites();
                updateSiteFilter();
                closeSiteModal();
                alert('현장이 추가되었습니다.');
            }
        })();
        return;
    } else {
        sites.push(site);
        localStorage.setItem('sites', JSON.stringify(sites));
    }
    
    console.log('Site added:', site);
    console.log('Total sites:', sites.length);
    
    // 현장 목록 업데이트
    loadSites();
    
    // 결재 작성 섹션이 활성화되어 있으면 새로 추가된 현장 자동 선택
    const newApprovalSection = document.getElementById('new-approval');
    const isApprovalSectionActive = newApprovalSection && newApprovalSection.classList.contains('active');
    
    // 드롭다운 업데이트 (새 현장이 포함되도록)
    await updateApprovalSites();
    
    // 새로 추가된 현장 자동 선택
    if (isApprovalSectionActive) {
        // 약간의 지연을 두어 DOM 업데이트가 완료된 후 선택
        setTimeout(() => {
            const approvalSiteSelect = document.getElementById('approvalSite');
            if (approvalSiteSelect) {
                approvalSiteSelect.value = site.id;
                console.log('Auto-selected site:', site.id, site.name);
            }
        }, 100);
    }
    
    updateSiteFilter();
    closeSiteModal();
    
    alert('현장이 추가되었습니다.');
}

async function deleteSite(siteId) {
    if (!hasPermission('manage_sites')) {
        alert('현장 삭제 권한이 없습니다.');
        return;
    }
    
    const site = sites.find(s => s.id === siteId);
    if (!site) {
        alert('현장을 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`"${site.name}" 현장을 정말 삭제하시겠습니까?`)) {
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            await dataService.deleteSite(siteId);
            await syncData();
        } else {
            sites = sites.filter(s => s.id !== siteId);
            localStorage.setItem('sites', JSON.stringify(sites));
        }
        
        await loadSites();
        await updateApprovalSites();
        updateSiteFilter();
        alert('현장이 삭제되었습니다.');
    }
}

// 현장 추가 옵션 선택 핸들러 (전역으로 한 번만 등록)
let approvalSiteChangeHandler = null;

async function updateApprovalSites() {
    try {
        const select = document.getElementById('approvalSite');
        if (!select) {
            console.error('approvalSite 요소를 찾을 수 없습니다.');
            return;
        }
        
        console.log('updateApprovalSites 호출됨');
        
        // 최신 데이터 로드 (Supabase 또는 localStorage)
        let loadedSites = [];
        if (typeof dataService !== 'undefined' && dataService.storageType === 'supabase') {
            console.log('Supabase에서 현장 데이터 로드 중...');
            loadedSites = await dataService.getSites();
            console.log('로드된 현장 개수:', loadedSites.length);
        } else {
            console.log('localStorage에서 현장 데이터 로드 중...');
            loadedSites = JSON.parse(localStorage.getItem('sites')) || [];
            console.log('로드된 현장 개수:', loadedSites.length);
        }
        
        // 전역 sites 변수 업데이트
        if (typeof sites !== 'undefined') {
            sites = loadedSites;
        } else {
            console.warn('전역 sites 변수가 정의되지 않았습니다.');
            sites = loadedSites;
        }
    
    // 현재 선택된 값 저장
    const currentValue = select.value;
    
    // 모든 사용자가 모든 현장을 선택 가능
    let availableSites = sites || [];
    console.log('사용 가능한 현장 개수:', availableSites.length);
    
    // 기존 이벤트 리스너 제거 (이전 핸들러가 있으면)
    if (approvalSiteChangeHandler) {
        try {
            select.removeEventListener('change', approvalSiteChangeHandler);
        } catch (e) {
            console.log('기존 이벤트 리스너 제거 실패 (무시):', e);
        }
    }
    
    // 드롭다운 옵션 업데이트
    select.innerHTML = '';
    
    // 현장 목록 추가
    if (availableSites.length > 0) {
        availableSites.forEach(site => {
            const option = document.createElement('option');
            option.value = site.id;
            option.textContent = site.name;
            select.appendChild(option);
        });
        console.log('현장 옵션 추가 완료:', availableSites.length, '개');
    } else {
        // 현장이 없으면 안내 옵션 추가
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '현장이 없습니다. 새 현장을 추가하세요.';
        select.appendChild(emptyOption);
        console.log('현장이 없습니다.');
    }
    
    // 기존 선택값 복원
    if (currentValue) {
        const option = select.querySelector(`option[value="${currentValue}"]`);
        if (option) {
            select.value = currentValue;
        }
    }
    
    console.log('현장 드롭다운 업데이트 완료, 총 옵션 개수:', select.options.length);
    
    // 작성자 이름 자동 입력 (수정 가능)
    // 항상 현재 사용자의 이름으로 설정 (사용자가 수정 가능)
    if (currentUser) {
        const authorInput = document.getElementById('approvalAuthor');
        if (authorInput) {
            // approvedUsers에서 현재 사용자의 이름 찾기
            const user = approvedUsers.find(u => u.username === currentUser.username);
            if (user && user.name) {
                // 이름이 있으면 이름 사용, 없으면 ID 사용
                authorInput.value = user.name;
            } else {
                // 이름이 없으면 ID 사용
                authorInput.value = currentUser.username;
            }
        }
    }
    } catch (error) {
        console.error('updateApprovalSites 오류:', error);
    }
}

function updateSiteFilter() {
    const select = document.getElementById('siteFilter');
    const currentValue = select.value;
    select.innerHTML = '<option value="">전체 현장</option>' +
        sites.map(site => `<option value="${site.id}">${site.name}</option>`).join('');
    select.value = currentValue;
}

