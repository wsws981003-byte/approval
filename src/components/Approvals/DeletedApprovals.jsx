import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import ApprovalDetailModal from './ApprovalDetailModal'

export default function DeletedApprovals() {
  const { currentUser, approvedUsers, sites, syncData } = useApp()
  const [deletedApprovals, setDeletedApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [selectedApproval, setSelectedApproval] = useState(null)

  useEffect(() => {
    loadDeletedApprovals()
  }, [])

  const loadDeletedApprovals = async () => {
    setLoading(true)
    try {
      const data = await dataService.getDeletedApprovals()
      setDeletedApprovals(data)
    } catch (error) {
      console.error('삭제된 결재 조회 오류:', error)
      alert('삭제된 결재를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredApprovals = () => {
    let filtered = deletedApprovals.filter(approval => {
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
      filtered = filtered.filter(a => {
        return a.author === currentUser.username || (userName && a.author === userName)
      })
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.deletedAt || a.createdAt)
      const dateB = new Date(b.deletedAt || b.createdAt)
      return dateB - dateA
    })
  }

  const filtered = getFilteredApprovals()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h2>삭제된 결재 목록</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="제목, 작성자, 번호로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px' }}
        >
          <option value="">전체 상태</option>
          <option value="pending">대기 중</option>
          <option value="processing">진행 중</option>
          <option value="approved">승인 완료</option>
          <option value="rejected">반려</option>
        </select>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          style={{ padding: '10px' }}
        >
          <option value="">전체 현장</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

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
              <th>삭제일</th>
              <th>삭제자</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">삭제된 결재가 없습니다.</td>
              </tr>
            ) : (
              filtered.map(approval => (
                <tr key={approval.id} style={{ opacity: 0.8 }}>
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
                  <td>{formatDate(approval.deletedAt)}</td>
                  <td>{approval.deletedBy || '-'}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedApproval(approval.id)}
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                    >
                      상세
                    </button>
                  </td>
                </tr>
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
    </div>
  )
}

