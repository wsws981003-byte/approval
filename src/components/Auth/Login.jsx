import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import RegisterModal from './RegisterModal'
import './Auth.css'

export default function Login() {
  const { approvedUsers, setCurrentUser, syncData } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('ID와 비밀번호를 입력해주세요.')
      return
    }

    await syncData()

    const approvedUser = approvedUsers.find(u => u.username === username)
    if (!approvedUser) {
      setError('승인되지 않은 사용자이거나 존재하지 않는 ID입니다. 대표님의 승인을 기다려주세요.')
      return
    }

    if (approvedUser.password !== password) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setCurrentUser({
      username: username,
      role: approvedUser.role,
      loginTime: new Date().toISOString()
    })

    window.location.reload()
  }

  return (
    <div className="modal active" style={{ display: 'flex' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>로그인</h2>
        </div>
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>ID *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>비밀번호 *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            로그인
          </button>
        </form>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowRegister(true)}
            style={{ width: '100%' }}
          >
            회원가입
          </button>
        </div>
        <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
          <strong>안내:</strong><br />
          회원가입 후 대표님의 승인이 필요합니다.<br />
          승인된 사용자만 로그인할 수 있습니다.
        </div>
      </div>

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
    </div>
  )
}

