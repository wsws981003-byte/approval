import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Login from './components/Auth/Login'
import Dashboard from './components/Dashboard/Dashboard'
import Sites from './components/Sites/Sites'
import NewApproval from './components/Approvals/NewApproval'
import ApprovalsList from './components/Approvals/ApprovalsList'
import PendingApprovals from './components/Approvals/PendingApprovals'
import DateQuery from './components/DateQuery/DateQuery'
import UserRequests from './components/Users/UserRequests'
import BackupViewer from './components/Backup/BackupViewer'
import MyInfo from './components/Users/MyInfo'
import Layout from './components/Layout/Layout'
import './App.css'

function AppRoutes() {
  const { currentUser, loading, initializeDefaultCEO, syncData } = useApp()

  useEffect(() => {
    const init = async () => {
      await syncData()
      await initializeDefaultCEO()
    }
    init()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>로딩 중...</div>
      </div>
    )
  }

  if (!currentUser) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/new-approval" element={<NewApproval />} />
        <Route path="/approvals" element={<ApprovalsList />} />
        <Route path="/pending" element={<PendingApprovals />} />
        <Route path="/date-query" element={<DateQuery />} />
        <Route path="/user-requests" element={<UserRequests />} />
        <Route path="/backup-viewer" element={<BackupViewer />} />
        <Route path="/my-info" element={<MyInfo />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  // 프로덕션 모드에서만 /approval basename 사용
  const basename = import.meta.env.PROD ? '/approval' : ''
  
  return (
    <BrowserRouter basename={basename}>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App

