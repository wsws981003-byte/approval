// 유틸리티 함수

function getStatusClass(status) {
    const map = {
        'pending': 'pending',
        'processing': 'processing',
        'approved': 'approved',
        'rejected': 'rejected'
    };
    return map[status] || 'pending';
}

function getStatusText(status) {
    const map = {
        'pending': '대기 중',
        'processing': '진행 중',
        'approved': '승인 완료',
        'rejected': '반려'
    };
    return map[status] || '대기 중';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function getRoleText(role) {
    // 기존 역할 호환성 유지
    if (role === 'ceo' || role === 'headquarters') {
        return '본사';
    } else if (role === 'manager' || role === 'site') {
        return '현장';
    } else if (role === 'admin_dept' || role === 'other') {
        return '기타';
    }
    return role || '미지정';
}

// 전화번호 자동 포맷팅 함수
function formatPhoneNumber(input) {
    // 숫자만 추출
    let value = input.value.replace(/[^\d]/g, '');
    
    // 최대 11자리까지만 허용
    if (value.length > 11) {
        value = value.slice(0, 11);
    }
    
    // 전화번호 포맷팅
    let formattedValue = '';
    if (value.length <= 3) {
        formattedValue = value;
    } else if (value.length <= 7) {
        formattedValue = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length <= 11) {
        formattedValue = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
    }
    
    input.value = formattedValue;
}

