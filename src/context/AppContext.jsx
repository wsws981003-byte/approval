import { createContext, useContext, useState, useEffect } from 'react'
import { dataService } from '../services/dataService'

const AppContext = createContext()

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })
  
  const [sites, setSites] = useState([])
  const [approvals, setApprovals] = useState([])
  const [userRequests, setUserRequests] = useState([])
  const [approvedUsers, setApprovedUsers] = useState([])
  const [deletedUsers, setDeletedUsers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // 데이터 동기화
  const syncData = async () => {
    try {
      const [sitesData, approvalsData, userRequestsData, approvedUsersData, deletedUsersData, notificationsData] = await Promise.all([
        dataService.getSites(),
        dataService.getApprovals(),
        dataService.getUserRequests(),
        dataService.getApprovedUsers(),
        dataService.getDeletedUsers(),
        dataService.getNotifications()
      ])
      
      setSites(sitesData)
      setApprovals(approvalsData)
      setUserRequests(userRequestsData)
      setApprovedUsers(approvedUsersData)
      setDeletedUsers(deletedUsersData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error('데이터 동기화 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    syncData()
  }, [])

  // currentUser 변경 시 localStorage 업데이트
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  // 기본 대표님 계정 초기화
  const initializeDefaultCEO = async () => {
    const defaultCEOUsername = 'admin'
    const existingAdmin = approvedUsers.find(u => u.username === defaultCEOUsername && u.role === 'ceo')
    
    if (!existingAdmin) {
      const defaultCEO = {
        username: defaultCEOUsername,
        password: 'admin123',
        role: 'ceo',
        name: '대표님',
        phone: '',
        email: '',
        approvedAt: new Date().toISOString(),
        approvedBy: 'system'
      }
      
      await dataService.saveApprovedUser(defaultCEO)
      await syncData()
    }
  }

  // 권한 체크
  const hasPermission = (action) => {
    if (!currentUser) return false
    
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') {
      return true
    }
    
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
      const managerPermissions = [
        'view_dashboard',
        'create_approval',
        'view_own_approvals',
        'approve_own_site',
        'reject_own_site'
      ]
      return managerPermissions.includes(action)
    }
    
    if (currentUser.role === 'admin_dept' || currentUser.role === 'other') {
      const readOnlyPermissions = [
        'view_dashboard',
        'view_own_approvals'
      ]
      return readOnlyPermissions.includes(action)
    }
    
    return false
  }

  // 현장소장이 해당 현장의 담당자인지 확인
  const isSiteManager = (siteId) => {
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'site')) return false
    const site = sites.find(s => s.id === siteId)
    return site && site.manager === currentUser.username
  }

  const value = {
    currentUser,
    setCurrentUser,
    sites,
    setSites,
    approvals,
    setApprovals,
    userRequests,
    setUserRequests,
    approvedUsers,
    setApprovedUsers,
    deletedUsers,
    setDeletedUsers,
    notifications,
    setNotifications,
    loading,
    syncData,
    initializeDefaultCEO,
    hasPermission,
    isSiteManager
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

