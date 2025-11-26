import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
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
  const [deletedFilter, setDeletedFilter] = useState('all') // 'all', 'active', 'deleted'
  const [deletedApprovals, setDeletedApprovals] = useState([])
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedSearchResults, setAdvancedSearchResults] = useState(null)

  useEffect(() => {
    syncData()
    loadDeletedApprovals()
  }, [])

  const loadDeletedApprovals = async () => {
    try {
      const data = await dataService.getDeletedApprovals()
      setDeletedApprovals(data)
    } catch (error) {
      console.error('삭제된 결재 조회 오류:', error)
    }
  }

  const getFilteredApprovals = () => {
    // 고급 검색 결과가 있으면 그것을 사용
    if (advancedSearchResults) {
      return advancedSearchResults
    }

    // 활성 결재와 삭제된 결재 합치기
    let allApprovals = [...approvals]
    
    // 삭제된 결재 필터링
    let filteredDeleted = deletedApprovals.filter(approval => {
      const matchSearch = !search || 
        approval.title.toLowerCase().includes(search.toLowerCase()) ||
        approval.author.toLowerCase().includes(search.toLowerCase()) ||
        (approval.approvalNumber && approval.approvalNumber.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = !statusFilter || approval.status === statusFilter
      const matchSite = !siteFilter || approval.siteId === parseInt(siteFilter)
      return matchSearch && matchStatus && matchSite
    })

    // 현장 소장과 현장 계정은 자신이 작성한 결재만 볼 수 있음
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const userName = user ? user.name : null
      
      filteredDeleted = filteredDeleted.filter(approval => {
        return approval.author === currentUser.username || 
               (userName && approval.author === userName)
      })
    }

    // 삭제된 결재에 isDeleted 플래그 추가
    filteredDeleted = filteredDeleted.map(a => ({ ...a, isDeleted: true }))

    // 활성 결재 필터링
    let filteredActive = approvals.filter(approval => {
      const matchSearch = !search || approval.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || approval.status === statusFilter
      const matchSite = !siteFilter || approval.siteId === parseInt(siteFilter)
      return matchSearch && matchStatus && matchSite
    })

    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'site')) {
      const user = approvedUsers.find(u => u.username === currentUser.username)
      const userName = user ? user.name : null
      
      filteredActive = filteredActive.filter(approval => {
        return approval.author === currentUser.username || 
               (userName && approval.author === userName)
      })
    }

    // 삭제 필터에 따라 반환
    if (deletedFilter === 'deleted') {
      return filteredDeleted.sort((a, b) => {
        const dateA = new Date(a.deletedAt || a.createdAt)
        const dateB = new Date(b.deletedAt || b.createdAt)
        return dateB - dateA
      })
    } else if (deletedFilter === 'active') {
      return filteredActive
    } else {
      // 전체: 활성 + 삭제된 결재 합치기
      const combined = [...filteredActive, ...filteredDeleted]
      return combined.sort((a, b) => {
        const dateA = new Date(a.deletedAt || a.createdAt)
        const dateB = new Date(b.deletedAt || b.createdAt)
        return dateB - dateA
      })
    }
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
        <select value={deletedFilter} onChange={(e) => setDeletedFilter(e.target.value)}>
          <option value="all">전체</option>
          <option value="active">활성 결재</option>
          <option value="deleted">삭제된 결재</option>
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
              {deletedFilter === 'all' || deletedFilter === 'deleted' ? <th>삭제일</th> : null}
              {deletedFilter === 'all' || deletedFilter === 'deleted' ? <th>삭제자</th> : null}
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={deletedFilter === 'all' || deletedFilter === 'deleted' ? 9 : 7} className="empty-state">결재 내역이 없습니다.</td>
              </tr>
            ) : (
              filtered.map(approval => (
                <ApprovalRow
                  key={approval.id}
                  approval={approval}
                  currentUser={currentUser}
                  approvedUsers={approvedUsers}
                  showDeletedInfo={deletedFilter === 'all' || deletedFilter === 'deleted'}
                  onViewDetail={() => setSelectedApproval(approval.id)}
                  onActionComplete={() => {
                    syncData()
                    loadDeletedApprovals()
                  }}
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

function ApprovalRow({ approval, currentUser, approvedUsers, showDeletedInfo, onViewDetail, onActionComplete }) {
  const { sites, hasPermission, isSiteManager } = useApp()
  const isDeleted = approval.isDeleted || false

  const canUserApprove = () => {
    if (!currentUser || isDeleted) return false
    // 대표님 계정만 결재 승인/반려 가능
    if (currentUser.role === 'ceo') return true
    if (currentUser.role === 'admin_dept' || currentUser.role === 'other') return false
    if (currentUser.role === 'manager' || currentUser.role === 'site') {
      return isSiteManager(approval.siteId)
    }
    return false
  }

  const canEdit = () => {
    if (!currentUser || isDeleted) return false
    // 작성자만 수정 가능 (username 또는 name으로 매칭)
    const user = approvedUsers.find(u => u.username === currentUser.username)
    const userName = user ? user.name : null
    const isAuthor = approval.author === currentUser.username || 
                     (userName && approval.author === userName)
    return isAuthor && 
           (approval.status === 'pending' || approval.status === 'processing' || approval.status === 'rejected')
  }

  const canDelete = () => {
    if (!currentUser || isDeleted) return false
    // 대표님 계정과 본사 계정은 삭제 가능
    if (currentUser.role === 'ceo' || currentUser.role === 'headquarters') return true
    return approval.author === currentUser.username && 
           (approval.status === 'pending' || approval.status === 'processing')
  }

  const showActions = (approval.status === 'pending' || approval.status === 'processing') && canUserApprove()
  const canCancelRejection = approval.status === 'rejected' && 
                            currentUser && 
                            currentUser.role === 'ceo' &&
                            !isDeleted

  return (
    <tr style={{ opacity: isDeleted ? 0.7 : 1 }}>
      <td>{approval.approvalNumber || approval.id}</td>
      <td>
        {approval.title}
        {isDeleted && <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>(삭제됨)</span>}
      </td>
      <td>{approval.siteName}</td>
      <td>{approval.author}</td>
      <td>
        <span className={`badge badge-${getStatusClass(approval.status)}`}>
          {getStatusText(approval.status)}
        </span>
      </td>
      <td>{formatDate(approval.createdAt)}</td>
      {showDeletedInfo && (
        <>
          <td>{approval.deletedAt ? formatDate(approval.deletedAt) : '-'}</td>
          <td>{approval.deletedBy || '-'}</td>
        </>
      )}
      <td>
        {isDeleted ? (
          <button
            className="btn btn-primary"
            onClick={onViewDetail}
            style={{ padding: '5px 10px', fontSize: '14px' }}
          >
            상세
          </button>
        ) : (
          <ApprovalActions
            approval={approval}
            showActions={showActions}
            canEdit={canEdit()}
            canDelete={canDelete()}
            canCancelRejection={canCancelRejection}
            onViewDetail={onViewDetail}
            onActionComplete={onActionComplete}
          />
        )}
      </td>
    </tr>
  )
}

