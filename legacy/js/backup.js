// 백업/복원 기능

let backupData = null;

// 백업 연도/월 선택 초기화
function initBackupSelectors() {
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('backupYear');
    const monthSelect = document.getElementById('backupMonth');
    
    if (yearSelect) {
        // 최근 5년 생성
        yearSelect.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const year = currentYear - i;
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}년`;
            if (i === 0) option.selected = true;
            yearSelect.appendChild(option);
        }
    }
    
    if (monthSelect) {
        // 현재 월을 기본값으로 설정
        const currentMonth = new Date().getMonth() + 1;
        monthSelect.value = currentMonth;
    }
}

// 백업 파일 업로드 및 읽기
function handleBackupFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        alert('JSON 파일만 업로드 가능합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 백업 파일 형식 검증
            if (!data.approvals) {
                alert('올바른 백업 파일 형식이 아닙니다. (결재 데이터가 없습니다)');
                return;
            }
            
            // 월별 백업인 경우 backupPeriod 필요
            if (data.backupType === 'monthly' && !data.backupPeriod) {
                alert('올바른 백업 파일 형식이 아닙니다. (백업 기간 정보가 없습니다)');
                return;
            }

            backupData = data;
            showBackupViewer();
            alert('백업 파일이 로드되었습니다.');
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// 백업 뷰어 표시
function showBackupViewer() {
    if (!backupData) return;

    // 백업 메타데이터 표시
    let periodInfo = '';
    if (backupData.backupPeriod) {
        periodInfo = `<p><strong>백업 기간:</strong> ${backupData.backupPeriod.year}년 ${backupData.backupPeriod.month}월</p>`;
    } else if (backupData.backupType === 'full') {
        periodInfo = '<p><strong>백업 유형:</strong> 전체 백업</p>';
    }
    
    const metaInfo = `
        <div style="padding: 15px; background: #e7f3ff; border-radius: 8px; margin-bottom: 20px;">
            <h3>백업 정보</h3>
            <p><strong>백업 날짜:</strong> ${formatDate(backupData.backupDate)}</p>
            ${periodInfo}
            <p><strong>백업 소스:</strong> ${backupData.storageType || 'localStorage'}</p>
            <p><strong>결재 건수:</strong> ${backupData.dataCount.approvals}건</p>
            ${backupData.dataCount.sites ? `<p><strong>현장 수:</strong> ${backupData.dataCount.sites}개</p>` : ''}
            ${backupData.dataCount.approvedUsers ? `<p><strong>사용자 수:</strong> ${backupData.dataCount.approvedUsers}명</p>` : ''}
        </div>
    `;

    // 백업된 결재 목록 표시
    const tbody = document.getElementById('backupTableBody');
    const container = document.getElementById('backupTableContainer');
    
    if (backupData.approvals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">백업된 결재가 없습니다.</td></tr>';
    } else {
        tbody.innerHTML = backupData.approvals.map(approval => {
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
                        <button class="btn btn-primary" onclick="viewBackupApprovalDetail(${approval.id})" style="padding: 5px 10px; font-size: 14px;">상세</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    document.getElementById('backupMetaInfo').innerHTML = metaInfo;
    if (container) {
        container.style.display = 'block';
    }
}

// 백업된 결재 상세 보기
function viewBackupApprovalDetail(approvalId) {
    const approval = backupData.approvals.find(a => a.id === parseInt(approvalId));
    if (!approval) return;

    const approvalNumber = approval.approvalNumber || approval.id;
    document.getElementById('detailTitle').textContent = approval.title;
    
    let html = `
        <div style="margin-bottom: 20px; padding: 10px; background: #fff3cd; border-radius: 8px;">
            <strong>⚠️ 백업 데이터</strong> - 이 결재는 백업 파일에서 불러온 데이터입니다.
        </div>
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

    if (approval.attachment) {
        html += `<div style="margin-bottom: 20px;"><strong>첨부:</strong> <a href="${approval.attachment}" target="_blank">${approval.attachment}</a></div>`;
    }

    // 결재 라인 표시
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
                <strong>${i + 1}단계: ${approval.approvers[i]}</strong>
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

// 월별 백업 생성 (UI에서 호출)
async function createMonthlyBackup() {
    if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters' && currentUser.role !== 'admin_dept' && currentUser.role !== 'other')) {
        alert('백업 권한이 없습니다.');
        return;
    }

    const year = parseInt(document.getElementById('backupYear').value);
    const month = parseInt(document.getElementById('backupMonth').value);

    if (!year || !month) {
        alert('연도와 월을 선택해주세요.');
        return;
    }

    await backupMonthlyData(year, month);
}

