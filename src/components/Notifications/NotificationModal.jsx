import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { formatDate } from '../../utils'

export default function NotificationModal({ onClose }) {
  const { notifications, currentUser, syncData } = useApp()
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    syncData()
  }, [])

  const userNotifications = notifications.filter(n => 
    !n.userId || n.userId === currentUser?.username
  )

  const filteredNotifications = userNotifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  const unreadCount = userNotifications.filter(n => !n.read).length

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dataService.updateNotification(notificationId, { read: true })
      await syncData()
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = userNotifications.filter(n => !n.read)
      await Promise.all(
        unreadNotifications.map(n => dataService.updateNotification(n.id, { read: true }))
      )
      await syncData()
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error)
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await dataService.deleteNotification(notificationId)
      await syncData()
    } catch (error) {
      console.error('알림 삭제 오류:', error)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('모든 알림을 삭제하시겠습니까?')) return

    try {
      await Promise.all(
        userNotifications.map(n => dataService.deleteNotification(n.id))
      )
      await syncData()
    } catch (error) {
      console.error('모든 알림 삭제 오류:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pending':
        return '⏳'
      case 'approved':
        return '✅'
      case 'rejected':
        return '❌'
      default:
        return '📢'
    }
  }

  const getNotificationClass = (type) => {
    switch (type) {
      case 'pending':
        return 'notification-pending'
      case 'approved':
        return 'notification-approved'
      case 'rejected':
        return 'notification-rejected'
      default:
        return 'notification-system'
    }
  }

  return (
    <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>알림</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleMarkAllAsRead}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              모두 읽음
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteAll}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              전체 삭제
            </button>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              전체 ({userNotifications.length})
            </button>
            <button
              className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('unread')}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              읽지 않음 ({unreadCount})
            </button>
            <button
              className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('read')}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              읽음 ({userNotifications.length - unreadCount})
            </button>
          </div>
        </div>
        <div id="notificationsList" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              알림이 없습니다.
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${getNotificationClass(notification.type)} ${!notification.read ? 'unread' : ''}`}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #e9ecef',
                  cursor: 'pointer',
                  background: notification.read ? '#fff' : '#f8f9fa'
                }}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '20px' }}>{getNotificationIcon(notification.type)}</span>
                      <strong>{notification.title}</strong>
                      {!notification.read && (
                        <span style={{ 
                          display: 'inline-block', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#007bff',
                          marginLeft: '5px'
                        }}></span>
                      )}
                    </div>
                    <p style={{ margin: '5px 0', color: '#666' }}>{notification.message}</p>
                    <small style={{ color: '#999' }}>{formatDate(notification.createdAt)}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notification.id)
                    }}
                    style={{ padding: '3px 8px', fontSize: '12px' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
