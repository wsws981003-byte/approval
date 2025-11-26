import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { getStatusClass, getStatusText, formatDate } from '../../utils'

export default function ApprovalDetailModal({ approvalId, onClose }) {
  const { approvals, sites } = useApp()
  const [approval, setApproval] = useState(null)

  useEffect(() => {
    const found = approvals.find(a => a.id === approvalId)
    setApproval(found)
  }, [approvalId, approvals])

  if (!approval) return null

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
            {Array.from({ length: approval.totalSteps }, (_, i) => {
              const approvalData = approval.approvals[i]
              const isCurrent = i === approval.currentStep && approval.status !== 'approved' && approval.status !== 'rejected'
              const isCompleted = approvalData && approvalData.status === 'approved'
              const isRejected = approvalData && approvalData.status === 'rejected'

              let className = 'approval-line'
              if (isCompleted) className += ' completed'
              if (isRejected) className += ' rejected'

              return (
                <div key={i} className={className}>
                  <strong>{i + 1}단계: {approval.approvers[i] || '미지정'}</strong>
                  {isCurrent && <span style={{ color: '#ffc107' }}> ⏳ 대기 중</span>}
                  {isCompleted && <span style={{ color: '#28a745' }}> ✓ 승인 완료 ({formatDate(approvalData.approvedAt)})</span>}
                  {isRejected && <span style={{ color: '#dc3545' }}> ✗ 반려 ({approvalData.reason || ''})</span>}
                  {!isCurrent && !isCompleted && !isRejected && <span style={{ color: '#999' }}> 대기 중</span>}
                </div>
              )
            })}
          </div>

          {approval.rejectionReason && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
              <strong>반려 사유:</strong> {approval.rejectionReason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

