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

- [x] 오리지널 디자인 시스템 기반 Green/Teal/Blue 테마 전면 적용
- [x] 배경 블롭 그라디언트 3개 (Green/Teal/Blue)
- [x] BottomNav → 플로팅 pill + 보라 FAB 중앙 돌출
- [x] ScheduleCard → 좌측 바 제거, 아이콘 원형 파스텔 배경
- [x] 홈 대시보드 → 인사 헤더 + pill 뷰 토글 + 원형 프로그레스 바
- [x] AppHeader → 반투명 블러
- [x] 애니메이션 추가 (`fadeInUp`, `slideUp`)
- [x] 로그인 페이지 전면 교체 (블롭 + Brand Blue 버튼)
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

### 나머지 7개 페이지 디자인 리뉴얼 (Green/Teal/Blue 통일)
- [x] `/notifications` — 타입별 원형 컬러 아이콘, 미읽음 테두리 강조
- [x] `/mypage` — 그라디언트 프로필 히어로 카드, 아이콘 칩 설정 행
- [x] `/family` — 다크 헤더 → 그라디언트 카드, `joinFamilyByCode` 버그 수정
- [x] `/budget` — 그라디언트 요약 카드, 카테고리 아이콘 칩, 진행률 바
- [x] `/schedules/children` — SVG 원형 완료율 프로그레스, 탭, 스텝퍼+그림자
- [x] `/schedules/[id]` — 유형별 그라디언트 히어로 헤더, 둥근 카드(24px), 버튼
- [x] `/schedules/new` — 이모지 유형 칩, 포커스 테두리, 그라디언트 저장 버튼

---

## 현재 앱 상태

- **배포 URL**: https://gleaum-app.vercel.app
- **로그인**: 구글 OAuth ✅
- **데이터**: 실 Supabase DB ✅
- **일정 CRUD**: 생성/조회/상태변경/삭제 ✅
- **가족 관리**: 그룹 생성, 초대코드 생성, 합류 ✅
- **초대 링크**: `/invite/[code]` 완전 작동 ✅
- **디자인**: 전 페이지 Green/Teal/Blue (글래스모피즘) 통일 완료 ✅

---

## 오리지널 브랜드 일관성 통합 (완료)

- [x] **브랜드 컬러 롤백**: `#5A32FA` (Vibrant Purple) → 오리지널 `gleaum_design_system.html` 기반 Green/Teal/Blue (`#0084CC`, `#0CC9B5`, `#2EE895`)로 100% 복구 완료
- [x] **로고 적용**: `AppHeader` 및 홈 화면 최상단에 `GleaumLogo` SVG 다이아몬드 로고 및 "나, 그리고 연인/가족의 일상 네트워크" 슬로건 적용 완료
- [x] **UI/UX 구조 유지**: 피그마의 둥근 카드 (`radius: 24px`), 블롭(Blob) 배경, 모던 그림자 효과 등 형태적 구조는 유지하되 컬러만 브랜드 오리지널 컬러로 완벽 치환
- [x] `BottomNav` FAB 버튼 및 아이콘 컬러 → Brand Blue 및 Brand Gradient로 치환
- [x] **빌드 테스트 통과**: 타입 및 린트 오류 없이 `npm run build` 통과 확인

---

## 앱 설치 및 접근성 (PWA) (완료)

- [x] **매니페스트 구성**: `public/manifest.json` 생성 (`standalone` 모드 지원)
- [x] **동적 앱 로고**: `src/app/icon.tsx` 를 사용한 고화질 다이아몬드 로고 자동 생성
- [x] **오프라인/설치 지원**: `public/sw.js` (서비스 워커) 생성 및 `PwaRegistry.tsx`를 통한 글로벌 등록 완료
