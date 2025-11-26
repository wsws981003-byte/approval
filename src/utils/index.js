// 유틸리티 함수

export function getStatusClass(status) {
  const map = {
    'pending': 'pending',
    'processing': 'processing',
    'approved': 'approved',
    'rejected': 'rejected'
  }
  return map[status] || 'pending'
}

export function getStatusText(status) {
  const map = {
    'pending': '대기 중',
    'processing': '진행 중',
    'approved': '승인 완료',
    'rejected': '반려'
  }
  return map[status] || '대기 중'
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function getRoleText(role) {
  if (role === 'ceo' || role === 'headquarters') {
    return '본사'
  } else if (role === 'manager' || role === 'site') {
    return '현장'
  } else if (role === 'admin_dept' || role === 'other') {
    return '기타'
  }
  return role || '미지정'
}

// 전화번호 자동 포맷팅 함수
export function formatPhoneNumber(value) {
  // 숫자만 추출
  let numbers = value.replace(/[^\d]/g, '')
  
  // 최대 11자리까지만 허용
  if (numbers.length > 11) {
    numbers = numbers.slice(0, 11)
  }
  
  // 전화번호 포맷팅
  let formatted = ''
  if (numbers.length <= 3) {
    formatted = numbers
  } else if (numbers.length <= 7) {
    formatted = numbers.slice(0, 3) + '-' + numbers.slice(3)
  } else if (numbers.length <= 11) {
    formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7)
  }
  
  return formatted
}

// 결재 번호 생성 함수
export function generateApprovalNumber(approvals) {
  const currentYear = new Date().getFullYear()
  const yearApprovals = approvals.filter(a => {
    const approvalYear = new Date(a.createdAt).getFullYear()
    return approvalYear === currentYear
  })
  
  let maxNumber = 0
  yearApprovals.forEach(a => {
    if (a.approvalNumber) {
      const match = a.approvalNumber.match(/AP-\d{4}-(\d+)/)
      if (match) {
        const num = parseInt(match[1])
        if (num > maxNumber) {
          maxNumber = num
        }
      }
    }
  })
  
  const nextNumber = maxNumber + 1
  return `AP-${currentYear}-${String(nextNumber).padStart(3, '0')}`
}

