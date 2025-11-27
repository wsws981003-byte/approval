import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import ApprovalActions from './ApprovalActions'

export default function ApprovalDetailModal({ approvalId, approval: approvalProp, onClose, onActionComplete }) {
  const { approvals, sites, currentUser, approvedUsers, syncData } = useApp()
  const [approval, setApproval] = useState(approvalProp || null)

  useEffect(() => {
    if (approvalProp) {
      setApproval(approvalProp)
    } else if (approvalId) {
      // 먼저 활성 결재에서 찾기
      const found = approvals.find(a => a.id === approvalId)
      if (found) {
        setApproval(found)
      } else {
        // 활성 결재에 없으면 삭제된 결재에서 찾기
        dataService.getDeletedApprovals().then(deletedApprovals => {
          const deleted = deletedApprovals.find(a => a.id === approvalId)
          if (deleted) {
            setApproval(deleted)
          }
        })
      }
    }
  }, [approvalId, approvalProp, approvals])

  if (!approval) {
    return (
      <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>결재 정보</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            결재 정보를 찾을 수 없습니다.
          </div>
        </div>
      </div>
    )
  }

  const previewAttachment = () => {
    if (!approval.attachmentData) {
      alert('첨부 파일을 찾을 수 없습니다.')
      return
    }

    const byteCharacters = atob(approval.attachmentData.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const downloadAttachment = () => {
    if (!approval.attachmentData) {
      alert('첨부 파일을 찾을 수 없습니다.')
      return
    }

    const byteCharacters = atob(approval.attachmentData.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = approval.attachmentFileName || 'attachment.pdf'
    link.click()
    URL.revokeObjectURL(url)
  }

  const approvalNumber = approval.approvalNumber || approval.id

  // 승인 취소 권한 체크
  const canCancelApproval = () => {
    console.log('=== 승인 취소 권한 체크 시작 ===')
    console.log('approval:', approval)
    console.log('currentUser:', currentUser)
    
    // 삭제된 결재는 불가
    if (approval.deletedAt) {
      console.log('❌ 삭제된 결재')
      return false
    }
    
    // 현재 사용자 확인
    if (!currentUser) {
      console.log('❌ currentUser 없음')
      return false
    }
    
    console.log('사용자 역할:', currentUser.role)
    
    // 대표님 또는 본사 계정만 승인 취소 가능
    if (currentUser.role !== 'ceo' && currentUser.role !== 'headquarters') {
      console.log('❌ 권한 없음 (ceo 또는 headquarters만 가능)')
      return false
    }
    
    console.log('결재 상태:', approval.status)
    
    // 승인된 결재이거나 진행 중인 결재에서만 승인 취소 가능
    if (approval.status !== 'approved' && approval.status !== 'processing') {
      console.log('❌ 상태가 approved 또는 processing이 아님')
      return false
    }
    
    console.log('approval.approvals:', approval.approvals)
    
    // 승인된 단계가 있어야 함
    if (!approval.approvals || !Array.isArray(approval.approvals)) {
      console.log('❌ approvals 배열이 없음')
      return false
    }
    
    // 본사 계정은 0단계(본사 단계)에 승인이 있으면 취소 가능
    if (currentUser.role === 'headquarters') {
      const step0Approval = approval.approvals[0]
      console.log('본사 계정 - 0단계 승인:', step0Approval)
      if (step0Approval && step0Approval.status === 'approved') {
        console.log('✅ 본사 계정 - 승인 취소 가능')
        return true
      }
      console.log('❌ 본사 계정 - 0단계 승인 없음')
    }
    
    // 대표님 계정은 1단계(대표님 단계)에 승인이 있으면 취소 가능
    if (currentUser.role === 'ceo') {
      const step1Approval = approval.approvals[1]
      console.log('대표님 계정 - 1단계 승인:', step1Approval)
      if (step1Approval && step1Approval.status === 'approved') {
        console.log('✅ 대표님 계정 - 승인 취소 가능 (1단계)')
        return true
      }
      // 대표님이 본사 단계를 건너뛰고 승인한 경우도 취소 가능
      const step0Approval = approval.approvals[0]
      console.log('대표님 계정 - 0단계 승인:', step0Approval)
      if (step0Approval) {
        if (step0Approval.status === 'approved') {
          console.log('✅ 대표님 계정 - 승인 취소 가능 (0단계 승인됨)')
          return true
        }
      }
      // 대표님은 승인된 단계가 하나라도 있으면 취소 가능 (더 관대하게)
      const hasAnyApproval = approval.approvals.some((app, idx) => {
        return app && app.status === 'approved'
      })
      if (hasAnyApproval) {
        console.log('✅ 대표님 계정 - 승인 취소 가능 (어떤 단계든 승인됨)')
        return true
      }
      console.log('❌ 대표님 계정 - 승인된 단계 없음')
    }
    
    console.log('❌ 최종: 승인 취소 불가')
    return false
  }

  const handleActionComplete = async () => {
    // 결재 데이터 다시 로드
    if (approvalId) {
      const found = approvals.find(a => a.id === approvalId)
      if (found) {
        setApproval(found)
      } else {
        const deletedApprovals = await dataService.getDeletedApprovals()
        const deleted = deletedApprovals.find(a => a.id === approvalId)
        if (deleted) {
          setApproval(deleted)
        }
      }
    }
    if (onActionComplete) {
      onActionComplete()
    } else {
      await syncData()
    }
  }

  return (
    <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{approval.title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>결재 번호:</strong> {approvalNumber}</p>
            <p><strong>현장:</strong> {approval.siteName}</p>
            <p><strong>작성자:</strong> {approval.author}</p>
            <p><strong>작성일:</strong> {formatDate(approval.createdAt)}</p>
            <p><strong>상태:</strong> <span className={`badge badge-${getStatusClass(approval.status)}`}>{getStatusText(approval.status)}</span></p>
            {approval.deletedAt && (
              <>
                <p><strong>삭제일:</strong> {formatDate(approval.deletedAt)}</p>
                <p><strong>삭제자:</strong> {approval.deletedBy || '-'}</p>
                <p style={{ color: '#dc3545', fontWeight: 'bold' }}>⚠️ 이 결재는 삭제되었습니다.</p>
              </>
            )}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong>내용:</strong>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
              {approval.content}
            </div>
          </div>

          {approval.attachmentData && approval.attachmentFileName && (
            <div style={{ marginBottom: '20px' }}>
              <strong>첨부:</strong>
              <button
                className="btn btn-primary"
                onClick={previewAttachment}
                style={{ padding: '5px 10px', fontSize: '14px', marginLeft: '10px' }}
              >
                👁️ {approval.attachmentFileName} 미리보기
              </button>
              <button
                className="btn btn-secondary"
                onClick={downloadAttachment}
                style={{ padding: '5px 10px', fontSize: '14px', marginLeft: '5px' }}
              >
                📥 다운로드
              </button>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <strong>결재 라인:</strong>
            {Array.from({ length: 2 }, (_, i) => {
              // 항상 2단계로 표시 (1단계: 본사, 2단계: 대표님)
              const approvalData = approval.approvals[i]
              const isCurrent = i === approval.currentStep && approval.status !== 'approved' && approval.status !== 'rejected'
              const isCompleted = approvalData && approvalData.status === 'approved'
              const isRejected = approvalData && approvalData.status === 'rejected'
              
              // 단계별 이름 설정
              let stepName = '미지정'
              if (i === 0) {
                stepName = approval.approvers[0] || '본사'
              } else if (i === 1) {
                stepName = approval.approvers[1] || '대표님'
              }

              let className = 'approval-line'
              if (isCompleted) className += ' completed'
              if (isRejected) className += ' rejected'

              // 최종 승인 여부 확인 (2단계이고 상태가 approved인 경우)
              const isFinalApproved = i === 1 && approval.status === 'approved' && isCompleted

              return (
                <div key={i} className={className} style={{ marginBottom: '10px', padding: '10px', background: isCompleted ? '#d4edda' : isRejected ? '#f8d7da' : '#f8f9fa', borderRadius: '8px' }}>
                  <strong>{i + 1}단계: {stepName}</strong>
                  {isCurrent && <span style={{ color: '#ffc107', marginLeft: '10px' }}> ⏳ 대기 중</span>}
                  {isCompleted && !isFinalApproved && <span style={{ color: '#28a745', marginLeft: '10px' }}> ✓ 승인 완료 ({formatDate(approvalData.approvedAt)})</span>}
                  {isFinalApproved && <span style={{ color: '#28a745', marginLeft: '10px', fontWeight: 'bold' }}> ✓ 최종 승인 완료 ({formatDate(approvalData.approvedAt)})</span>}
                  {isRejected && <span style={{ color: '#dc3545', marginLeft: '10px' }}> ✗ 반려 ({approvalData.reason || ''})</span>}
                  {!isCurrent && !isCompleted && !isRejected && <span style={{ color: '#999', marginLeft: '10px' }}> 대기 중</span>}
                </div>
              )
            })}
          </div>

          {approval.rejectionReason && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
              <strong>반려 사유:</strong> {approval.rejectionReason}
            </div>
          )}

          {!approval.deletedAt && (
            <div style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid #ddd' }}>
              {/* 디버깅 정보 - 항상 표시 */}
              <div style={{ marginBottom: '10px', padding: '10px', background: '#f0f0f0', fontSize: '12px', borderRadius: '4px' }}>
                <strong>디버깅 정보:</strong><br/>
                상태: {approval.status}<br/>
                사용자 역할: {currentUser?.role || '없음'}<br/>
                승인 배열: {JSON.stringify(approval.approvals, null, 2)}<br/>
                승인 취소 가능: {canCancelApproval() ? '✅ 예' : '❌ 아니오'}<br/>
                canCancelApproval 값: {String(canCancelApproval())}
              </div>
              <ApprovalActions
                approval={approval}
                showActions={false}
                canEdit={false}
                canDelete={false}
                canCancelRejection={false}
                canCancelApproval={canCancelApproval()}
                onViewDetail={onClose}
                onActionComplete={handleActionComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

