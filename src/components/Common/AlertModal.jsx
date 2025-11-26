import { useEffect } from 'react'

export default function AlertModal({ message, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div 
      className="modal active" 
      style={{ display: 'flex', zIndex: 10000 }} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="modal-content" 
        style={{ maxWidth: '400px', minWidth: '300px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px', lineHeight: '1.5' }}>
            {message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ padding: '10px 20px', fontSize: '14px' }}
              autoFocus
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

