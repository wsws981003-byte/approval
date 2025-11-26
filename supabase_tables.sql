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
    attachment_data TEXT,
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

-- 인덱스 생성
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_author ON approvals(author);
CREATE INDEX idx_approvals_created_at ON approvals(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);





