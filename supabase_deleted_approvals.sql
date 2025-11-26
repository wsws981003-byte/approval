-- 삭제된 결재 테이블 생성
-- 기존 Supabase 프로젝트에 이 테이블이 없는 경우 실행하세요.

CREATE TABLE IF NOT EXISTS deleted_approvals (
    id BIGINT PRIMARY KEY,
    approval_number TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_by TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_deleted_approvals_deleted_at ON deleted_approvals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_approvals_deleted_by ON deleted_approvals(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_approvals_author ON deleted_approvals(author);
CREATE INDEX IF NOT EXISTS idx_deleted_approvals_status ON deleted_approvals(status);

