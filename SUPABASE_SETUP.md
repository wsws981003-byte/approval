# Supabase 연동 가이드

## 📋 목차
1. [Supabase 계정 생성](#1-supabase-계정-생성)
2. [프로젝트 생성](#2-프로젝트-생성)
3. [데이터베이스 테이블 생성](#3-데이터베이스-테이블-생성)
4. [API 키 확인](#4-api-키-확인)
5. [코드에 연동하기](#5-코드에-연동하기)

---

## 1. Supabase 계정 생성

### 1-1. Supabase 웹사이트 접속
1. 브라우저에서 https://supabase.com 접속
2. 우측 상단의 **"Start your project"** 또는 **"Sign in"** 클릭

### 1-2. 계정 생성
- **GitHub 계정으로 로그인** (추천) 또는
- **이메일로 회원가입**

---

## 2. 프로젝트 생성

### 2-1. 새 프로젝트 만들기
1. 대시보드에서 **"New Project"** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: 프로젝트 이름 (예: `approval-system`)
   - **Database Password**: 강력한 비밀번호 입력 (⚠️ 반드시 기록해두세요!)
   - **Region**: 가장 가까운 지역 선택 (예: `Northeast Asia (Seoul)`)
   - **Pricing Plan**: Free 플랜 선택 (무료)

3. **"Create new project"** 버튼 클릭
4. 프로젝트 생성 완료까지 1-2분 대기

---

## 3. 데이터베이스 테이블 생성

### 3-1. SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭

### 3-2. 테이블 생성 SQL 실행
아래 SQL 코드를 복사해서 붙여넣고 **"Run"** 버튼 클릭:

```sql
-- 1. 승인된 사용자 테이블
CREATE TABLE approved_users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 현장 테이블
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    manager TEXT,
    steps INTEGER DEFAULT 1,
    approvers TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 결재 테이블
CREATE TABLE approvals (
    id BIGSERIAL PRIMARY KEY,
    approval_number TEXT UNIQUE,
    title TEXT NOT NULL,
    site_id BIGINT REFERENCES sites(id),
    site_name TEXT,
    author TEXT NOT NULL,
    content TEXT,
    attachment_file_name TEXT,
    attachment_data TEXT, -- base64로 저장
    status TEXT NOT NULL DEFAULT 'pending',
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 1,
    approvers TEXT[] DEFAULT ARRAY[]::TEXT[],
    approvals JSONB DEFAULT '[]'::JSONB,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    updated_at TIMESTAMPTZ,
    original_created_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 회원가입 요청 테이블
CREATE TABLE user_requests (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);

-- 5. 삭제된 사용자 테이블
CREATE TABLE deleted_users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT,
    role TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_by TEXT
);

-- 6. 알림 테이블
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    approval_id BIGINT,
    user_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (검색 속도 향상)
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_author ON approvals(author);
CREATE INDEX idx_approvals_created_at ON approvals(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### 3-3. 기본 대표님 계정 추가
다시 SQL Editor에서 아래 코드 실행:

```sql
-- 기본 대표님 계정 추가
INSERT INTO approved_users (username, password, role, name, approved_at, approved_by)
VALUES ('admin', 'admin123', 'ceo', '대표님', NOW(), 'system')
ON CONFLICT (username) DO NOTHING;
```

---

## 4. API 키 확인

### 4-1. 프로젝트 설정 열기
1. 왼쪽 메뉴에서 **"Settings"** (톱니바퀴 아이콘) 클릭
2. **"API"** 메뉴 클릭

### 4-2. API 키 복사
다음 두 가지 키를 복사해서 메모장에 저장해두세요:

1. **Project URL** (예: `https://xxxxxxxxxxxxx.supabase.co`)
2. **anon public** 키 (긴 문자열)

⚠️ **중요**: 이 키들은 나중에 코드에 사용합니다!

---

## 5. 코드에 연동하기

### 5-1. Supabase 라이브러리 추가
`index.html` 파일에 Supabase 라이브러리를 추가합니다.

### 5-2. Supabase 초기화 파일 생성
`js/supabase.js` 파일을 생성합니다.

### 5-3. 기존 코드 수정
데이터 저장/불러오기 함수들을 Supabase를 사용하도록 수정합니다.

---

## 다음 단계
위 단계를 완료하신 후, 코드 연동 작업을 진행하겠습니다.
코드 연동은 제가 도와드리겠습니다!





