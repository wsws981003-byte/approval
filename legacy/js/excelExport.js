// Excel 내보내기 기능

// 결재 목록을 Excel로 내보내기
function exportToExcel() {
    // 고급 검색이 활성화되어 있으면 고급 검색 결과 사용
    let filteredApprovals;
    if (typeof advancedSearchActive !== 'undefined' && advancedSearchActive && 
        typeof advancedSearchResults !== 'undefined' && advancedSearchResults.length > 0) {
        filteredApprovals = advancedSearchResults;
    } else {
        // 현재 필터링된 결재 목록 가져오기
        filteredApprovals = getFilteredApprovals();
    }
    
    if (filteredApprovals.length === 0) {
        alert('내보낼 결재 데이터가 없습니다.');
        return;
    }
    
    // Excel 데이터 준비
    const excelData = filteredApprovals.map(approval => {
        const approvalDate = new Date(approval.createdAt);
        const formattedDate = approvalDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return {
            '결재번호': approval.approvalNumber || approval.id,
            '제목': approval.title,
            '현장': approval.siteName || '미지정',
            '작성자': approval.author,
            '상태': getStatusText(approval.status),
            '작성일': formattedDate,
            '현재단계': approval.status === 'processing' || approval.status === 'pending' 
                ? `${approval.currentStep + 1}/${approval.totalSteps}` 
                : approval.status === 'approved' ? '완료' : '-',
            '내용': approval.content ? approval.content.substring(0, 100) + (approval.content.length > 100 ? '...' : '') : '',
            '첨부파일': approval.attachmentFileName || '-'
        };
    });
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // 열 너비 설정
    const colWidths = [
        { wch: 15 }, // 결재번호
        { wch: 30 }, // 제목
        { wch: 15 }, // 현장
        { wch: 12 }, // 작성자
        { wch: 12 }, // 상태
        { wch: 20 }, // 작성일
        { wch: 12 }, // 현재단계
        { wch: 50 }, // 내용
        { wch: 20 }  // 첨부파일
    ];
    ws['!cols'] = colWidths;
    
    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, '결재목록');
    
    // 파일명 생성 (현재 날짜 포함)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `결재목록_${dateStr}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(wb, fileName);
    
    alert(`${filteredApprovals.length}건의 결재 데이터가 Excel 파일로 내보내졌습니다.`);
}

// 대시보드 통계를 Excel로 내보내기
function exportDashboardStats() {
    if (!currentUser) return;
    
    // 사용자별 결재 데이터 필터링
    let userApprovals = approvals;
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
        userApprovals = approvals.filter(a => a.author === currentUser.username);
    }
    
    // 통계 데이터 준비
    const statsData = [
        { '항목': '전체 결재', '건수': userApprovals.length },
        { '항목': '대기 중', '건수': userApprovals.filter(a => a.status === 'pending').length },
        { '항목': '진행 중', '건수': userApprovals.filter(a => a.status === 'processing').length },
        { '항목': '승인 완료', '건수': userApprovals.filter(a => a.status === 'approved').length },
        { '항목': '반려', '건수': userApprovals.filter(a => a.status === 'rejected').length }
    ];
    
    // 월별 통계
    const monthlyStats = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
        
        const monthApprovals = userApprovals.filter(a => {
            const approvalDate = new Date(a.createdAt);
            return approvalDate.getFullYear() === date.getFullYear() &&
                   approvalDate.getMonth() === date.getMonth();
        });
        
        monthlyStats.push({
            '월': monthStr,
            '결재수': monthApprovals.length
        });
    }
    
    // 현장별 통계
    const siteStats = [];
    const siteCounts = {};
    userApprovals.forEach(approval => {
        const siteName = approval.siteName || '미지정';
        siteCounts[siteName] = (siteCounts[siteName] || 0) + 1;
    });
    
    Object.keys(siteCounts).forEach(siteName => {
        siteStats.push({
            '현장명': siteName,
            '결재수': siteCounts[siteName]
        });
    });
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 전체 통계 시트
    const ws1 = XLSX.utils.json_to_sheet(statsData);
    ws1['!cols'] = [{ wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws1, '전체통계');
    
    // 월별 통계 시트
    const ws2 = XLSX.utils.json_to_sheet(monthlyStats);
    ws2['!cols'] = [{ wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, '월별통계');
    
    // 현장별 통계 시트
    const ws3 = XLSX.utils.json_to_sheet(siteStats);
    ws3['!cols'] = [{ wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws3, '현장별통계');
    
    // 파일명 생성
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `결재통계_${dateStr}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(wb, fileName);
    
    alert('대시보드 통계가 Excel 파일로 내보내졌습니다.');
}

