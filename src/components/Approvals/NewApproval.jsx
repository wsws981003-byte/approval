import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { generateApprovalNumber } from '../../utils'

export default function NewApproval() {
  const navigate = useNavigate()
  const { currentUser, sites, approvedUsers, syncData } = useApp()
  const [formData, setFormData] = useState({
    title: '',
    siteId: '',
    author: '',
    content: '',
    attachment: null
  })
  const [attachmentInfo, setAttachmentInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 작성자 자동 설정
    if (currentUser) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      setFormData(prev => ({
        ...prev,
        author: user?.name || currentUser.username
      }))
    }
  }, [currentUser, approvedUsers])

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

    // 파일 크기 확인 (5MB 제한)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      e.target.value = ''
      setAttachmentInfo('')
      return
    }

    // PDF 파일인지 확인
    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드 가능합니다.')
      e.target.value = ''
      setAttachmentInfo('')
      return
    }

    const fileSize = (file.size / 1024 / 1024).toFixed(2)
    setAttachmentInfo(`✓ ${file.name} (${fileSize}MB)`)
    setFormData(prev => ({ ...prev, attachment: file }))
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

    let author = formData.author.trim()
    if (!author && currentUser) {
      author = currentUser.username
    }

    const approval = {
      id: Date.now(),
      approvalNumber: generateApprovalNumber(await dataService.getApprovals()),
      title: formData.title,
      siteId: parseInt(formData.siteId),
      siteName: site.name,
      author: author,
      content: formData.content,
      attachment: null,
      attachmentFileName: null,
      attachmentData: null,
      status: 'pending',
      currentStep: 0,
      totalSteps: site.steps,
      approvers: [...site.approvers],
      approvals: Array(site.steps).fill(null),
      createdAt: new Date().toISOString()
    }

    try {
      // 첨부 파일 처리
      if (formData.attachment) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          approval.attachmentData = e.target.result
          approval.attachmentFileName = formData.attachment.name

          const saved = await dataService.saveApproval(approval)
          if (saved) {
            await syncData()
            alert('결재가 제출되었습니다.')
            navigate('/approvals')
          } else {
            alert('결재 저장 중 오류가 발생했습니다.')
          }
          setLoading(false)
        }
        reader.onerror = () => {
          alert('파일을 읽는 중 오류가 발생했습니다.')
          setLoading(false)
        }
        reader.readAsDataURL(formData.attachment)
      } else {
        const saved = await dataService.saveApproval(approval)
        if (saved) {
          await syncData()
          alert('결재가 제출되었습니다.')
          navigate('/approvals')
        } else {
          alert('결재 저장 중 오류가 발생했습니다.')
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('결재 제출 오류:', error)
      alert('결재 제출 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>새 결재 작성</h2>
      <form onSubmit={handleSubmit}>
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              name="siteId"
              value={formData.siteId}
              onChange={handleChange}
              required
              style={{ flex: 1 }}
            >
              <option value="">현장을 선택하세요</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/sites')}
              style={{ whiteSpace: 'nowrap', padding: '12px 16px' }}
            >
              + 새 현장
            </button>
          </div>
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
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '제출 중...' : '결재 제출'}
        </button>
      </form>
    </div>
  )
}
