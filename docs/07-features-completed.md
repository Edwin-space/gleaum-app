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

### 나머지 7개 페이지 디자인 리뉴얼 (Green/Teal/Blue 통일)
- [x] `/notifications` — 타입별 원형 컬러 아이콘, 미읽음 테두리 강조
- [x] `/mypage` — 그라디언트 프로필 히어로 카드, 아이콘 칩 설정 행
- [x] `/family` — 다크 헤더 → 그라디언트 카드, `joinFamilyByCode` 버그 수정
- [x] `/budget` — 그라디언트 요약 카드, 카테고리 아이콘 칩, 진행률 바
- [x] `/schedules/children` — SVG 원형 완료율 프로그레스, 탭, 스텝퍼+그림자
- [x] `/schedules/[id]` — 유형별 그라디언트 히어로 헤더, 둥근 카드(24px), 버튼
- [x] `/schedules/new` — 이모지 유형 칩, 포커스 테두리, 그라디언트 저장 버튼
- [x] `/schedules` — 오늘 요약 히어로 카드, 검색바/필터 칩 프리미엄 리뉴얼

---

## Day 6 — FCM 푸시 알림 + Supabase Cron 리마인더 (완료 - 2026-05-04)

- [x] Firebase Cloud Messaging 클라이언트 연동
- [x] 로그인 사용자 FCM 토큰 저장 (`profiles.fcm_token`)
- [x] FCM HTTP v1 서버 발송 구현 (`src/lib/fcm.ts`)
- [x] 수동 재알림 API (`/api/notifications/renotify`)
- [x] 일정 리마인더 크론 API (`/api/cron/reminders`)
- [x] Supabase `pg_cron` + `pg_net` 연동 완료

---

## 제품 모델 재정의 — 개인 중심 + Space 확장형 (완료 - 2026-05-04)

- [x] 개인 중심 + Space 확장형 토털 라이프 관리 서비스로 비전 재정의
- [x] `docs/12-product-model.md` 작성 및 적용
- [x] `schedule.type`을 Space / Category / Visibility / Automation Policy 축으로 분리 설계

---

## 개인화 온보딩 1차 (완료 - 2026-05-04)

- [x] `/onboarding` 단계형 플로우 구현
- [x] 시작 목적/관심사 기반 개인화 설정 저장
- [x] `profiles` 테이블 개인화 컬럼 확장 및 SQL 적용
- [x] 신규 사용자 기본 그룹 이름을 `"나의 공간"`으로 전환

---

## 프리미엄 UI/UX 리뉴얼 (완료 - 2026-05-06)

- [x] **Glassmorphism 도입**: `.glass-card` (반투명 유리 질감) 전면 적용
- [x] **Mesh Gradient 배경**: 애니메이션 기반 유동적인 메쉬 그라디언트 교체
- [x] **하이엔드 타이포그래피**: `Outfit` (영문) + `Pretendard` (국문) 조합 개편
- [x] **아이콘 시스템 정교화**: 정교한 SVG 라인 아이콘 통일
- [x] **모바일 전 페이지 디자인 통일**: Hero Gradient, Glow blobs, Sticky Header 패턴 전체 적용

---

## Sprint 2 + 적응형(Adaptive) UI 구현 (2026-05-04)

### 토스트(Toast) 시스템
- [x] `sonner` 라이브러리 기반 전역 토스트 시스템 구축
- [x] 기존 `alert()` 전체 토스트 대체 완료

### 캘린더 뷰 확장
- [x] 주간(타임라인) / 일간 뷰 추가 및 월간 뷰 연동
- [x] 현재 시간 표시 및 일정 블록 자동 배치 로직 강화

### 적응형(Adaptive) UI
- [x] `DesktopSidebar.tsx` 및 PC 전용 2컬럼/3컬럼 레이아웃 적용
- [x] 1024px 이상 환경에서 사이드바 자동 전환 및 그리드 최적화

---

## Day 9 — SEO 및 품질 안정화 (완료 - 2026-05-07)

- [x] **네이버 서치어드바이저 인증**: `src/app/layout.tsx`에 메타 태그 적용 및 기존 HTML 인증 파일 제거
- [x] **SEO 고도화**: Open Graph, Twitter Cards, robots, keywords 등 웹 표준 메타데이터 전체 적용
- [x] **일정 등록 페이지 오류 수정**: Space 아키텍처 전환에 따른 `useSpace` 훅 적용 및 API 시그니처 정합성 확보
- [x] **빌드 안정화**: Ref 타입 오류 및 미사용/삭제된 카테고리(`living`) 타입 수정 완료

---

## 앱 설치 및 접근성 (PWA) (완료)

- [x] **매니페스트 구성**: `public/manifest.json` 생성 (`standalone` 모드)
- [x] **서비스 워커**: `public/sw.js` 및 `PwaRegistry.tsx`를 통한 설치 지원
- [x] **아이콘**: Next.js `app/icon.tsx` 및 정적 아이콘 세트 구성 완료

---

## 인프라 및 인증 (완료)

- [x] **OAuth 도메인 리다이렉트 수정**: 실제 접속 도메인(`host`) 기반 리다이렉트 보장
- [x] **Supabase RLS 보안 정책** 강화
