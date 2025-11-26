export default function NotificationModal({ onClose }) {
  return (
    <div className="modal active" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>알림</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div>알림 목록 구현 중...</div>
      </div>
    </div>
  )
}

