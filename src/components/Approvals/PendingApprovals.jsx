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
           (approval.status === 'pending' || approval.status === 'processing')
  }

  const canDelete = () => {
    if (!currentUser) return false
    // 대표님 계정과 본사 계정은 삭제 가능
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') return true
    return approval.author === currentUser.username && 
           (approval.status === 'pending' || approval.status === 'processing')
  }

  // 승인 취소 권한 체크
  const canCancelApproval = () => {
    if (!currentUser) return false
    if (approval.status !== 'approved' && approval.status !== 'processing') return false
    if (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters') return false
    if (!approval.approvals || !Array.isArray(approval.approvals)) return false
    
    // 본사 계정은 0단계(본사 단계)에 승인이 있으면 취소 가능
    if (currentUser.role === 'headquarters') {
      const step0Approval = approval.approvals[0]
      return step0Approval && step0Approval.status === 'approved'
    }
    
    // 대표님 계정은 1단계(대표님 단계)에 승인이 있으면 취소 가능
    if (currentUser.role === 'ceo') {
      const step1Approval = approval.approvals[1]
      if (step1Approval && step1Approval.status === 'approved') {
        return true
      }
      // 대표님이 본사 단계를 건너뛰고 승인한 경우도 취소 가능
      const step0Approval = approval.approvals[0]
      if (step0Approval && step0Approval.status === 'approved' && step0Approval.skipped) {
        return true
      }
    }
    
    return false
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
          canCancelApproval={canCancelApproval()}
          onViewDetail={onViewDetail}
          onActionComplete={onActionComplete}
        />
      </td>
    </tr>
  )
}
