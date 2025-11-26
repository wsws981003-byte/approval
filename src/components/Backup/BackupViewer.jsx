import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { getStatusClass, getStatusText, formatDate } from '../../utils'
import ApprovalDetailModal from '../Approvals/ApprovalDetailModal'

export default function BackupViewer() {
  const { currentUser, hasPermission } = useApp()
  const [backupData, setBackupData] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hasPermission('view_backup')) {
      return
    }
  }, [hasPermission])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('JSON 파일만 업로드 가능합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        if (!data.approvals) {
          alert('올바른 백업 파일 형식이 아닙니다. (결재 데이터가 없습니다)')
          return
        }

        if (data.backupType === 'monthly' && !data.backupPeriod) {
          alert('올바른 백업 파일 형식이 아닙니다. (백업 기간 정보가 없습니다)')
          return
        }

        setBackupData(data)
        alert('백업 파일이 로드되었습니다.')
      } catch (error) {
        alert('파일을 읽는 중 오류가 발생했습니다: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  const handleMonthlyBackup = async () => {
    if (!hasPermission('create_backup')) {
      alert('백업 생성 권한이 없습니다.')
      return
    }

    setLoading(true)
    try {
      const approvals = await dataService.getApprovals()
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999)

      const monthlyApprovals = approvals.filter(approval => {
        const approvalDate = new Date(approval.createdAt)
        return approvalDate >= startDate && approvalDate <= endDate
      })

      const backup = {
        backupType: 'monthly',
        backupDate: new Date().toISOString(),
        backupPeriod: {
          year: selectedYear,
          month: selectedMonth
        },
        storageType: dataService.storageType || 'localStorage',
        dataCount: {
          approvals: monthlyApprovals.length
        },
        approvals: monthlyApprovals
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.json`
      link.click()
      URL.revokeObjectURL(url)

      alert('월별 백업이 생성되었습니다.')
    } catch (error) {
      console.error('백업 생성 오류:', error)
      alert('백업 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFullBackup = async () => {
    if (!hasPermission('create_backup')) {
      alert('백업 생성 권한이 없습니다.')
      return
    }

    setLoading(true)
    try {
      const [approvals, sites, approvedUsers] = await Promise.all([
        dataService.getApprovals(),
        dataService.getSites(),
        dataService.getApprovedUsers()
      ])

      const backup = {
        backupType: 'full',
        backupDate: new Date().toISOString(),
        storageType: dataService.storageType || 'localStorage',
        dataCount: {
          approvals: approvals.length,
          sites: sites.length,
          approvedUsers: approvedUsers.length
        },
        approvals,
        sites,
        approvedUsers
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_full_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      alert('전체 백업이 생성되었습니다.')
    } catch (error) {
      console.error('백업 생성 오류:', error)
      alert('백업 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const canCreateBackup = hasPermission('create_backup')

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div>
      <h2>백업 관리</h2>
      
      {canCreateBackup && (
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px' }}>백업 파일 생성</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <label>연도 선택</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ padding: '10px' }}>
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <label>월 선택</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ padding: '10px' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleMonthlyBackup}
              disabled={loading}
              style={{ padding: '10px 20px' }}
            >
              월별 백업 생성
            </button>
            <button
              className="btn btn-success"
              onClick={handleFullBackup}
              disabled={loading}
              style={{ padding: '10px 20px' }}
            >
              전체 백업 생성
            </button>
          </div>
          <small style={{ color: '#666', display: 'block', marginTop: '10px' }}>
            월별 백업: 선택한 월의 결재 데이터만 백업합니다. 전체 백업: 모든 결재 데이터를 백업합니다.
          </small>
        </div>
      )}

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #e9ecef' }} />

      <h3 style={{ marginBottom: '15px' }}>백업 파일 조회</h3>
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label>백업 파일 업로드</label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ padding: '10px' }}
        />
        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
          백업된 JSON 파일을 선택하세요.
        </small>
      </div>

      {backupData && (
        <>
          <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>백업 정보</h3>
            <p><strong>백업 날짜:</strong> {formatDate(backupData.backupDate)}</p>
            {backupData.backupPeriod && (
              <p><strong>백업 기간:</strong> {backupData.backupPeriod.year}년 {backupData.backupPeriod.month}월</p>
            )}
            {backupData.backupType === 'full' && (
              <p><strong>백업 유형:</strong> 전체 백업</p>
            )}
            <p><strong>백업 소스:</strong> {backupData.storageType || 'localStorage'}</p>
            <p><strong>결재 건수:</strong> {backupData.dataCount.approvals}건</p>
            {backupData.dataCount.sites && (
              <p><strong>현장 수:</strong> {backupData.dataCount.sites}개</p>
            )}
            {backupData.dataCount.approvedUsers && (
              <p><strong>사용자 수:</strong> {backupData.dataCount.approvedUsers}명</p>
            )}
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
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {backupData.approvals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">백업된 결재가 없습니다.</td>
                  </tr>
                ) : (
                  backupData.approvals.map(approval => (
                    <tr key={approval.id}>
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
        </>
      )}

      {selectedApproval && backupData && (
        <ApprovalDetailModal
          approval={backupData.approvals.find(a => a.id === selectedApproval)}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </div>
  )
}
