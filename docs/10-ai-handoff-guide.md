# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **디자인 시스템 준수** — 색상, 그림자, 반지름은 반드시 `DESIGN.md` + `src/styles/tokens.css`의 토큰(`var(--brand-blue)`, `var(--brand-gradient)` 등)을 사용. ⚠️ **Purple(`#5A32FA`)은 완전 폐기** → Brand Blue(`#0084CC`) / Teal(`#0CC9B5`) / Green(`#2EE895`) 사용.
4. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_family_group_id()` 기반 정책 추가.
5. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
6. **배포 자동화** — `main` 브랜치에 push하면 Vercel이 자동 배포. 작업 후 반드시 commit + push.
7. **AI 간 작업 동기화 (문서 업데이트 필수)** — 서로 다른 AI가 협업하므로, 본인의 작업이 에러 없이 완료되면 **반드시 `docs/` 폴더 내 관련 문서(완료된 기능 등)를 업데이트**하여 다른 AI가 최신 상태를 알 수 있게 할 것.
8. **디자인 일관성 절대 유지** — 작업된 디자인 결과물(특히 `DESIGN_PREVIEW.html` 및 `tokens.css` 기준)의 시각적 형태와 UX를 모든 페이지와 컴포넌트에서 완벽하게 일관성을 유지할 것.
9. **제품 모델 방향 유지** — 글리움은 가족 전용 앱이 아니라 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**입니다. 신규 기능은 개인 단독 사용을 기본값으로 두고, 필요할 때 Space / Category / Automation Policy 기준으로 확장 설계할 것.

---

## 현재 앱 상태 (2026-05-06 기준)

> **디자인 히스토리 요약**: Claude(세션1)가 Vibrant Purple(`#5A32FA`)로 구현 → Antigravity AI가 오리지널 브랜드 컬러(Blue/Teal/Green)로 복구 + Glassmorphism + 메쉬 그라디언트 + 프리미엄 폰트(`Outfit`+`Pretendard`) 추가 적용. **현재 코드는 Blue/Teal/Green 기반이며 보라색(`#5A32FA`)은 사용 금지.**
> **제품 방향 요약**: 초기 가족 관리 서비스에서 개인 중심 + Space 확장형 토털 서비스로 보정했습니다. 개인 구간이 기본이며, 친구/연인/가족 Space는 선택적 관계 확장 레이어입니다. `family_groups`는 단기적으로 유지하지만 신규 설계에서는 legacy shared Space로 해석합니다.
> **서비스 전략**: **모바일 우선 완성 후 PC WEB 확장** 방향으로 진행 중. `/login`, `/home`은 PC/모바일 분리 완료. 나머지 페이지는 `lg:` Tailwind 클래스로 PC 레이아웃이 이미 준비되어 있음 (코드 유지, 추후 활성화). 모바일 서비스를 먼저 완전히 완성한 뒤 PC WEB 작업 진행 예정.

### ✅ 작동하는 기능

| 기능 | 경로/파일 | 상태 |
|------|----------|------|
| Google OAuth 로그인 | `/login` → `/auth/callback` | ✅ 완전 작동 |
| 첫 로그인 시 프로필 자동 생성 | `auth/callback/route.ts` | ✅ 완전 작동 |
| 가족 그룹 자동 생성 | `auth/callback/route.ts` | ✅ 완전 작동 |
| 초대 링크 페이지 | `/invite/[code]` | ✅ 완전 구현 |
| 홈 대시보드 | `/home` | ✅ 실 DB 연동 |
| 일정 목록/검색/필터 | `/schedules` | ✅ 실 DB 연동 |
| 일정 생성 | `/schedules/new` | ✅ DB 저장 |
| 일정 상세/상태변경/삭제 | `/schedules/[id]` | ✅ 실 DB 연동 |
| 자녀 일정 대시보드 | `/schedules/children` | ✅ 실 DB 연동 |
| 가족 관리 + 초대코드 | `/family` | ✅ 실 DB 연동 |
| 가계부 (정기지출) | `/budget` | ✅ 실 DB 연동 |
| 마이페이지 + 로그아웃 | `/mypage` | ✅ 실 DB 연동 |
| 알림 목록 | `/notifications` | ✅ 실 DB 연동 |
| FCM 푸시 알림 토큰 등록 | `useFCM`, `FCMProvider` | ✅ 구현 완료 |
| 일정 리마인더 자동 발송 | Supabase `pg_cron` + `pg_net` → `/api/cron/reminders` | ✅ 등록/실행 확인 완료 |
| 개인화 온보딩 | `/onboarding`, `completeOnboarding()` | ✅ 단계형 1차 구현 완료 |
| 홈 개인화 카드 | `/home` | ✅ 온보딩 preferences 기반 1차 반영 |
| Glassmorphism + Blue/Teal/Green 디자인 | **전 페이지 (DESIGN.md 기준)** | ✅ 프리미엄 리뉴얼 완료 |
| 자동화 정책 엔진 | `/api/cron/automations` + pg_cron | ✅ time_window/completion/payment 처리 |
| PC/모바일 뷰 분리 | `/login`, `/home` | ✅ useIsDesktop() 기반 분기 |
| PC 랜딩페이지 | `DesktopLanding.tsx` | ✅ SaaS 스타일 풀페이지 |
| 모바일 홈 리디자인 | `MobileHome.tsx` | ✅ 시간 인사+접이식 캘린더+퀵액션 |
| Vercel 프로덕션 배포 | gleaum-app.vercel.app | ✅ 자동 배포 중 |
| 적응형(Adaptive) UI | `DesktopSidebar`, `MobileHome` 등 | ✅ PC/모바일 대응 완료 |

