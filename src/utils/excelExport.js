import * as XLSX from 'xlsx'
import { getStatusText } from './index'

export function exportToExcel(filteredApprovals) {
  if (filteredApprovals.length === 0) {
    alert('내보낼 결재 데이터가 없습니다.')
    return
  }

  const excelData = filteredApprovals.map(approval => {
    const approvalDate = new Date(approval.createdAt)
    const formattedDate = approvalDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    return {
      '결재번호': approval.approvalNumber || approval.id,
      '제목': approval.title,
      '현장': approval.siteName || '미지정',
      '작성자': approval.author,
      '상태': getStatusText(approval.status),
      '작성일': formattedDate,
      '현재단계': approval.status === 'processing' || approval.status === 'pending'
        ? `${approval.currentStep + 1}/${approval.totalSteps}`
        : approval.status === 'approved' ? '완료' : '-',
      '내용': approval.content ? approval.content.substring(0, 100) + (approval.content.length > 100 ? '...' : '') : '',
      '첨부파일': approval.attachmentFileName || '-'
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)

  const colWidths = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 50 },
    { wch: 20 }
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, '결재목록')

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const fileName = `결재목록_${dateStr}.xlsx`

  XLSX.writeFile(wb, fileName)

  alert(`${filteredApprovals.length}건의 결재 데이터가 Excel 파일로 내보내졌습니다.`)
}

export function exportDashboardStats(userApprovals) {
  const statsData = [
    { '항목': '전체 결재', '건수': userApprovals.length },
    { '항목': '대기 중', '건수': userApprovals.filter(a => a.status === 'pending').length },
    { '항목': '진행 중', '건수': userApprovals.filter(a => a.status === 'processing').length },
    { '항목': '승인 완료', '건수': userApprovals.filter(a => a.status === 'approved').length },
    { '항목': '반려', '건수': userApprovals.filter(a => a.status === 'rejected').length }
  ]

  const monthlyStats = []
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월`

    const monthApprovals = userApprovals.filter(a => {
      const approvalDate = new Date(a.createdAt)
      return approvalDate.getFullYear() === date.getFullYear() &&
             approvalDate.getMonth() === date.getMonth()
    })

    monthlyStats.push({
      '월': monthStr,
      '결재수': monthApprovals.length
    })
  }

  const siteStats = []
  const siteCounts = {}
  userApprovals.forEach(approval => {
    const siteName = approval.siteName || '미지정'
    siteCounts[siteName] = (siteCounts[siteName] || 0) + 1
  })

  Object.keys(siteCounts).forEach(siteName => {
    siteStats.push({
      '현장명': siteName,
      '결재수': siteCounts[siteName]
    })
  })

  const wb = XLSX.utils.book_new()

  const ws1 = XLSX.utils.json_to_sheet(statsData)
  ws1['!cols'] = [{ wch: 15 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws1, '전체통계')

  const ws2 = XLSX.utils.json_to_sheet(monthlyStats)
  ws2['!cols'] = [{ wch: 15 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws2, '월별통계')

  const ws3 = XLSX.utils.json_to_sheet(siteStats)
  ws3['!cols'] = [{ wch: 20 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws3, '현장별통계')

  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const fileName = `결재통계_${dateStr}.xlsx`

  XLSX.writeFile(wb, fileName)

  alert('대시보드 통계가 Excel 파일로 내보내졌습니다.')
}

