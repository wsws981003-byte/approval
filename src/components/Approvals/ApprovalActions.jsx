import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import EditApprovalModal from './EditApprovalModal'

export default function ApprovalActions({ approval, showActions, canEdit, canDelete, canCancelRejection, canCancelApproval, onViewDetail, onActionComplete }) {
  const { currentUser, approvedUsers, syncData } = useApp()
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleApprove = async () => {
    if (!window.confirm('이 결재를 승인하시겠습니까?')) return

    setLoading(true)
    try {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const approver = user?.name || currentUser.username

      // 대표님이 본사 단계(0단계)를 건너뛰는 경우
      if (currentUser.role === 'ceo' && approval.currentStep === 0) {
        // 본사 단계를 자동으로 승인 처리
        approval.approvals[0] = {
          approver: '본사 (건너뜀)',
          approvedAt: new Date().toISOString(),
          status: 'approved',
          skipped: true
        }
        // 대표님 단계로 바로 이동
        approval.currentStep = 1
      }

      // 현재 단계 승인 처리
      approval.approvals[approval.currentStep] = {
        approver: approver,
        approvedAt: new Date().toISOString(),
        status: 'approved'
      }

      approval.currentStep++

      if (approval.currentStep >= approval.totalSteps) {
        approval.status = 'approved'
      } else {
        approval.status = 'processing'
      }

      await dataService.updateApproval(approval.id, {
        currentStep: approval.currentStep,
        status: approval.status,
        approvals: approval.approvals
      })

      // 승인 완료 알림 생성
      if (approval.status === 'approved') {
        await dataService.saveNotification({
          type: 'approved',
          title: '결재 승인 완료',
          message: `"${approval.title}" 결재가 승인되었습니다.`,
          approvalId: approval.id,
          userId: approval.author,
          read: false
        })
      }

      await syncData()
      if (onActionComplete) onActionComplete()
      alert('승인되었습니다.')
    } catch (error) {
      console.error('승인 오류:', error)
      alert('승인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = window.prompt('반려 사유를 입력하세요:')
    if (reason === null || !reason.trim()) {
      if (reason === null) return
      alert('반려 사유를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const approver = currentUser.username

      approval.status = 'rejected'
      approval.rejectedAt = new Date().toISOString()
      approval.rejectionReason = reason
      approval.approvals[approval.currentStep] = {
        approver: approver,
        rejectedAt: new Date().toISOString(),
        status: 'rejected',
        reason: reason
      }

      await dataService.updateApproval(approval.id, {
        status: approval.status,
        rejectedAt: approval.rejectedAt,
        rejectionReason: approval.rejectionReason,
        approvals: approval.approvals
      })

      // 반려 알림 생성
      await dataService.saveNotification({
        type: 'rejected',
        title: '결재 반려',
        message: `"${approval.title}" 결재가 반려되었습니다.`,
        approvalId: approval.id,
        userId: approval.author,
        read: false
      })

      await syncData()
      if (onActionComplete) onActionComplete()
      alert('반려되었습니다.')
    } catch (error) {
      console.error('반려 오류:', error)
      alert('반려 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`결재 번호 ${approval.approvalNumber || approval.id} (${approval.title})를 삭제하시겠습니까?\n\n삭제된 결재는 삭제된 결재 목록에서 확인할 수 있습니다.`)) return

    setLoading(true)
    try {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const deletedBy = user?.name || currentUser.username
      await dataService.deleteApproval(approval.id, deletedBy)
      await syncData()
      if (onActionComplete) onActionComplete()
      alert('결재가 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRejection = async () => {
    if (!window.confirm('반려를 취소하고 결재를 다시 진행 상태로 변경하시겠습니까?')) return

    setLoading(true)
    try {
      // 반려 상태를 pending으로 변경하고 반려 정보 초기화
      const updates = {
        status: 'pending',
        currentStep: 0,
        rejectedAt: null,
        rejectionReason: null,
        approvals: approval.approvals.map((app, idx) => {
          // 현재 단계의 반려 정보만 제거
          if (idx === approval.currentStep && app && app.status === 'rejected') {
            return null
          }
          return app
        })
      }

      await dataService.updateApproval(approval.id, updates)
      await syncData()
      if (onActionComplete) onActionComplete()
      alert('반려가 취소되었고 결재가 다시 진행 상태로 변경되었습니다.')
    } catch (error) {
      console.error('반려 취소 오류:', error)
      alert('반려 취소 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelApproval = async () => {
    // 현재 사용자가 승인한 단계 찾기
    const user = approvedUsers.find(u => u.username === currentUser.username)
    const userName = user?.name || currentUser.username
    
    let cancelStep = -1
    let stepName = ''
    
    // 본사 계정은 0단계(본사 단계)를 취소
    if (currentUser.role === 'headquarters') {
      const step0Approval = approval.approvals[0]
      if (step0Approval && step0Approval.status === 'approved') {
        cancelStep = 0
        stepName = '1단계(본사)'
      }
    }
    
    // 대표님 계정은 1단계(대표님 단계)를 취소, 없으면 0단계 확인
    if (currentUser.role === 'ceo') {
      const step1Approval = approval.approvals[1]
      if (step1Approval && step1Approval.status === 'approved') {
        cancelStep = 1
        stepName = '2단계(대표님)'
      } else {
        // 대표님이 본사 단계를 건너뛰고 승인한 경우
        const step0Approval = approval.approvals[0]
        if (step0Approval && step0Approval.status === 'approved' && step0Approval.skipped) {
          cancelStep = 0
          stepName = '1단계(본사)'
        }
      }
    }

    if (cancelStep === -1) {
      alert('취소할 승인이 없습니다.')
      return
    }

    if (!window.confirm(`${stepName} 승인을 취소하고 이전 단계로 되돌리시겠습니까?`)) return

    setLoading(true)
    try {
      // 승인 단계 제거
      const newApprovals = [...approval.approvals]
      newApprovals[cancelStep] = null

      // currentStep을 취소된 단계로 설정 (다시 승인을 받을 수 있도록)
      const newCurrentStep = cancelStep

      // 상태 업데이트
      // 취소된 단계가 0단계이고 승인된 단계가 없으면 pending, 아니면 processing
      let newStatus = 'processing'
      const hasAnyApproval = newApprovals.some(app => app && app.status === 'approved')
      if (newCurrentStep === 0 && !hasAnyApproval) {
        newStatus = 'pending'
      }

      const updates = {
        currentStep: newCurrentStep,
        status: newStatus,
        approvals: newApprovals
      }

      await dataService.updateApproval(approval.id, updates)

      // 승인 취소 알림 생성
      await dataService.saveNotification({
        type: 'approval_cancelled',
        title: '결재 승인 취소',
        message: `"${approval.title}" 결재의 ${stepName} 승인이 취소되었습니다.`,
        approvalId: approval.id,
        userId: approval.author,
        read: false
      })

      await syncData()
      if (onActionComplete) onActionComplete()
      alert('승인이 취소되었습니다.')
    } catch (error) {
      console.error('승인 취소 오류:', error)
      alert('승인 취소 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
      <button
        className="btn btn-primary"
        onClick={onViewDetail}
        style={{ padding: '5px 10px', fontSize: '14px' }}
      >
        상세
      </button>
      {showActions && (
        <>
          <button
            className="btn btn-success"
            onClick={handleApprove}
            disabled={loading}
            style={{ padding: '5px 10px', fontSize: '14px' }}
          >
            승인
          </button>
          <button
            className="btn btn-danger"
            onClick={handleReject}
            disabled={loading}
            style={{ padding: '5px 10px', fontSize: '14px' }}
          >
            반려
          </button>
        </>
      )}
      {canEdit && (
        <button
          className="btn btn-info"
          onClick={() => setShowEditModal(true)}
          style={{ padding: '5px 10px', fontSize: '14px', background: '#17a2b8', color: 'white' }}
        >
          수정
        </button>
      )}
      {canDelete && (
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={loading}
          style={{ padding: '5px 10px', fontSize: '14px' }}
        >
          삭제
        </button>
      )}
      {canCancelRejection && (
        <button
          className="btn btn-success"
          onClick={handleCancelRejection}
          disabled={loading}
          style={{ padding: '5px 10px', fontSize: '14px' }}
        >
          반려 취소
        </button>
      )}
      {canCancelApproval ? (
        <button
          className="btn btn-warning"
          onClick={handleCancelApproval}
          disabled={loading}
          style={{ padding: '8px 15px', fontSize: '14px', background: '#ffc107', color: '#000', border: '1px solid #ffc107', fontWeight: 'bold' }}
        >
          ⚠️ 승인 취소
        </button>
      ) : (
        <div style={{ fontSize: '10px', color: '#999', padding: '5px' }}>
          canCancelApproval: {String(canCancelApproval)}
        </div>
      )}

      {showEditModal && (
        <EditApprovalModal
          approval={approval}
          onClose={() => setShowEditModal(false)}
          onSuccess={onActionComplete}
        />
      )}
    </div>
  )
}

