# 05. 배포 환경 및 환경변수 (Deployment)

---

## Vercel 배포 정보

| 항목 | 값 |
|------|----|
| 플랫폼 | Vercel |
| 연결 레포지토리 | `https://github.com/Edwin-space/gleaum-app` |
| Root Directory | `backoffice` |
| 배포 브랜치 | `main` |
| 빌드 명령어 | `npm run build` (자동 감지) |
| Node.js 버전 | 20.x (권장) |

---

## 환경변수 설정 위치

- **로컬 개발**: `backoffice/.env.local` (`.gitignore`에 의해 깃에 올라가지 않음)
- **Vercel 운영**: Vercel 프로젝트 → Settings → Environment Variables

---

## 환경변수 목록

```env
# ✅ 필수 — Supabase (기존 사용자 앱과 동일한 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...    # 서버 사이드 전용, 절대 클라이언트에 노출 금지

# ⏳ Phase 5 이후 필요 — Firebase Admin (CRM 푸시 발송)
FIREBASE_SERVICE_ACCOUNT_BASE64=     # Firebase 서비스 계정 JSON을 base64 인코딩한 값

# ⏳ Phase 5 이후 필요 — Google Analytics (대시보드 실시간 통계)
GA_CLIENT_EMAIL=
GA_PRIVATE_KEY=
GA_PROPERTY_ID=
```

---

## 로컬 개발 서버 실행

```bash
cd /Users/edwin/Documents/GitHub/gleaum-app/backoffice
npm install        # 최초 1회 실행
npm run dev        # http://localhost:3001 에서 확인
```

---

## 배포 파이프라인 (필수 준수)

```
변경 작업 완료
    ↓
로컬: npm run build  (Exit code: 0 반드시 확인)
    ↓ 실패 시 로컬에서 원인 분석 및 수정 반복
    ↓ 성공 시
git add [변경된 파일들]
git commit -m "feat/fix: 작업 내용 요약"
git push origin main
    ↓
Vercel 자동 배포 시작 (대시보드에서 확인)
    ↓ 실패 시 Vercel 로그 확인 → 로컬에서 재현 후 수정
    ↓ 성공 시
배포 완료
```

---

## 주의사항

- `backoffice/` 폴더 내에서만 작업. 루트의 `src/`, `package.json` 등 절대 수정 금지
- `next.config.ts`의 `ignoreDuringBuilds: true` 설정은 ESLint 충돌 방지용. 임의로 제거하지 말 것
- `supabase.ts`의 URL 유효성 검사 로직(`!envUrl.startsWith("http")`) 임의로 제거하지 말 것 — 환경변수 미입력 시 빌드 에러 방지 코드
