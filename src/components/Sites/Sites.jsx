import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'

export default function Sites() {
  const { sites, currentUser, hasPermission, syncData } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manager: '',
    steps: 1
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    syncData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'steps' ? parseInt(value) || 1 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (formData.steps < 1 || formData.steps > 10) {
      alert('결재 단계 수는 1~10 사이여야 합니다.')
      setLoading(false)
      return
    }

    const site = {
      id: Date.now(),
      name: formData.name,
      location: formData.location,
      manager: formData.manager,
      steps: formData.steps,
      approvers: Array(formData.steps).fill('')
    }

    try {
      const saved = await dataService.saveSite(site)
      if (saved) {
        await syncData()
        setFormData({ name: '', location: '', manager: '', steps: 1 })
        setShowModal(false)
        alert('현장이 추가되었습니다.')
      } else {
        alert('현장 추가 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('현장 추가 오류:', error)
      alert('현장 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (siteId) => {
    if (!hasPermission('manage_sites')) {
      alert('현장 삭제 권한이 없습니다.')
      return
    }

    const site = sites.find(s => s.id === siteId)
    if (!site) {
      alert('현장을 찾을 수 없습니다.')
      return
    }

    if (!window.confirm(`"${site.name}" 현장을 정말 삭제하시겠습니까?`)) return

    try {
      await dataService.deleteSite(siteId)
      await syncData()
      alert('현장이 삭제되었습니다.')
    } catch (error) {
      console.error('현장 삭제 오류:', error)
      alert('현장 삭제 중 오류가 발생했습니다.')
    }
  }

  const canDelete = hasPermission('manage_sites')

  return (
    <div>
      <h2>현장 관리</h2>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 새 현장 추가
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>현장명</th>
              <th>위치</th>
              <th>담당자</th>
              <th>결재 단계</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">등록된 현장이 없습니다.</td>
              </tr>
            ) : (
              sites.map(site => (
                <tr key={site.id}>
                  <td>{site.name}</td>
                  <td>{site.location}</td>
                  <td>{site.manager}</td>
                  <td>{site.steps}단계</td>
                  <td>
                    {canDelete ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(site.id)}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        삭제
                      </button>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>새 현장 추가</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>현장명 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>위치 *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>담당자 *</label>
                <input
                  type="text"
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>결재 단계 수 *</label>
                <input
                  type="number"
                  name="steps"
                  value={formData.steps}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  required
                />
                <small style={{ color: '#666' }}>현장별로 다른 결재 단계를 설정할 수 있습니다.</small>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '추가 중...' : '추가'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ marginLeft: '10px' }}
              >
                취소
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
