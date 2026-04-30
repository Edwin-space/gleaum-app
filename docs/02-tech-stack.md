# 02. 기술 스택

## 핵심 기술

| 레이어 | 기술 | 버전 | 용도 |
|--------|------|------|------|
| **프레임워크** | Next.js | 16.x (App Router) | 풀스택 웹앱 |
| **언어** | TypeScript | 5.x | 전체 코드베이스 |
| **스타일** | Tailwind CSS | 4.x | 유틸리티 CSS |
| **백엔드/DB** | Supabase | latest | PostgreSQL + Auth + Storage + Realtime |
| **인증** | Google OAuth 2.0 | — | 구글 로그인 전용 |
| **배포** | Vercel | Hobby | 자동 CI/CD |
| **버전관리** | GitHub | — | https://github.com/Edwin-space/gleaum-app |

---

## 주요 패키지

```json
{
  "@supabase/ssr": "최신",          // SSR 환경 Supabase 클라이언트
  "@supabase/supabase-js": "최신", // Supabase JS SDK
  "next": "16.x",
  "react": "19.x",
  "typescript": "5.x"
}
```

---

## Supabase 설정

| 항목 | 값 |
|------|-----|
| **프로젝트 ID** | `tyvjdsescukaeorcuaga` |
| **리전** | ap-northeast-1 (서울 근처) |
| **URL** | `https://tyvjdsescukaeorcuaga.supabase.co` |
| **환경변수** | Vercel에 자동 주입됨 (Supabase 연동) |

### 환경변수 목록

```env
# Vercel에 설정된 환경변수 (자동 주입)
NEXT_PUBLIC_SUPABASE_URL=https://tyvjdsescukaeorcuaga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 수동으로 추가한 변수
NEXT_PUBLIC_APP_URL=https://gleaum-app.vercel.app
```

---

## Google API 설정

| 항목 | 상태 |
|------|------|
| **Google Cloud 프로젝트** | 생성 완료 |
| **OAuth 2.0 클라이언트** | 설정 완료 |
| **Calendar API** | 활성화 필요 (Day 5) |
| **Drive API** | 활성화 필요 (Day 5) |
| **OAuth 스코프** | calendar, calendar.events, drive.file, drive.readonly |
| **테스트 사용자** | 운영자 계정 1명 등록 (앱 게시 전까지 필요) |

### OAuth 리다이렉트 URI (Google Cloud Console 등록 필수)
```
https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback
```

---

## 개발 환경

| 항목 | 내용 |
|------|------|
| **OS** | macOS |
| **프로젝트 경로** | `/Volumes/WD_BLACK/Ai Works/gleaum/` |
| **Node.js** | 18+ |
| **패키지 매니저** | npm |

### 개발 서버 실행
```bash
cd "/Volumes/WD_BLACK/Ai Works/gleaum"
npm run dev       # http://localhost:3000
npm run build     # 프로덕션 빌드 (배포 전 필수 확인)
```

---

## CI/CD 파이프라인

```
로컬 코드 수정
  → git push origin main
  → GitHub (https://github.com/Edwin-space/gleaum-app)
  → Vercel 자동 감지
  → 빌드 & 배포
  → https://gleaum-app.vercel.app (1~2분 후 반영)
```

---

## Tailwind CSS v4 주의사항

- `tailwind.config.js` 파일이 **없음** (v4는 CSS에서 직접 설정)
- 커스텀 테마는 `src/app/globals.css`의 `@theme {}` 블록에 정의
- 커스텀 CSS 클래스는 `globals.css`에 직접 작성 (`.shadow-card`, `.blob-1` 등)
