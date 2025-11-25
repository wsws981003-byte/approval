-- 기본 대표님 계정 추가
INSERT INTO approved_users (username, password, role, name, approved_at, approved_by)
VALUES ('admin', 'admin123', 'ceo', '대표님', NOW(), 'system')
ON CONFLICT (username) DO NOTHING;

