import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import { exportToExcel } from '../../utils/excelExport'
import ApprovalDetailModal from './ApprovalDetailModal'
import ApprovalActions from './ApprovalActions'
import AdvancedSearchModal from './AdvancedSearchModal'

export default function ApprovalsList() {
  const location = useLocation()
  const { approvals, currentUser, approvedUsers, sites, syncData } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(location.state?.filterStatus || '')
  const [siteFilter, setSiteFilter] = useState('')
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedSearchResults, setAdvancedSearchResults] = useState(null)

  useEffect(() => {
    syncData()
  }, [])

  const getFilteredApprovals = () => {
    // 고급 검색 결과가 있으면 그것을 사용
    if (advancedSearchResults) {
      return advancedSearchResults
    }

    let filtered = approvals.filter(approval => {
      const matchSearch = !search || approval.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || approval.status === statusFilter
      const matchSite = !siteFilter || approval.siteId === parseInt(siteFilter)
      return matchSearch && matchStatus && matchSite
    })

    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const userName = user ? user.name : null
      
      filtered = filtered.filter(approval => {
        return approval.author === currentUser.username || 
               (userName && approval.author === userName)
      })
    }

    return filtered
  }

  const filtered = getFilteredApprovals()

  const handleClearAdvancedSearch = () => {
    setAdvancedSearchResults(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>결재 목록</h2>
        <button className="btn btn-success" onClick={() => exportToExcel(filtered)} style={{ padding: '10px 20px' }}>
          📊 Excel 내보내기
        </button>
      </div>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="제목 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="pending">대기 중</option>
          <option value="approved">승인 완료</option>
          <option value="rejected">반려</option>
        </select>
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
          <option value="">전체 현장</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={() => setShowAdvancedSearch(true)}
          style={{ padding: '10px 20px' }}
        >
          🔍 고급 검색
        </button>
        {advancedSearchResults && (
          <button
            className="btn btn-secondary"
            onClick={handleClearAdvancedSearch}
            style={{ padding: '10px 20px' }}
          >
            검색 해제
          </button>
        )}
      </div>
      {advancedSearchResults && (
        <div style={{ margin: '15px 0', padding: '10px', background: '#e3f2fd', borderRadius: '8px' }}>
          <span style={{ fontWeight: 600, color: '#1976d2' }}>🔍 고급 검색 결과: </span>
          <span style={{ color: '#1976d2' }}>{advancedSearchResults.length}건</span>
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>현장</th>
              <th>작성자</th>
              <th>상태</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">결재 내역이 없습니다.</td>
              </tr>
            ) : (
              filtered.map(approval => (
                <ApprovalRow
                  key={approval.id}
                  approval={approval}
                  currentUser={currentUser}
                  approvedUsers={approvedUsers}
                  onViewDetail={() => setSelectedApproval(approval.id)}
                  onActionComplete={syncData}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedApproval && (
        <ApprovalDetailModal
          approvalId={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}

      {showAdvancedSearch && (
        <AdvancedSearchModal
          onClose={() => setShowAdvancedSearch(false)}
          onSearch={(results) => {
            setAdvancedSearchResults(results)
            setShowAdvancedSearch(false)
          }}
        />
      )}
    </div>
  )
}

function ApprovalRow({ approval, currentUser, approvedUsers, onViewDetail, onActionComplete }) {
  const { sites, hasPermission, isSiteManager } = useApp()

  const canUserApprove = () => {
    if (!currentUser) return false
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') return true
    if (currentUser.role === 'admin_dept' || currentUser.role === 'other') return false
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
      return isSiteManager(approval.siteId)
    }
    return false
  }

  const canEdit = () => {
    if (!currentUser) return false
    return approval.author === currentUser.username && 
           (approval.status === 'pending' || approval.status === 'processing' || approval.status === 'rejected')
  }

  const canDelete = () => {
    if (!currentUser) return false
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') return true
    return approval.author === currentUser.username && 
           (approval.status === 'pending' || approval.status === 'processing')
  }

  const showActions = (approval.status === 'pending' || approval.status === 'processing') && canUserApprove()
  const canCancelRejection = approval.status === 'rejected' && 
                            currentUser && 
                            (currentUser.role === 'ceo' || currentUser.role === 'headquarters')

  return (
    <tr>
      <td>{approval.approvalNumber || approval.id}</td>
      <td>{approval.title}</td>
      <td>{approval.siteName}</td>
      <td>{approval.author}</td>
      <td>
        <span className={`badge badge-${getStatusClass(approval.status)}`}>
          {getStatusText(approval.status)}
        </span>
      </td>
      <td>{formatDate(approval.createdAt)}</td>
      <td>
        <ApprovalActions
          approval={approval}
          showActions={showActions}
          canEdit={canEdit()}
          canDelete={canDelete()}
          canCancelRejection={canCancelRejection}
          onViewDetail={onViewDetail}
          onActionComplete={onActionComplete}
        />
      </td>
    </tr>
  )
}

