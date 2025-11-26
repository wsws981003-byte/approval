import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { useNavigate } from 'react-router-dom'

export default function EditApprovalModal({ approval, onClose, onSuccess }) {
  const navigate = useNavigate()
  const { sites, syncData } = useApp()
  const [formData, setFormData] = useState({
    title: '',
    siteId: '',
    author: '',
    content: '',
    attachment: null
  })
  const [attachmentInfo, setAttachmentInfo] = useState('')
  const [existingAttachment, setExistingAttachment] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (approval) {
      setFormData({
        title: approval.title || '',
        siteId: approval.siteId || '',
        author: approval.author || '',
        content: approval.content || '',
        attachment: null
      })
      if (approval.attachmentFileName) {
        setExistingAttachment(approval.attachmentFileName)
      }
    }
  }, [approval])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      setAttachmentInfo('')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      e.target.value = ''
      setAttachmentInfo('')
      return
    }

    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드 가능합니다.')
      e.target.value = ''
      setAttachmentInfo('')
      return
    }

    const fileSize = (file.size / 1024 / 1024).toFixed(2)
    setAttachmentInfo(`✓ ${file.name} (${fileSize}MB)`)
    setFormData(prev => ({ ...prev, attachment: file }))
    setExistingAttachment(null)
  }

  const handleClearAttachment = () => {
    setExistingAttachment(null)
    setAttachmentInfo('')
    setFormData(prev => ({ ...prev, attachment: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const site = sites.find(s => s.id === parseInt(formData.siteId))
    if (!site) {
      alert('현장을 선택해주세요.')
      setLoading(false)
      return
    }

    try {
      const updates = {
        title: formData.title,
        content: formData.content,
        siteId: parseInt(formData.siteId),
        siteName: site.name,
        author: formData.author
      }

      // 첨부 파일 처리
      if (formData.attachment) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          updates.attachmentData = e.target.result
          updates.attachmentFileName = formData.attachment.name

          // 반려된 결재인 경우 상태 초기화
          if (approval.status === 'rejected') {
            // 본사 계정과 대표님 계정 찾기
            const allApprovedUsers = await dataService.getApprovedUsers()
            const headquartersUser = allApprovedUsers.find(u => u.role === 'headquarters')
            const ceoUser = allApprovedUsers.find(u => u.role === 'ceo')
            
            const headquartersName = headquartersUser?.name || headquartersUser?.username || '본사'
            const ceoName = ceoUser?.name || ceoUser?.username || '대표님'

            updates.status = 'pending'
            updates.currentStep = 0
            updates.totalSteps = 2 // 항상 2단계: 본사 -> 대표님
            updates.approvers = [headquartersName, ceoName] // 1단계: 본사, 2단계: 대표님
            updates.approvals = Array(2).fill(null)
            updates.rejectedAt = null
            updates.rejectionReason = null
          }

          await dataService.updateApproval(approval.id, updates)
          await syncData()
          alert('결재가 수정되어 다시 제출되었습니다.')
          onClose()
          if (onSuccess) onSuccess()
        }
        reader.onerror = () => {
          alert('파일을 읽는 중 오류가 발생했습니다.')
          setLoading(false)
        }
        reader.readAsDataURL(formData.attachment)
      } else {
        // 첨부 파일이 제거된 경우
        if (!existingAttachment) {
          updates.attachmentFileName = null
          updates.attachmentData = null
        }

        // 반려된 결재인 경우 상태 초기화
        if (approval.status === 'rejected') {
          // 본사 계정과 대표님 계정 찾기
          const allApprovedUsers = await dataService.getApprovedUsers()
          const headquartersUser = allApprovedUsers.find(u => u.role === 'headquarters')
          const ceoUser = allApprovedUsers.find(u => u.role === 'ceo')
          
          const headquartersName = headquartersUser?.name || headquartersUser?.username || '본사'
          const ceoName = ceoUser?.name || ceoUser?.username || '대표님'

          updates.status = 'pending'
          updates.currentStep = 0
          updates.totalSteps = 2 // 항상 2단계: 본사 -> 대표님
          updates.approvers = [headquartersName, ceoName] // 1단계: 본사, 2단계: 대표님
          updates.approvals = Array(2).fill(null)
          updates.rejectedAt = null
          updates.rejectionReason = null
        }

        await dataService.updateApproval(approval.id, updates)
        await syncData()
        alert('결재가 수정되었습니다.')
        onClose()
        if (onSuccess) onSuccess()
        setLoading(false)
      }
    } catch (error) {
      console.error('결재 수정 오류:', error)
      alert('결재 수정 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  if (!approval) return null

  return (
    <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{approval.status === 'rejected' ? '반려된 결재 수정' : '결재 수정'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        {approval.status === 'rejected' && approval.rejectionReason && (
          <div style={{ padding: '10px', background: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '4px', margin: '20px' }}>
            <strong>반려 사유:</strong> {approval.rejectionReason}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>현장 선택 *</label>
            <select
              name="siteId"
              value={formData.siteId}
              onChange={handleChange}
              required
            >
              <option value="">현장을 선택하세요</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>작성자 *</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>내용 *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>첨부 파일 (PDF)</label>
            {existingAttachment && (
              <div style={{ marginBottom: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                <strong>기존 첨부 파일:</strong> {existingAttachment}
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleClearAttachment}
                  style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
                  제거
                </button>
              </div>
            )}
            <input
              type="file"
              accept=".pdf"
              onChange={handleAttachmentChange}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              PDF 파일만 업로드 가능합니다. (최대 5MB)
            </small>
            {attachmentInfo && (
              <div style={{ marginTop: '5px', color: '#28a745', fontSize: '14px' }}>
                {attachmentInfo}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? '수정 중...' : approval.status === 'rejected' ? '수정 후 다시 제출' : '수정 저장'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


