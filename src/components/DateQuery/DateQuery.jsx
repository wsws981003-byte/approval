import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import ApprovalDetailModal from '../Approvals/ApprovalDetailModal'
import ApprovalActions from '../Approvals/ApprovalActions'

export default function DateQuery() {
  const { approvals, currentUser, approvedUsers, syncData } = useApp()
  const [selectedDate, setSelectedDate] = useState('')
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())
  const [selectedApproval, setSelectedApproval] = useState(null)

  useEffect(() => {
    syncData()
  }, [])

  // 날짜별 결재 필터링
  const getFilteredApprovals = () => {
    if (!selectedDate) return []

    const startDate = new Date(selectedDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(selectedDate)
    endDate.setHours(23, 59, 59, 999)

    let filtered = approvals.filter(approval => {
      const approvalDate = new Date(approval.createdAt)
      return approvalDate >= startDate && approvalDate <= endDate
    })

    // 현장은 자신이 작성한 결재만 보기
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const userName = user ? user.name : null
      
      filtered = filtered.filter(approval => {
        return approval.author === currentUser.username || 
               (userName && approval.author === userName)
      })
    }

    return filtered
  }

  const filteredApprovals = getFilteredApprovals()

  // 달력 렌더링
  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear()
    const month = currentCalendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    const today = new Date()

    const days = []

    // 이전 달의 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      days.push({ day, isOtherMonth: true })
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dateObj = new Date(year, month, day)
      const isToday = dateObj.toDateString() === today.toDateString()
      const isSelected = selectedDate === dateStr
      
      // 해당 날짜에 결재가 있는지 확인
      const hasApproval = approvals.some(approval => {
        const approvalDate = new Date(approval.createdAt)
        return approvalDate.toDateString() === dateObj.toDateString()
      })

      days.push({ day, dateStr, isToday, isSelected, hasApproval })
    }

    // 다음 달의 날짜들 (달력을 채우기 위해)
    const remainingCells = 42 - days.length
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ day, isOtherMonth: true })
    }

    return days
  }

  const calendarDays = renderCalendar()

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  const handleDateClick = (dateStr) => {
    if (dateStr) {
      setSelectedDate(dateStr)
    }
  }

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    setCurrentCalendarDate(new Date())
  }

  const handleClear = () => {
    setSelectedDate('')
  }

  const changeMonth = (direction) => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const dateInfo = selectedDate ? (() => {
    const dateObj = new Date(selectedDate)
    return dateObj.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  })() : ''

  return (
    <div>
      <h2>날짜별 결재 조회</h2>
      <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
          {/* 커스텀 달력 */}
          <div style={{ flex: 1, minWidth: '280px', maxWidth: '100%', width: '100%' }} className="calendar-wrapper">
            <div className="custom-calendar">
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
                <h3 id="calendarMonthYear">
                  {currentCalendarDate.getFullYear()}년 {currentCalendarDate.getMonth() + 1}월
                </h3>
                <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>›</button>
              </div>
              <div className="calendar-weekdays">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              <div className="calendar-days">
                {calendarDays.map((item, idx) => (
                  <div
                    key={idx}
                    className={`calendar-day ${item.isOtherMonth ? 'other-month' : ''} ${item.isToday ? 'today' : ''} ${item.isSelected ? 'selected' : ''} ${item.hasApproval ? 'has-approval' : ''}`}
                    onClick={() => item.dateStr && handleDateClick(item.dateStr)}
                    style={{ cursor: item.dateStr ? 'pointer' : 'default' }}
                  >
                    {item.day}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* 날짜 선택 및 버튼 */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', display: 'block' }}>선택한 날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={{ padding: '10px', fontSize: '16px', border: '2px solid #6c5ce7', borderRadius: '8px', width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleTodayClick} style={{ padding: '10px 20px', flex: 1 }}>
                오늘
              </button>
              <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '10px 20px', flex: 1 }}>
                초기화
              </button>
            </div>
            {dateInfo && (
              <div style={{ color: '#666', fontSize: '14px', marginTop: '15px', padding: '10px', background: 'white', borderRadius: '8px' }}>
                {dateInfo} - 총 {filteredApprovals.length}건의 결재
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>현장</th>
              <th>작성자</th>
              <th>상태</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {!selectedDate ? (
              <tr>
                <td colSpan="7" className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  날짜를 선택하면 해당 날짜의 결재 목록이 표시됩니다.
                </td>
              </tr>
            ) : filteredApprovals.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  해당 날짜의 결재가 없습니다.
                </td>
              </tr>
            ) : (
              filteredApprovals.map(approval => (
                <DateQueryRow
                  key={approval.id}
                  approval={approval}
                  currentUser={currentUser}
                  approvedUsers={approvedUsers}
                  onViewDetail={() => setSelectedApproval(approval.id)}
                  onActionComplete={syncData}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedApproval && (
        <ApprovalDetailModal
          approvalId={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </div>
  )
}

function DateQueryRow({ approval, currentUser, approvedUsers, onViewDetail, onActionComplete }) {
  const { hasPermission, isSiteManager } = useApp()

  const canUserApprove = () => {
    if (!currentUser) return false
    // 본사 계정은 1단계(현재 단계가 0)에서만 승인 가능
    if (currentUser.role === 'headquarters') {
      return approval.currentStep === 0 && (approval.status === 'pending' || approval.status === 'processing')
    }
    // 대표님 계정은 0단계(본사 단계) 또는 1단계(대표님 단계)에서 승인 가능
    if (currentUser.role === 'ceo') {
      return (approval.status === 'pending' || approval.status === 'processing') && 
             (approval.currentStep === 0 || approval.currentStep === 1)
    }
    if (currentUser.role === 'admin_dept' || currentUser.role === 'other') return false
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
      return isSiteManager(approval.siteId)
    }
    return false
  }

  const canEdit = () => {
    if (!currentUser) return false
    // 작성자만 수정 가능 (username 또는 name으로 매칭)
    const user = approvedUsers.find(u => u.username === currentUser.username)
    const userName = user ? user.name : null
    const isAuthor = approval.author === currentUser.username || 
                     (userName && approval.author === userName)
    return isAuthor && 
           (approval.status === 'pending' || approval.status === 'processing' || approval.status === 'rejected')
  }

  const showActions = (approval.status === 'pending' || approval.status === 'processing') && canUserApprove()
  const canCancelRejection = approval.status === 'rejected' && 
                            currentUser && 
                            currentUser.role === 'ceo'

  return (
    <tr>
      <td>{approval.approvalNumber || approval.id}</td>
      <td>{approval.title}</td>
      <td>{approval.siteName}</td>
      <td>{approval.author}</td>
      <td>
        <span className={`badge badge-${getStatusClass(approval.status)}`}>
          {getStatusText(approval.status)}
        </span>
      </td>
      <td>{formatDate(approval.createdAt)}</td>
      <td>
        <ApprovalActions
          approval={approval}
          showActions={showActions}
          canEdit={canEdit()}
          canDelete={false}
          canCancelRejection={canCancelRejection}
          onViewDetail={onViewDetail}
          onActionComplete={onActionComplete}
        />
      </td>
    </tr>
  )
}