### ❌ 미구현 기능 (우선순위 순)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| Google Calendar 양방향 동기화 | 🟡 중요 | Calendar API 활성화 필요 |
| Google Drive 사진 첨부 | 🟡 중요 | Drive API 활성화 필요 |
| 자동화 정책 기반 상태 전이 | 🔴 필수 | `completion_required`, `payment_due` 등 정책 기반 처리 필요 |
| Google OAuth 앱 게시 (프로덕션) | 🟢 선택 | 테스트 사용자 외 로그인 불가 |

---

## 다음 작업 순서 (추천)

> [!IMPORTANT]
> **🚨 사용자 필수 수행 대기 작업 (2026년 5월 4일 일괄 처리 예정)**
> 다음 작업을 요청받을 시, 반드시 사용자가 아래 수동 작업을 완료했는지 먼저 확인(학습)하세요. 이 수동 작업들이 완료되지 않았다면 기능이 정상적으로 동작하지 않습니다.
> 1. **[인증]**: Supabase Dashboard -> Auth -> Redirect URLs에 `https://gleaum-app.vercel.app/auth/callback` 추가 여부 확인
> 2. **[구글 캘린더 연동]**: Google Cloud Console에서 `Google Calendar API` 활성화
> 3. **[구글 캘린더 연동]**: Supabase SQL Editor에서 `ALTER TABLE schedules ADD COLUMN google_event_id text;` 실행
> 4. **[푸시 알림 연동]**: Firebase 프로젝트 생성 및 FCM 서버 키 발급
> 5. **[푸시 알림 연동]**: Vercel에 Firebase 관련 환경변수(`NEXT_PUBLIC_FIREBASE_*`) 등록

> ✅ 1단계(초대 링크)와 2단계(전 페이지 디자인 리뉴얼)는 완료됨.
> ✅ 3단계(Google Calendar 연동) 코드 작업 완료됨. (수동 설정만 남음)
> ✅ 4단계(FCM 푸시 알림 + Supabase Cron 리마인더)는 완료됨. Supabase `pg_net` 실행 결과까지 확인 완료.
> ✅ 5단계(자동화 정책 엔진) 완료됨. `automation_policy` 기반 `time_window/completion_required/payment_due` 처리 + FCM 알림.
> ✅ 6단계(PC/모바일 뷰 분리 + 랜딩 + 홈 리디자인) 완료됨. `/login`, `/home` 분리 완료.
> ✅ 개인화 온보딩 1차 구현 및 운영 DB SQL 적용 완료. 로그인 후 온보딩 미완료 사용자는 `/onboarding`으로 이동.
> ✅ **7단계(모바일 서비스 완성)**: 일정 상태변경 UX 완성(shared/personal 포함), 파일 첨부 실제 업로드 구현, PWA manifest 완성, docs 업데이트.
> 🔜 **8단계: PC WEB 전체 뷰 활성화** — 모바일 완성 후 진행. `/schedules`, `/budget`, `/family` 등에 이미 `lg:` 클래스 코드가 준비되어 있음. `DesktopHome`, `MobileHome` 패턴을 나머지 페이지에 적용.

### 1단계 ✅: 초대 링크 페이지 — 완료
### 2단계 ✅: 전 페이지 디자인 리뉴얼 — 완료
### 3단계 ✅: Google Calendar 연동 (코드 완료)
### 4단계 ✅: FCM 푸시 알림 + Supabase Cron 리마인더 — 완료

### 5단계: 자동화 정책 기반 상태 전이 (🔴 필수)

- `src/app/api/cron/automations/route.ts` — 5분마다 실행되는 자동화 엔진
- `time_window`: 시간 도래 시 pending → in_progress, 종료 시 → completed
- `completion_required`: 시작 시 pending → in_progress, 종료 후 미완료 → missed + FCM
- `payment_due`: 결제일 도래 시 pending → in_progress, 초과 시 → missed + FCM
- Supabase `pg_cron` `gleaum-automations` 잡 등록 완료 (5분 간격, `net.http_post`)
- `src/lib/db.ts`: `inferCategory`, `inferVisibility`, `inferAutomationPolicy` 헬퍼로 type→policy 자동 매핑

### 6단계 ✅: PC/모바일 뷰 분리 + 랜딩페이지 + 모바일 홈 리디자인 — 완료

- `src/hooks/useMediaQuery.ts` — `useIsDesktop()` 훅 (1024px 기준)
- `/login`: `MobileLogin` / `DesktopLanding` 분기
- `/home`: `MobileHome` / `DesktopHome` 분기
- `src/components/landing/DesktopLanding.tsx` — SaaS 풀페이지 랜딩 (인라인 스타일)
- `src/app/home/MobileHome.tsx` — 모던 모바일 홈 (시간 인사 + 접이식 캘린더 + 퀵 액션)

### 7단계: 서브 페이지 PC/모바일 뷰 분리 (🔴 필수, 다음 작업)

나머지 모든 서브 페이지를 동일 패턴으로 분리해야 합니다. 상세 계획은 `docs/08-features-pending.md`의 "서브 페이지 PC/모바일 뷰 분리 계획" 섹션 참조.

---

## 프로젝트 파일 구조 요약

```
핵심 파일 3개만 알면 됨:

1. src/lib/db.ts          ← 모든 DB 쿼리 (여기서 시작)
2. src/types/index.ts     ← 모든 TypeScript 타입
3. src/styles/tokens.css  ← 모든 디자인 토큰
```

---

## 작업 전 확인 체크리스트

```bash
# 1. 현재 코드 상태 확인
git log --oneline -5

# 2. 환경변수 확인
cat .env.local

# 3. 로컬 빌드 테스트
npm run build

# 4. 개발 서버 실행
npm run dev
```
