# 07. 완료된 기능

## Day 1 — 프로젝트 기반 (완료)

- [x] Next.js 16 App Router + TypeScript + Tailwind CSS v4 프로젝트 생성
- [x] 디자인 토큰 시스템 (`src/styles/tokens.css`)
- [x] 공통 TypeScript 타입 정의 (`src/types/index.ts`)
- [x] Supabase 클라이언트 설정 (브라우저 + 서버)
- [x] GitHub 저장소 연결 (`Edwin-space/gleaum-app`)
- [x] Vercel 자동 배포 파이프라인 구성
- [x] Supabase-Vercel 연동 (환경변수 자동 주입)

---

## Day 2 — 전체 화면 UI (완료)

### 구현된 페이지
- [x] `/login` — 구글 로그인 페이지
- [x] `/home` — 홈 대시보드 (캘린더 + 일정 요약)
- [x] `/schedules` — 일정 전체 목록 (검색 + 필터)
- [x] `/schedules/new` — 새 일정 추가 폼
- [x] `/schedules/[id]` — 일정 상세 + 상태 변경 + 삭제
- [x] `/schedules/children` — 자녀 일정 대시보드
- [x] `/family` — 가족 구성원 관리
- [x] `/budget` — 가계부 (월별 정기지출)
- [x] `/mypage` — 마이페이지 + 설정
- [x] `/notifications` — 알림 목록
- [x] `/settings/calendar` — 캘린더 연동 설정 페이지

### 구현된 컴포넌트
- [x] `AppHeader` — 공통 헤더
- [x] `BottomNav` — 하단 네비게이션
- [x] `CalendarView` — 월간/주간/일간 캘린더
- [x] `ScheduleCard` — 일정 카드
- [x] `TypeBadge`, `StatusBadge` — 배지
- [x] `GleaumLogo`, `GleaumAppIcon` — SVG 로고

---

## Day 3 — 구글 로그인 + 배포 (완료)

