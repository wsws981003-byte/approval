import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function AdvancedSearchModal({ onClose, onSearch }) {
  const { approvals, currentUser, approvedUsers, sites } = useApp()
  const [formData, setFormData] = useState({
    keyword: '',
    author: '',
    siteId: '',
    status: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    // 현장 목록은 이미 sites에 있음
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const { keyword, author, siteId, status, startDate, endDate } = formData

    // 검색 조건이 하나도 없으면 경고
    if (!keyword && !author && !siteId && !status && !startDate && !endDate) {
      alert('최소 하나 이상의 검색 조건을 입력해주세요.')
      return
    }

    let filtered = approvals

    // 키워드 검색 (제목, 내용)
    if (keyword) {
      const keywordLower = keyword.toLowerCase()
      filtered = filtered.filter(approval => {
        const titleMatch = approval.title.toLowerCase().includes(keywordLower)
        const contentMatch = approval.content && approval.content.toLowerCase().includes(keywordLower)
        return titleMatch || contentMatch
      })
    }

    // 작성자 검색
    if (author) {
      const authorLower = author.toLowerCase()
      filtered = filtered.filter(approval => {
        const authorName = approval.author.toLowerCase()
        return authorName.includes(authorLower)
      })
    }

    // 현장 검색
    if (siteId) {
      filtered = filtered.filter(approval => approval.siteId === parseInt(siteId))
    }

    // 상태 검색
    if (status) {
      filtered = filtered.filter(approval => approval.status === status)
    }

    // 기간 검색
    if (startDate || endDate) {
      filtered = filtered.filter(approval => {
        const approvalDate = new Date(approval.createdAt)
        approvalDate.setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return approvalDate >= start && approvalDate <= end
        } else if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          return approvalDate >= start
        } else if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return approvalDate <= end
        }
        return true
      })
    }

    // 현장은 자신이 작성한 결재만 보기
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const userName = user ? user.name : null

      filtered = filtered.filter(approval => {
        return approval.author === currentUser.username ||
               (userName && approval.author === userName)
      })
    }

    onSearch(filtered)
  }

  const handleReset = () => {
    setFormData({
      keyword: '',
      author: '',
      siteId: '',
      status: '',
      startDate: '',
      endDate: ''
    })
  }

  return (
    <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>고급 검색</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group">
            <label>키워드 (제목, 내용)</label>
            <input
              type="text"
              name="keyword"
              value={formData.keyword}
              onChange={handleChange}
              placeholder="검색어를 입력하세요"
            />
          </div>
          <div className="form-group">
            <label>작성자</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="작성자 ID 또는 이름"
            />
          </div>
          <div className="form-group">
            <label>현장</label>
            <select
              name="siteId"
              value={formData.siteId}
              onChange={handleChange}
            >
              <option value="">전체 현장</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>상태</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="">전체 상태</option>
              <option value="pending">대기 중</option>
              <option value="processing">진행 중</option>
              <option value="approved">승인 완료</option>
              <option value="rejected">반려</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>시작일</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>종료일</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>검색</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ flex: 1 }}
            >
              초기화
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


