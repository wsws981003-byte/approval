import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { getRoleText, formatDate } from '../../utils'

export default function UserRequests() {
  const { userRequests, approvedUsers, deletedUsers, currentUser, syncData } = useApp()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [showDeletedUsers, setShowDeletedUsers] = useState(false)

  useEffect(() => {
    syncData()
  }, [])

  const pendingRequests = userRequests.filter(r => r.status === 'pending')

  const handleApprove = async (requestId) => {
    const request = userRequests.find(r => r.id === requestId)
    if (!request) return

    if (!window.confirm(`${request.name}(${request.username})님의 회원가입을 승인하시겠습니까?`)) return

    try {
      const approvedUser = {
        username: request.username,
        password: request.password,
        role: request.role,
        name: request.name,
        phone: request.phone || '',
        email: request.email || '',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.username
      }

      await dataService.saveApprovedUser(approvedUser)
      await dataService.updateUserRequest(requestId, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: currentUser.username
      })
      await syncData()
      alert('회원가입이 승인되었습니다.')
    } catch (error) {
      console.error('승인 오류:', error)
      alert('승인 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (requestId) => {
    const request = userRequests.find(r => r.id === requestId)
    if (!request) return

    const reason = window.prompt('거부 사유를 입력하세요 (선택사항):')
    
    try {
      const updates = {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: currentUser.username
      }
      if (reason) {
        updates.rejection_reason = reason
      }

      await dataService.updateUserRequest(requestId, updates)
      await syncData()
      alert('회원가입 요청이 거부되었습니다.')
    } catch (error) {
      console.error('거부 오류:', error)
      alert('거부 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (username) => {
    if (username === 'admin') {
      alert('기본 대표님 계정(admin)은 삭제할 수 없습니다.')
      return
    }

    if (!window.confirm(`${username} 사용자를 삭제하시겠습니까? 이 사용자는 더 이상 로그인할 수 없습니다.\n\n삭제된 계정은 나중에 복구할 수 있습니다.`)) return

    try {
      const userToDelete = approvedUsers.find(u => u.username === username)
      if (userToDelete) {
        const deletedUser = {
          ...userToDelete,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser ? currentUser.username : 'system'
        }

        await dataService.saveDeletedUser(deletedUser)
        await dataService.deleteApprovedUser(username)
        await syncData()
        alert('사용자가 삭제되었습니다.')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleRestore = async (username) => {
    const deletedUser = deletedUsers.find(u => u.username === username)
    if (!deletedUser) {
      alert('삭제된 사용자를 찾을 수 없습니다.')
      return
    }

    const existingUser = approvedUsers.find(u => u.username === username)
    if (existingUser) {
      alert('이미 승인된 사용자 목록에 존재하는 사용자입니다.')
      return
    }

    if (!window.confirm(`${deletedUser.name}(${username}) 사용자를 복구하시겠습니까?`)) return

    try {
      const restoredUser = {
        username: deletedUser.username,
        password: deletedUser.password,
        role: deletedUser.role,
        name: deletedUser.name,
        phone: deletedUser.phone || '',
        email: deletedUser.email || '',
        approvedAt: deletedUser.approvedAt,
        approvedBy: deletedUser.approvedBy || 'system'
      }

      await dataService.saveApprovedUser(restoredUser)
      await dataService.deleteDeletedUser(username)
      await syncData()
      alert('사용자가 복구되었습니다.')
    } catch (error) {
      console.error('복구 오류:', error)
      alert('복구 중 오류가 발생했습니다.')
    }
  }

  const handlePermanentDelete = async (username) => {
    const deletedUser = deletedUsers.find(u => u.username === username)
    if (!deletedUser) {
      alert('삭제된 사용자를 찾을 수 없습니다.')
      return
    }

    if (!window.confirm(`${deletedUser.name}(${username}) 사용자를 영구적으로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return

    try {
      const success = await dataService.permanentlyDeleteUser(username)
      if (success) {
        await syncData()
        alert('사용자가 영구적으로 삭제되었습니다.')
      } else {
        alert('영구 삭제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('영구 삭제 오류:', error)
      alert('영구 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (username) => {
    const user = approvedUsers.find(u => u.username === username)
    if (user) {
      setEditingUser(user)
      setEditFormData({
        name: user.name || '',
        role: user.role || '',
        phone: user.phone || '',
        email: user.email || '',
        password: ''
      })
      setShowEditModal(true)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const updates = {
        name: editFormData.name,
        role: editFormData.role,
        phone: editFormData.phone || null,
        email: editFormData.email || null
      }

      if (editFormData.password && editFormData.password.length >= 4) {
        updates.password = editFormData.password
      }

      await dataService.updateApprovedUser(editingUser.username, updates)
      await syncData()
      setShowEditModal(false)
      setEditingUser(null)
      alert('사용자 정보가 수정되었습니다.')
    } catch (error) {
      console.error('수정 오류:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  return (
    <div>
      <h2>회원가입 요청 관리</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>ID</th>
              <th>이름</th>
              <th>역할</th>
              <th>연락처</th>
              <th>이메일</th>
              <th>신청일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">대기 중인 회원가입 요청이 없습니다.</td>
              </tr>
            ) : (
              pendingRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.username}</td>
                  <td>{request.name}</td>
                  <td>{getRoleText(request.role)}</td>
                  <td>{request.phone || '-'}</td>
                  <td>{request.email || '-'}</td>
                  <td>{formatDate(request.requestedAt)}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(request.id)}
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                    >
                      승인
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(request.id)}
                      style={{ padding: '5px 10px', fontSize: '14px', marginLeft: '5px' }}
                    >
                      거부
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>승인된 사용자 목록</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>역할</th>
              <th>연락처</th>
              <th>이메일</th>
              <th>승인일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {approvedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">승인된 사용자가 없습니다.</td>
              </tr>
            ) : (
              approvedUsers.map(user => {
                const isDefaultAdmin = user.username === 'admin' && user.role === 'ceo'
                const isCEO = currentUser && currentUser.role === 'ceo'
                return (
                  <tr key={user.username}>
                    <td>{user.username}</td>
                    <td>{user.name}</td>
                    <td>{getRoleText(user.role)}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{formatDate(user.approvedAt)}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(user.username)}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        수정
                      </button>
                      {isDefaultAdmin ? (
                        <span style={{ color: '#999', fontSize: '14px', marginLeft: '5px' }}>삭제 불가</span>
                      ) : isCEO ? (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(user.username)}
                          style={{ padding: '5px 10px', fontSize: '14px', marginLeft: '5px' }}
                        >
                          삭제
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px', marginBottom: '15px' }}>
        <h3 
          style={{ 
            margin: 0, 
            cursor: 'pointer', 
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onClick={() => setShowDeletedUsers(!showDeletedUsers)}
        >
          <span style={{ fontSize: '1.2em' }}>{showDeletedUsers ? '▼' : '▶'}</span>
          삭제된 사용자 목록 {deletedUsers.length > 0 && `(${deletedUsers.length})`}
        </h3>
      </div>
      {showDeletedUsers && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>역할</th>
                <th>연락처</th>
                <th>이메일</th>
                <th>삭제일</th>
                <th>삭제자</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {deletedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">삭제된 사용자가 없습니다.</td>
                </tr>
              ) : (
                deletedUsers.map(user => (
                  <tr key={user.username} style={{ opacity: 0.7 }}>
                    <td>{user.username}</td>
                    <td>{user.name}</td>
                    <td>{getRoleText(user.role)}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{formatDate(user.deletedAt)}</td>
                    <td>{user.deletedBy || '-'}</td>
                    <td>
                      <button
                        className="btn btn-success"
                        onClick={() => handleRestore(user.username)}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        복구
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handlePermanentDelete(user.username)}
                        style={{ padding: '5px 10px', fontSize: '14px', marginLeft: '5px' }}
                      >
                        영구 삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>사용자 정보 수정</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '20px' }}>
              <div className="form-group">
                <label>ID</label>
                <input
                  type="text"
                  value={editingUser.username}
                  readOnly
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666' }}>ID는 변경할 수 없습니다.</small>
              </div>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>역할 *</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  required
                >
                  <option value="headquarters">본사</option>
                  <option value="site">현장</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label>연락처</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-1234-5678"
                  maxLength={13}
                />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@email.com"
                />
              </div>
              <div className="form-group">
                <label>비밀번호 변경 (선택사항)</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="새 비밀번호를 입력하세요"
                />
                <small style={{ color: '#666' }}>비밀번호를 변경하지 않으려면 비워두세요. (4자 이상)</small>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>수정</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1 }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
