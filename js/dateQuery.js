// 날짜별 결재 조회 기능

let currentCalendarDate = new Date();

// 달력 초기화
function initCalendar() {
    renderCalendar();
}

// 달력 렌더링
function renderCalendar() {
    const monthYearEl = document.getElementById('calendarMonthYear');
    const daysEl = document.getElementById('calendarDays');
    
    if (!monthYearEl || !daysEl) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // 월/년도 표시
    monthYearEl.textContent = `${year}년 ${month + 1}월`;
    
    // 해당 월의 첫 번째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    daysEl.innerHTML = '';
    
    // 이전 달의 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = day;
        daysEl.appendChild(dayEl);
    }
    
    // 현재 달의 날짜들
    const today = new Date();
    const selectedDate = document.getElementById('dateQueryInput')?.value;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month, day);
        
        // 오늘인지 확인
        if (dateObj.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }
        
        // 선택된 날짜인지 확인
        if (selectedDate === dateStr) {
            dayEl.classList.add('selected');
        }
        
        // 해당 날짜에 결재가 있는지 확인
        const hasApproval = approvals.some(approval => {
            const approvalDate = new Date(approval.createdAt);
            return approvalDate.toDateString() === dateObj.toDateString();
        });
        
        if (hasApproval) {
            dayEl.classList.add('has-approval');
        }
        
        dayEl.textContent = day;
        dayEl.onclick = () => selectDate(dateStr);
        daysEl.appendChild(dayEl);
    }
    
    // 다음 달의 날짜들 (달력을 채우기 위해)
    const totalCells = daysEl.children.length;
    const remainingCells = 42 - totalCells; // 6주 * 7일 = 42
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = day;
        daysEl.appendChild(dayEl);
    }
}

// 월 변경
function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

// 날짜 선택
function selectDate(dateStr) {
    const dateInput = document.getElementById('dateQueryInput');
    if (dateInput) {
        dateInput.value = dateStr;
        loadApprovalsByDate();
        renderCalendar(); // 선택된 날짜 표시 업데이트
    }
}

// 날짜별 결재 목록 로드
function loadApprovalsByDate() {
    const dateInput = document.getElementById('dateQueryInput');
    const tbody = document.getElementById('dateQueryTableBody');
    const infoDiv = document.getElementById('dateQueryInfo');
    
    if (!dateInput || !tbody) return;
    
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="text-align: center; padding: 40px; color: #999;">날짜를 선택해주세요.</td></tr>';
        infoDiv.textContent = '';
        return;
    }
    
    // 선택한 날짜의 시작일과 종료일 계산
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);
    
    // 해당 날짜의 결재 필터링
    let filteredApprovals = approvals.filter(approval => {
        const approvalDate = new Date(approval.createdAt);
        return approvalDate >= startDate && approvalDate <= endDate;
    });
    
    // 현장은 자신이 작성한 결재만 보기
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
        const user = approvedUsers.find(u => u.username === currentUser.username);
        const userName = user ? user.name : null;
        
        filteredApprovals = filteredApprovals.filter(approval => {
            return approval.author === currentUser.username || 
                   (userName && approval.author === userName);
        });
    }
    
    // 날짜 정보 표시
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    infoDiv.textContent = `${dateStr} - 총 ${filteredApprovals.length}건의 결재`;
    
    // 달력 업데이트 (선택된 날짜 표시)
    renderCalendar();
    
    // 테이블 업데이트
    if (filteredApprovals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="text-align: center; padding: 40px; color: #999;">해당 날짜의 결재가 없습니다.</td></tr>';
    } else {
        tbody.innerHTML = filteredApprovals.map(approval => {
            const approvalNumber = approval.approvalNumber || approval.id;
            const canApprove = canUserApprove(approval);
            const showActions = (approval.status === 'pending' || approval.status === 'processing') && canApprove;
            const canCancel = canCancelApproval(approval);
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
                        ${canCancel ? 
                            `<button class="btn btn-warning" onclick="cancelApproval(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px; background: #ffc107; color: #000;">승인 취소</button>` : ''}
                        ${canCancelRejection ? 
                            `<button class="btn btn-success" onclick="cancelRejection(${approval.id})" style="padding: 5px 10px; font-size: 14px; margin-left: 5px;">반려 취소</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// 오늘 날짜의 결재 로드
function loadTodayApprovals() {
    const dateInput = document.getElementById('dateQueryInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        currentCalendarDate = new Date(); // 달력도 오늘로 이동
        loadApprovalsByDate();
        renderCalendar();
    }
}

// 날짜 조회 초기화
function clearDateQuery() {
    const dateInput = document.getElementById('dateQueryInput');
    const tbody = document.getElementById('dateQueryTableBody');
    const infoDiv = document.getElementById('dateQueryInfo');
    
    if (dateInput) {
        dateInput.value = '';
    }
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="text-align: center; padding: 40px; color: #999;">날짜를 선택하면 해당 날짜의 결재 목록이 표시됩니다.</td></tr>';
    }
    if (infoDiv) {
        infoDiv.textContent = '';
    }
    renderCalendar(); // 선택 해제 표시
}

