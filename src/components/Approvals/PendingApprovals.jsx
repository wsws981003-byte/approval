import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import ApprovalDetailModal from './ApprovalDetailModal'
import ApprovalActions from './ApprovalActions'

export default function PendingApprovals() {
  const { approvals, currentUser, approvedUsers, syncData } = useApp()
  const [selectedApproval, setSelectedApproval] = useState(null)

  useEffect(() => {
    syncData()
  }, [])

  // 대기 중인 결재 필터링
  let pending = approvals.filter(a => a.status === 'pending' || a.status === 'processing')

  // 현장은 자신이 작성한 결재만 보기
  if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
    const user = approvedUsers.find(u => u.username === currentUser.username)
    const userName = user ? user.name : null
    
    pending = pending.filter(a => {
      return a.author === currentUser.username || 
             (userName && a.author === userName)
    })
  }

  return (
    <div>
      <h2>대기 중인 결재</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>현장</th>
              <th>작성자</th>
              <th>현재 단계</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">대기 중인 결재가 없습니다.</td>
              </tr>
            ) : (
              pending.map(approval => (
                <PendingApprovalRow
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

function PendingApprovalRow({ approval, currentUser, approvedUsers, onViewDetail, onActionComplete }) {
  const { hasPermission, isSiteManager } = useApp()

  const canUserApprove = () => {
    if (!currentUser) return false
    // 대표님 계정만 결재 승인/반려 가능
    if (currentUser.role === 'ceo') return true
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
           (approval.status === 'pending' || approval.status === 'processing')
  }

  const canDelete = () => {
    if (!currentUser) return false
    // 대표님 계정만 삭제 가능
    if (currentUser.role === 'ceo') return true
    return approval.author === currentUser.username && 
           (approval.status === 'pending' || approval.status === 'processing')
  }

  const approvalNumber = approval.approvalNumber || approval.id
  const currentStepInfo = `${approval.currentStep + 1}/${approval.totalSteps} (${approval.approvers[approval.currentStep] || '미지정'})`

  return (
    <tr>
      <td>{approvalNumber}</td>
      <td>{approval.title}</td>
      <td>{approval.siteName}</td>
      <td>{approval.author}</td>
      <td>{currentStepInfo}</td>
      <td>{formatDate(approval.createdAt)}</td>
      <td>
        <ApprovalActions
          approval={approval}
          showActions={canUserApprove()}
          canEdit={canEdit()}
          canDelete={canDelete()}
          canCancelRejection={false}
          onViewDetail={onViewDetail}
          onActionComplete={onActionComplete}
        />
      </td>
    </tr>
  )
}
