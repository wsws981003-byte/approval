import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import { exportDashboardStats } from '../../utils/excelExport'
import ApprovalDetailModal from '../Approvals/ApprovalDetailModal'
import Charts from './Charts'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, approvals, approvedUsers } = useApp()
  const [selectedApproval, setSelectedApproval] = useState(null)

  // 사용자별 결재 필터링
  const getUserApprovals = () => {
    let userApprovals = approvals
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const userName = user ? user.name : null
      
      userApprovals = approvals.filter(a => {
        return a.author === currentUser.username || 
               (userName && a.author === userName)
      })
    }
    return userApprovals
  }

  const userApprovals = getUserApprovals()
  const total = userApprovals.length
  const pending = userApprovals.filter(a => a.status === 'pending' || a.status === 'processing').length
  const approved = userApprovals.filter(a => a.status === 'approved').length
  const rejected = userApprovals.filter(a => a.status === 'rejected').length

  const recent = [...userApprovals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const handleStatClick = (status) => {
    navigate('/approvals', { state: { filterStatus: status } })
  }

  const handleApprovalClick = (approval) => {
    setSelectedApproval(approval)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>대시보드</h2>
        <button className="btn btn-success" onClick={() => exportDashboardStats(userApprovals)} style={{ padding: '10px 20px' }}>
          📊 통계 Excel 내보내기
        </button>
      </div>

      <div className="stats">
        <div className="stat-card" onClick={() => handleStatClick('')} style={{ cursor: 'pointer' }}>
          <h3>{total}</h3>
          <p>전체 결재</p>
        </div>
        <div className="stat-card" onClick={() => handleStatClick('pending')} style={{ cursor: 'pointer' }}>
          <h3>{pending}</h3>
          <p>대기 중</p>
        </div>
        <div className="stat-card" onClick={() => handleStatClick('approved')} style={{ cursor: 'pointer' }}>
          <h3>{approved}</h3>
          <p>승인 완료</p>
        </div>
        <div className="stat-card" onClick={() => handleStatClick('rejected')} style={{ cursor: 'pointer' }}>
          <h3>{rejected}</h3>
          <p>반려</p>
        </div>
      </div>

      <Charts userApprovals={userApprovals} />

      <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>최근 결재 내역</h3>
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
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">결재 내역이 없습니다.</td>
              </tr>
            ) : (
              recent.map(approval => (
                <tr 
                  key={approval.id}
                  onClick={() => handleApprovalClick(approval)}
                  style={{ cursor: 'pointer' }}
                >
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </div>
  )
}

