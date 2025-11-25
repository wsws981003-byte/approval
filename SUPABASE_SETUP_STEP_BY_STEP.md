# Supabase 연동 단계별 가이드 (초보자용)

## 🎯 목표
현재 localStorage에 저장되는 데이터를 Supabase(클라우드 데이터베이스)에 저장하도록 변경합니다.

---

## 📝 준비물
- 인터넷 연결
- 웹 브라우저 (Chrome, Edge 등)
- 메모장 (API 키 저장용)

---

## 1단계: Supabase 계정 만들기 (5분)

### 1-1. 웹사이트 접속
1. 브라우저 주소창에 입력: `https://supabase.com`
2. Enter 키 누르기

### 1-2. 로그인/회원가입
- **방법 1 (추천)**: "Continue with GitHub" 클릭 → GitHub 계정으로 로그인
- **방법 2**: 이메일 주소 입력 → "Send magic link" 클릭 → 이메일에서 링크 클릭

---

## 2단계: 프로젝트 만들기 (5분)

### 2-1. 새 프로젝트 시작
1. Supabase 대시보드에서 **"New Project"** 버튼 클릭

### 2-2. 프로젝트 정보 입력
다음과 같이 입력하세요:

```
Name: approval-system
Database Password: [강력한 비밀번호 입력 - 반드시 기록해두세요!]
Region: Northeast Asia (Seoul) 또는 가장 가까운 지역
Pricing Plan: Free
```

⚠️ **중요**: Database Password는 나중에 필요할 수 있으니 반드시 메모장에 저장해두세요!

### 2-3. 프로젝트 생성
1. **"Create new project"** 버튼 클릭
2. 1-2분 정도 대기 (프로젝트 생성 중...)

---

## 3단계: 데이터베이스 테이블 만들기 (10분)

### 3-1. SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭 (코드 아이콘)
2. **"New query"** 버튼 클릭

### 3-2. 첫 번째 SQL 실행
**방법 1: 파일 사용 (추천)**
1. 프로젝트 폴더에서 `supabase_tables.sql` 파일을 엽니다
2. 파일 내용을 **전체 선택** (Ctrl+A) 후 **복사** (Ctrl+C)
3. Supabase SQL Editor에 **붙여넣기** (Ctrl+V)
4. **"Run"** 버튼 클릭 (또는 Ctrl+Enter)
5. ✅ "Success. No rows returned" 메시지 확인

**방법 2: 직접 입력**
⚠️ 주의: 아래 코드를 복사할 때 ` ```sql ` 같은 마크다운 표시는 제외하고 SQL 코드만 복사하세요!

프로젝트 폴더의 `supabase_tables.sql` 파일 내용을 복사해서 SQL Editor에 붙여넣고 실행하세요.

### 3-3. 두 번째 SQL 실행
1. SQL Editor에서 **"New query"** 버튼 클릭
2. 프로젝트 폴더에서 `supabase_default_user.sql` 파일을 엽니다
3. 파일 내용을 **전체 복사**해서 SQL Editor에 붙여넣기
4. **"Run"** 버튼 클릭
5. ✅ "Success" 메시지 확인

---

## 4단계: API 키 확인하기 (3분)

### 4-1. 설정 메뉴 열기
1. 왼쪽 메뉴에서 **"Settings"** (톱니바퀴 아이콘) 클릭
2. **"API"** 메뉴 클릭

### 4-2. 키 복사하기
다음 두 가지를 메모장에 복사해서 저장:

1. **Project URL**
   - 위치: "Project URL" 섹션
   - 예시: `https://abcdefghijklmnop.supabase.co`
   - 전체 복사

2. **anon public** 키
   - 위치: "Project API keys" 섹션의 "anon public" 항목
   - 예시: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 전체 복사 (매우 긴 문자열)

⚠️ **중요**: 이 두 값을 안전하게 보관하세요!

---

## 5단계: 코드에 키 입력하기 (2분)

### 5-1. 파일 열기
프로젝트 폴더에서 `js/supabase.js` 파일을 엽니다.

### 5-2. 키 입력
파일의 4-5번째 줄을 찾아서:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

이 부분을 4단계에서 복사한 값으로 변경:

```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co'; // 4단계에서 복사한 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 4단계에서 복사한 anon public 키
```

### 5-3. 저장
파일을 저장합니다 (Ctrl+S)

---

## 6단계: 테스트하기 (2분)

### 6-1. 브라우저에서 실행
1. `index.html` 파일을 브라우저에서 엽니다
2. 개발자 도구 열기 (F12 키)
3. "Console" 탭 클릭

### 6-2. 확인 메시지
콘솔에 다음 중 하나가 표시되어야 합니다:
- ✅ `Supabase 연동 완료!` → 성공!
- ⚠️ `Supabase 설정이 완료되지 않았습니다. localStorage를 사용합니다.` → 5단계를 다시 확인하세요

---

## ✅ 완료!

이제 모든 데이터가 Supabase에 저장됩니다!

---

## 🔧 문제 해결

### 문제 1: "Supabase 설정이 완료되지 않았습니다"
- **해결**: `js/supabase.js` 파일에서 URL과 키가 제대로 입력되었는지 확인

### 문제 2: "Failed to fetch" 오류
- **해결**: Supabase 프로젝트가 정상적으로 생성되었는지 확인
- **해결**: 인터넷 연결 확인

### 문제 3: 테이블이 없다는 오류
- **해결**: 3단계의 SQL을 다시 실행

---

## 📞 도움이 필요하시면
각 단계를 완료한 후 알려주시면 다음 단계를 안내해드리겠습니다!

