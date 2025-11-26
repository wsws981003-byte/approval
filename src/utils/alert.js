import React from 'react'
import { createRoot } from 'react-dom/client'
import AlertModal from '../components/Common/AlertModal'

// 커스텀 alert 함수
export function customAlert(message) {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const handleClose = () => {
      root.unmount()
      document.body.removeChild(container)
      resolve()
    }

    root.render(React.createElement(AlertModal, { message, onClose: handleClose }))
  })
}

// window.alert를 커스텀 alert로 교체
if (typeof window !== 'undefined') {
  window.alert = customAlert
}