// 전체 백업 생성
async function createFullBackup() {
    if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters' && currentUser.role !== 'admin_dept' && currentUser.role !== 'other')) {
        alert('백업 권한이 없습니다.');
        return;
    }

    try {
        // 데이터 서비스를 통해 데이터 가져오기 (localStorage 또는 Supabase)
        const [approvalsData, sitesData, approvedUsersData] = await Promise.all([
            dataService.getApprovals(),
            dataService.getSites(),
            dataService.getApprovedUsers()
        ]);

        if (approvalsData.length === 0) {
            alert('백업할 결재 데이터가 없습니다.');
            return;
        }

        // 전체 백업 데이터 구성
        const backupData = {
            backupDate: new Date().toISOString(),
            backupType: 'full',
            storageType: dataService.storageType, // 백업 소스 정보
            dataCount: {
                approvals: approvalsData.length,
                sites: sitesData.length,
                approvedUsers: approvedUsersData.length
            },
            approvals: approvalsData,
            sites: sitesData,
            approvedUsers: approvedUsersData
        };

        // JSON 파일로 다운로드
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
        link.download = `backup_full_${dateStr}.json`;
        link.click();
        URL.revokeObjectURL(url);

        alert(`전체 데이터 백업이 완료되었습니다.\n백업된 결재: ${approvalsData.length}건\n백업된 현장: ${sitesData.length}개\n백업된 사용자: ${approvedUsersData.length}명`);
    } catch (error) {
        console.error('백업 생성 오류:', error);
        alert('백업 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 월별 백업 생성 (내부 함수)
async function backupMonthlyData(year, month) {
    if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters' && currentUser.role !== 'admin_dept' && currentUser.role !== 'other')) {
        alert('백업 권한이 없습니다.');
        return;
    }

    try {
        // 해당 월의 시작일과 종료일 계산
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        // 데이터 서비스를 통해 월별 결재 데이터 가져오기
        const monthlyApprovals = await dataService.getMonthlyApprovals(year, month);
        
        // 현장과 사용자 정보도 가져오기 (전체 포함)
        const [sitesData, approvedUsersData] = await Promise.all([
            dataService.getSites(),
            dataService.getApprovedUsers()
        ]);

        if (monthlyApprovals.length === 0) {
            alert('해당 월의 데이터가 없습니다.');
            return;
        }

        // 백업 데이터 구성
        const backupData = {
            backupDate: new Date().toISOString(),
            backupType: 'monthly',
            storageType: dataService.storageType, // 백업 소스 정보
            backupPeriod: {
                year: year,
                month: month,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            dataCount: {
                approvals: monthlyApprovals.length,
                sites: sitesData.length,
                approvedUsers: approvedUsersData.length
            },
            approvals: monthlyApprovals,
            sites: sitesData, // 현장 정보는 전체 포함
            approvedUsers: approvedUsersData // 사용자 정보는 전체 포함
        };

        // JSON 파일로 다운로드
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${year}_${String(month).padStart(2, '0')}.json`;
        link.click();
        URL.revokeObjectURL(url);

        alert(`${year}년 ${month}월 데이터 백업이 완료되었습니다.\n백업된 결재: ${monthlyApprovals.length}건`);
    } catch (error) {
        console.error('월별 백업 생성 오류:', error);
        alert('백업 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

