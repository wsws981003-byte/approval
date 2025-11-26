import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { getRoleText, formatPhoneNumber } from '../../utils'

export default function MyInfo() {
  const { currentUser, approvedUsers, syncData } = useApp()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      if (user) {
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || ''
        })
      }
    }
  }, [currentUser, approvedUsers])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, [name]: formatted || value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    const user = approvedUsers.find(u => u.username === currentUser.username)
    if (!user) {
      alert('사용자 정보를 찾을 수 없습니다.')
      return
    }

    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null
      }

      await dataService.updateApprovedUser(currentUser.username, updates)
      await syncData()
      alert('정보가 수정되었습니다.')
    } catch (error) {
      console.error('정보 수정 오류:', error)
      alert('정보 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    const user = approvedUsers.find(u => u.username === currentUser.username)
    if (!user) {
      alert('사용자 정보를 찾을 수 없습니다.')
      return
    }

    if (user.password !== passwordForm.currentPassword) {
      alert('현재 비밀번호가 일치하지 않습니다.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (passwordForm.newPassword.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      await dataService.updateApprovedUser(currentUser.username, { password: passwordForm.newPassword })
      await syncData()
      setPasswordForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
      alert('비밀번호가 변경되었습니다.')
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      alert('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return <div>로그인이 필요합니다.</div>
  }

  const user = approvedUsers.find(u => u.username === currentUser.username)

  return (
    <div>
      <h2>내 정보</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID</label>
          <input
            type="text"
            value={currentUser.username}
            readOnly
            style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
          />
          <small style={{ color: '#666' }}>ID는 변경할 수 없습니다.</small>
        </div>
        <div className="form-group">
          <label>이름 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>연락처</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-1234-5678"
            maxLength={13}
          />
        </div>
        <div className="form-group">
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
          />
        </div>
        <div className="form-group">
          <label>역할</label>
          <input
            type="text"
            value={getRoleText(user?.role || currentUser.role)}
            readOnly
            style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
          />
          <small style={{ color: '#666' }}>역할은 변경할 수 없습니다.</small>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '수정 중...' : '정보 수정'}
        </button>
      </form>

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #e9ecef' }} />

      <h3 style={{ marginBottom: '20px' }}>비밀번호 변경</h3>
      <form onSubmit={handlePasswordSubmit}>
        <div className="form-group">
          <label>현재 비밀번호 *</label>
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            required
          />
        </div>
        <div className="form-group">
          <label>새 비밀번호 *</label>
          <input
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            required
            minLength={4}
          />
          <small style={{ color: '#666' }}>비밀번호는 4자 이상이어야 합니다.</small>
        </div>
        <div className="form-group">
          <label>새 비밀번호 확인 *</label>
          <input
            type="password"
            name="newPasswordConfirm"
            value={passwordForm.newPasswordConfirm}
            onChange={handlePasswordChange}
            required
            minLength={4}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}
