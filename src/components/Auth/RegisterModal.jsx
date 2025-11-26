import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { formatPhoneNumber as formatPhone } from '../../utils'
import './Auth.css'

export default function RegisterModal({ onClose }) {
  const { approvedUsers, userRequests, syncData } = useApp()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    role: '',
    name: '',
    phone: '',
    email: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password || !formData.role || !formData.name) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.')
      return
    }

    const existingApproved = approvedUsers.find(u => u.username === formData.username)
    if (existingApproved) {
      setError('이미 가입된 사용자입니다.')
      return
    }

    const existingRequest = userRequests.find(r => r.username === formData.username && r.status === 'pending')
    if (existingRequest) {
      setError('이미 회원가입 요청이 대기 중입니다.')
      return
    }

    const request = {
      id: Date.now(),
      username: formData.username,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }

    // 첫 번째 대표님 계정은 자동 승인
    const isFirstCEO = formData.role === 'ceo' && approvedUsers.filter(u => u.role === 'ceo').length === 0

    if (isFirstCEO) {
      const approvedUser = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        approvedAt: new Date().toISOString(),
        approvedBy: 'system'
      }

      await dataService.saveApprovedUser(approvedUser)
      await syncData()
      alert('첫 번째 대표님 계정이 자동으로 승인되었습니다. 로그인해주세요.')
      onClose()
    } else {
      await dataService.saveUserRequest(request)
      await syncData()
      alert('회원가입 요청이 제출되었습니다. 대표님의 승인을 기다려주세요.')
      onClose()
    }
  }

  return (
    <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>회원가입</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>ID *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>비밀번호 *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>비밀번호 확인 *</label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>역할 선택 *</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="">역할을 선택하세요</option>
              <option value="headquarters">본사</option>
              <option value="site">현장</option>
              <option value="other">기타</option>
            </select>
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            회원가입 신청
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%', marginTop: '10px' }}>
            취소
          </button>
        </form>
      </div>
    </div>
  )
}

