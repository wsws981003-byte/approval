import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'

export default function Sites() {
  const { sites, currentUser, hasPermission, syncData, approvedUsers } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
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
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const site = {
      id: Date.now(),
      name: formData.name,
      location: formData.location,
      manager: formData.manager,
      steps: 1, // 기본값 1단계로 고정
      approvers: Array(1).fill('')
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

  const handleEdit = (site) => {
    setEditingSite(site)
    setFormData({
      name: site.name || '',
      location: site.location || '',
      manager: site.manager || '',
      steps: 1 // UI에서 제거되었지만 formData는 유지
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingSite) return

    setLoading(true)

    try {
      const updates = {
        name: formData.name,
        location: formData.location,
        manager: formData.manager,
        steps: editingSite.steps || 1 // 기존 단계 수 유지
      }

      await dataService.updateSite(editingSite.id, updates)
      await syncData()
      setShowEditModal(false)
      setEditingSite(null)
      setFormData({ name: '', location: '', manager: '', steps: 1 })
      alert('현장 정보가 수정되었습니다.')
    } catch (error) {
      console.error('현장 수정 오류:', error)
      alert('현장 수정 중 오류가 발생했습니다.')
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

  const canManage = hasPermission('manage_sites')

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
              <th>승인자</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">등록된 현장이 없습니다.</td>
              </tr>
            ) : (
              sites.map(site => {
                const approversList = site.approvers && site.approvers.length > 0
                  ? site.approvers.filter(a => a && a.trim()).join(', ') || '미설정'
                  : '미설정'
                return (
                  <tr key={site.id}>
                    <td>{site.name}</td>
                    <td>{site.location}</td>
                    <td>{site.manager}</td>
                    <td>
                      <span style={{ fontSize: '13px', color: approversList === '미설정' ? '#999' : '#333' }}>
                        {approversList}
                      </span>
                    </td>
                    <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {canManage && (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleEdit(site)}
                            style={{ padding: '5px 10px', fontSize: '14px' }}
                          >
                            수정
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(site.id)}
                            style={{ padding: '5px 10px', fontSize: '14px' }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                      {!canManage && <span style={{ color: '#999' }}>-</span>}
                    </div>
                  </td>
                </tr>
                )
              })
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

      {showEditModal && editingSite && (
        <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>현장 수정</h2>
              <button className="close-btn" onClick={() => { setShowEditModal(false); setEditingSite(null) }}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
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
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '수정 중...' : '수정'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowEditModal(false); setEditingSite(null) }}
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
