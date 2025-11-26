import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// GitHub Pages 404 처리: 리다이렉트된 경우 원래 경로로 복원
if (sessionStorage.redirect) {
  const redirect = sessionStorage.redirect;
  sessionStorage.removeItem('redirect');
  if (redirect !== window.location.href) {
    window.history.replaceState(null, '', redirect);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

