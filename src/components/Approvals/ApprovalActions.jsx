import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import EditApprovalModal from './EditApprovalModal'

export default function ApprovalActions({ approval, showActions, canEdit, canDelete, canCancelRejection, onViewDetail, onActionComplete }) {
  const { currentUser, approvedUsers, syncData } = useApp()
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleApprove = async () => {
    if (!window.confirm('이 결재를 승인하시겠습니까?')) return

    setLoading(true)
    try {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const approver = user?.name || currentUser.username

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
    if (!window.confirm(`결재 번호 ${approval.approvalNumber || approval.id} (${approval.title})를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return

    setLoading(true)
    try {
      await dataService.deleteApproval(approval.id)
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