- [x] Google OAuth 2.0 실제 연동
- [x] Supabase Auth Google Provider 설정
- [x] `/auth/callback` 서버 라우트 구현
- [x] 로그인 후 `/home` 리다이렉트
- [x] 미들웨어 인증 보호
- [x] Vercel 프로덕션 배포 (https://gleaum-app.vercel.app)
- [x] 실제 구글 계정으로 로그인 테스트 완료

---

## Day 4 — Supabase DB 실데이터 연동 (완료)

- [x] DB 스키마 생성 (`supabase/schema.sql`)
  - `family_groups`, `profiles`, `schedules`, `schedule_participants`, `notifications`
- [x] RLS 정책 설정 (가족 그룹 단위 보안)
- [x] 자동 트리거 (신규 사용자 프로필 자동 생성, updated_at 자동 갱신)
- [x] `src/lib/db.ts` — 모든 DB 쿼리 함수 구현
- [x] `useCurrentUser` 훅 — 실 로그인 사용자 프로필
- [x] `useFamily` 훅 — 가족 구성원 실 데이터
- [x] `useSchedules` 훅 — 일정 CRUD
- [x] 첫 로그인 시 프로필 + 가족 그룹 자동 생성
- [x] 모든 페이지에서 `sampleData` 제거 → 실 DB 연동
- [x] 일정 생성 시 실제 DB 저장
- [x] 일정 상태 변경 → 실 DB 업데이트
- [x] 일정 삭제 → 실 DB 삭제
- [x] 가족 초대 코드 생성 및 합류 기능

---

## 디자인 리뉴얼 (완료)

- [x] 브랜드 컬러 `#0084CC` → `#5A32FA` (Vibrant Purple)
- [x] 배경 블롭 그라디언트 3개 (노랑/청록/보라)
- [x] BottomNav → 플로팅 pill + 보라 FAB 중앙 돌출
- [x] ScheduleCard → 좌측 바 제거, 아이콘 원형 파스텔 배경
- [x] 홈 대시보드 → 인사 헤더 + pill 뷰 토글 + 원형 프로그레스 바
- [x] AppHeader → 반투명 블러
- [x] 애니메이션 추가 (`fadeInUp`, `slideUp`)
- [x] 로그인 페이지 전면 교체 (블롭 + 보라 버튼)
- [x] 그림자 시스템 (`shadow-card`, `shadow-fab`, `shadow-modal`)
- [x] DESIGN_HANDOFF_TO_CLAUDE.md 작성
- [x] DESIGN_PREVIEW.html 인터랙티브 프로토타입

---

---

## Day 5 — 초대 링크 + 전 페이지 디자인 리뉴얼 (완료)

### 초대 링크 페이지 (`/invite/[code]`)
- [x] `src/app/invite/[code]/page.tsx` 신규 생성
  - 비로그인 시 `/login?next=/invite/[code]` 리다이렉트
  - 로그인 시 `joinFamilyByCode()` 자동 호출
  - 성공 / 이미멤버 / 유효하지않은코드 3가지 상태 UI
  - 성공 후 2초 뒤 `/family`로 자동 이동
- [x] `src/middleware.ts` — `/invite` 공개 경로 추가
- [x] `src/hooks/useAuth.ts` — `signInWithGoogle(next?)` 파라미터 추가
- [x] `src/app/login/page.tsx` — `?next=` 파라미터 읽어서 OAuth에 전달 + 초대 배너 표시
- [x] `src/lib/db.ts` — `joinFamilyByCode` 반환 타입 강화 (`{ success, alreadyMember, familyName }`) + `getFamilyByCode` 추가

### 나머지 7개 페이지 디자인 리뉴얼 (Vibrant Purple 통일)
- [x] `/notifications` — 타입별 원형 컬러 아이콘, 미읽음 보라 배경/테두리 강조
- [x] `/mypage` — 보라 그라디언트 프로필 히어로 카드, 아이콘 칩 설정 행
- [x] `/family` — 다크 헤더 → 보라 그라디언트 카드, `joinFamilyByCode` 버그 수정
- [x] `/budget` — 보라 그라디언트 요약 카드, 카테고리 아이콘 칩, 진행률 바
- [x] `/schedules/children` — SVG 원형 완료율 프로그레스, 보라 탭, 보라 스텝퍼+그림자
- [x] `/schedules/[id]` — 유형별 그라디언트 히어로 헤더, 둥근 카드(24px), 보라 버튼
- [x] `/schedules/new` — 이모지 유형 칩, 포커스 보라 테두리, 그라디언트 저장 버튼

---

## 현재 앱 상태

- **배포 URL**: https://gleaum-app.vercel.app
- **로그인**: 구글 OAuth ✅
- **데이터**: 실 Supabase DB ✅
- **일정 CRUD**: 생성/조회/상태변경/삭제 ✅
- **가족 관리**: 그룹 생성, 초대코드 생성, 합류 ✅
- **초대 링크**: `/invite/[code]` 완전 작동 ✅
- **디자인**: 전 페이지 Glassmorphism + Blue/Teal 프리미엄 리뉴얼 완료 ✅

---

## Day 6 — FCM 푸시 알림 + Supabase Cron 리마인더 (완료 - 2026-05-04)

- [x] Firebase Cloud Messaging 클라이언트 연동
  - `public/firebase-messaging-sw.js`
  - `src/lib/firebase.ts`
  - `src/hooks/useFCM.ts`
  - `src/components/FCMProvider.tsx`
- [x] 로그인 사용자 FCM 토큰 저장
  - `profiles.fcm_token` 컬럼 사용
  - `src/lib/db.ts` `saveFCMToken()` 구현
- [x] FCM HTTP v1 서버 발송 구현
  - `src/lib/fcm.ts`
  - `FIREBASE_SERVICE_ACCOUNT_BASE64` 환경변수 사용
- [x] 수동 재알림 API 구현
  - `src/app/api/notifications/renotify/route.ts`
- [x] 일정 리마인더 크론 API 구현
  - `src/app/api/cron/reminders/route.ts`
  - `CRON_SECRET` Bearer 인증 적용
- [x] Vercel Hobby 플랜 Cron 제한 대응
  - `vercel.json`의 Vercel Cron 설정 제거
  - Supabase `pg_cron` + `pg_net`으로 5분마다 Vercel API 호출
- [x] Supabase SQL Editor에서 `pg_net` 호출 결과 확인 및 실행 완료

---

## 제품 모델 재정의 — 개인 중심 + Space 확장형 방향 (완료 - 2026-05-04)

- [x] 초기 가족 관리 서비스 방향을 개인 중심 + Space 확장형 토털 라이프 관리 서비스로 재정의
- [x] `docs/12-product-model.md` 신규 작성
- [x] `family_groups`를 단기적으로 legacy Space 테이블로 해석하는 방향 정리
- [x] `schedule.type`에 섞여 있던 개념을 Space / Category / Visibility / Automation Policy 축으로 분리
- [x] 자녀 일정 자동 상태 전이를 `child` 전용이 아닌 `completion_required` 정책의 한 사례로 재정의
- [x] 다음 자동화 구현 기준을 `/api/cron/automations` 또는 정책 기반 통합 cron으로 정리

---

## 개인화 온보딩 1차 (완료 - 2026-05-04)

- [x] `/onboarding` 페이지 신규 생성
  - 한 화면 입력형에서 단계형 플로우로 분리
  - 앱 표시 이름/닉네임 설정
  - 실명 표시 선택 옵션
  - 시작 목적 선택: 개인 일정, 루틴, 자금, 연인, 친구/모임, 가족
  - 홈 화면 우선순위 선택
  - Space 시작 의도 선택
  - 기본 알림 설정
- [x] `profiles` 개인화 컬럼 설계 및 SQL 추가
  - `display_name`, `real_name`, `name_display_mode`
  - `onboarding_completed_at`, `timezone`, `locale`
  - `preferences`, `notification_settings`
- [x] 운영 Supabase DB에 `supabase/onboarding-personalization.sql` 적용 완료 및 컬럼 확인
- [x] `src/lib/db.ts`에 `completeOnboarding()` 추가
- [x] 로그인 콜백에서 온보딩 미완료 사용자는 `/onboarding`으로 분기
- [x] 홈 화면에 온보딩 기반 개인화 카드 1차 반영
- [x] 신규 사용자 기본 그룹 이름을 `"X씨 가족"`에서 `"나의 공간"`으로 전환

---

## 오리지널 브랜드 일관성 통합 (완료)

- [x] **브랜드 컬러 롤백**: `#5A32FA` (Vibrant Purple) → 오리지널 `gleaum_design_system.html` 기반 Green/Teal/Blue (`#0084CC`, `#0CC9B5`, `#2EE895`)로 100% 복구 완료
- [x] **로고 적용**: `AppHeader` 및 홈 화면 최상단에 `GleaumLogo` SVG 다이아몬드 로고 및 "나, 그리고 연인/가족의 일상 네트워크" 슬로건 적용 완료
- [x] **UI/UX 구조 유지**: 피그마의 둥근 카드 (`radius: 24px`), 블롭(Blob) 배경, 모던 그림자 효과 등 형태적 구조는 유지하되 컬러만 브랜드 오리지널 컬러로 완벽 치환
- [x] `BottomNav` FAB 버튼 및 아이콘 컬러 → Brand Blue 및 Brand Gradient로 치환
- [x] **빌드 테스트 통과**: 타입 및 린트 오류 없이 `npm run build` 통과 확인

---

## 프리미엄 UI/UX 리뉴얼 (완료 - 2026-04-30)

- [x] **Glassmorphism 도입**: 모든 UI 요소에 `.glass-card` (반투명 유리 질감) 클래스 적용
- [x] **Mesh Gradient 배경**: 정적인 배경을 애니메이션 기반의 유동적인 메쉬 그라디언트로 전면 교체
- [x] **하이엔드 타이포그래피**: `Outfit` (영문) + `Pretendard` (국문) 조합으로 서체 시스템 전면 개편
- [x] **아이콘 시스템 정교화**: 조잡한 이모지를 제거하고 정교한 SVG 라인 아이콘으로 통일
- [x] **로그인 페이지 리디자인**: 압도적이고 세련된 첫인상을 위한 글래스모피즘 로그인 뷰 구현
- [x] **전체 페이지 디자인 통일**: 홈, 가계부, 가족, 마이페이지, 알림 등 모든 서비스 페이지에 프리미엄 디자인 언어 적용 완료

---

## Sprint 2 + 적응형(Adaptive) UI 구현 (2026-05-04)

### 토스트(Toast) 시스템
- [x] `sonner` 라이브러리 설치 + `Toaster` 전역 레이아웃 적용
- [x] `src/lib/toast.ts` 공통 토스트 헬퍼 함수 (scheduleToast, profileToast, notifToast)
- [x] 기존 `alert()` 9곳 전체 토스트 대체 (schedule new/edit, mypage, schedule detail, children)

### 캘린더 뷰 확장
- [x] `CalendarView.tsx` 전면 리팩토링
- [x] **주간 뷰**: 7일 × 24시간 타임라인, 현재 시간 바(빨간 선), 일정 블록 자동 배치
- [x] **일간 뷰**: 전체 24시간 타임라인, 시작-종료 시간 표시 블록
- [x] 월간 / 주간 / 일간 뷰 전환 토글 (홈 화면 연결)

### 검색 확장
- [x] 검색 로직 확대: 기존 `title`만 검색 → `title + memo + location.address` 멀티필드, 대소문자 무시

### 폼 화면 및 일정 수정
- [x] `/schedules/[id]/edit` 주요 필드 전체 `updateSchedule` 매핑 완료

### 개인정보 페이지
- [x] 알림 토글 4종 → `profiles.notification_settings` 실제 저장/불러오기
- [x] 프로필 수정 바텀시트 (아바타 15종 + 이름 변경)
- [x] 회원탈퇴 확인 모달 + 로그아웃 처리

### 적응형(Adaptive) UI 기반 구축
- [x] `globals.css` 개편: 모바일(430px) vs PC(1024px+) 레이아웃 토큰 분리
- [x] `DesktopSidebar.tsx` 신규 생성: PC 전용 좌측 고정 네비게이션 바
- [x] `BottomNav` PC(lg) 환경에서 자동 숨김 (`lg:hidden`)

### 페이지별 PC 대시보드 최적화
- [x] **홈**: 2컬럼 그리드 (캘린더 + 요약 영역)
- [x] **일정**: PC 타이틀 + 새 일정 버튼 + 와이드 검색바 + 3컬럼 일정 그리드
- [x] **가계부**: 히어로 카드 확장 + 카테고리 통계 / 상세 내역 2컬럼 배치
- [x] **가족**: 멤버 3컬럼 그리드 + PC 중앙정렬 모달
