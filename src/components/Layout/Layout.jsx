import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getRoleText } from '../../utils'
import NotificationModal from '../Notifications/NotificationModal'
import './Layout.css'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, approvedUsers, hasPermission, notifications } = useApp()
  const [showNotificationModal, setShowNotificationModal] = useState(false)

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('currentUser')
      window.location.reload()
    }
  }

  const user = approvedUsers.find(u => u.username === currentUser?.username)
  const unreadCount = notifications.filter(n => !n.read && (!n.userId || n.userId === currentUser?.username)).length

  const navItems = [
    { path: '/dashboard', label: '대시보드', show: true },
    { path: '/sites', label: '현장 관리', show: hasPermission('manage_sites') },
    { path: '/new-approval', label: '결재 작성', show: true },
    { path: '/approvals', label: '결재 목록', show: true },
    { path: '/pending', label: '대기 중인 결재', show: true },
    { path: '/deleted-approvals', label: '삭제된 결재', show: currentUser?.role === 'ceo' || currentUser?.role === 'headquarters' },
    { path: '/date-query', label: '날짜별 조회', show: true },
    { path: '/my-info', label: '내 정보', show: true },
    { path: '/user-requests', label: '가입 요청', show: currentUser?.role === 'ceo' || currentUser?.role === 'headquarters' },
    { path: '/backup-viewer', label: '백업 조회', show: currentUser?.role === 'ceo' || currentUser?.role === 'headquarters' || currentUser?.role === 'admin_dept' || currentUser?.role === 'other' }
  ]

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🏗️ 전자결재 시스템</h1>
            <p>현장별 결재 관리 플랫폼</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div id="userInfo" style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{currentUser?.username}</span>
              <span style={{ fontSize: '14px', opacity: 0.9, marginLeft: '10px' }}>
                ({getRoleText(currentUser?.role)})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className="btn btn-icon"
                onClick={() => setShowNotificationModal(true)}
                style={{ position: 'relative', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px' }}
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    className="notification-badge"
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '14px' }}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="nav">
        {navItems
          .filter(item => item.show)
          .map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
      </div>

      <div className="content">
        {children}
      </div>

      {showNotificationModal && (
        <NotificationModal onClose={() => setShowNotificationModal(false)} />
      )}
    </div>
  )
}

