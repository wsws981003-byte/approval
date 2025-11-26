# 전자결재 시스템 - React 버전

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:
```
VITE_SUPABASE_URL=https://aemuzqrmzlyaxypmgurf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Q6youNlccsFOM5ldWzPviw_LojP9mFp
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Auth/          # 인증 관련
│   ├── Dashboard/     # 대시보드
│   ├── Approvals/     # 결재 관리
│   ├── Sites/         # 현장 관리
│   ├── Users/         # 사용자 관리
│   └── Layout/        # 레이아웃
├── context/           # Context API (전역 상태)
├── services/          # 데이터 서비스
├── lib/               # 라이브러리 설정
├── utils/             # 유틸리티 함수
└── App.jsx            # 메인 앱 컴포넌트
```

## 🔧 주요 변경사항

### 기존 HTML/JS → React
- ✅ 컴포넌트 기반 구조
- ✅ Context API로 전역 상태 관리
- ✅ React Router로 라우팅
- ✅ Vite 빌드 도구 사용

### Supabase 설정
- 환경 변수로 관리 (보안 강화)
- GitHub Secrets에 저장 필요

## 📦 배포

### GitHub Pages 자동 배포
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 Secrets 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. GitHub Pages 설정:
   - Settings → Pages → Source: GitHub Actions
4. `main` 브랜치에 푸시하면 자동 배포

## ⚠️ 주의사항

- 일부 컴포넌트는 아직 구현 중입니다 (스켈레톤 코드)
- 기존 기능을 점진적으로 React로 마이그레이션 중입니다
- 기존 `js/` 폴더의 파일들은 참고용으로 유지됩니다


