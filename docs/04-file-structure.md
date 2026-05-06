# 04. 파일/폴더 구조

## 전체 구조

```
/Volumes/WD_BLACK/Ai Works/gleaum/
├── docs/                          # ← 지금 읽고 있는 문서
├── supabase/
│   └── schema.sql                 # DB 스키마 (Supabase SQL Editor에서 실행)
├── src/
│   ├── app/                       # Next.js App Router 페이지
│   │   ├── layout.tsx             # 루트 레이아웃 (블롭 배경 포함)
│   │   ├── globals.css            # 전역 스타일 + 블롭 + 애니메이션
│   │   ├── page.tsx               # / → /home 리다이렉트
│   │   ├── login/page.tsx         # 로그인 (구글 OAuth)
│   │   ├── home/page.tsx          # 홈 대시보드 (캘린더 + 일정 목록)
│   │   ├── schedules/
│   │   │   ├── page.tsx           # 일정 전체 목록 + 검색/필터
│   │   │   ├── new/page.tsx       # 새 일정 추가 폼 → DB 저장
│   │   │   ├── [id]/page.tsx      # 일정 상세 + 상태 변경 + 삭제
│   │   │   └── children/page.tsx  # 자녀 일정 대시보드
│   │   ├── family/page.tsx        # 가족 구성원 관리 + 초대
│   │   ├── budget/page.tsx        # 가계부 (정기지출 월별)
│   │   ├── mypage/page.tsx        # 마이페이지 + 설정 + 로그아웃
│   │   ├── notifications/page.tsx # 알림 목록
│   │   ├── settings/
│   │   │   └── calendar/page.tsx  # 구글 캘린더 연동 설정
│   │   └── auth/
│   │       └── callback/route.ts  # Google OAuth 콜백 처리 (서버)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx      # 공통 헤더 (뒤로가기, 알림, 타이틀)
│   │   │   ├── BottomNav.tsx      # 모바일 플로팅 하단 네비 + FAB
│   │   │   └── DesktopSidebar.tsx # PC 전용 좌측 사이드바 (1024px 이상)
│   │   ├── calendar/
│   │   │   └── CalendarView.tsx   # 월간/주간/일간 캘린더 컴포넌트
│   │   └── ui/
│   │       ├── Badge.tsx          # TypeBadge, StatusBadge
│   │       ├── Button.tsx         # 공통 버튼
│   │       ├── Card.tsx           # Card, ScheduleCard (아이콘 원형)
│   │       └── GleaumLogo.tsx     # GleaumLogo, GleaumAppIcon SVG
│   ├── hooks/
│   │   ├── useAuth.ts             # signInWithGoogle, signOut, getGoogleToken
│   │   ├── useCurrentUser.ts      # 현재 로그인 사용자 프로필 + familyGroupId
│   │   ├── useFamily.ts           # 가족 구성원 목록 조회
│   │   └── useSchedules.ts        # 일정 CRUD (create, updateStatus, remove)
│   ├── lib/
│   │   ├── db.ts                  # ⭐ 모든 Supabase DB 쿼리 함수 (단일 진입점)
│   │   ├── utils.ts               # 날짜/금액 포맷, 색상 유틸
│   │   └── supabase/
│   │       ├── client.ts          # 브라우저용 Supabase 클라이언트
│   │       └── server.ts          # 서버용 Supabase 클라이언트
│   ├── styles/
│   │   └── tokens.css             # 디자인 토큰 (컬러, 간격, 반지름)
│   ├── types/
│   │   └── index.ts               # 모든 TypeScript 타입 정의
│   └── middleware.ts              # 인증 미들웨어 (비로그인 → /login 리다이렉트)
├── DESIGN_HANDOFF_TO_CLAUDE.md   # 디자인 인수인계 문서
├── DESIGN_PREVIEW.html            # 인터랙티브 디자인 프로토타입
├── CLAUDE.md                      # Claude 전용 작업 가이드
├── next.config.ts
├── vercel.json                    # Vercel 배포 설정 (ICN1 리전)
└── package.json
```

---

## 핵심 파일 역할 설명

### `src/lib/db.ts` ⭐ 가장 중요
모든 Supabase DB 쿼리가 이 파일에 집중됩니다.
```typescript
// 주요 함수 목록
ensureUserSetup()          // 로그인 후 프로필 + 가족 그룹 자동 생성
getMyProfile()             // 현재 사용자 프로필
getFamilyWithMembers()     // 가족 그룹 + 멤버 목록
createFamilyGroup()        // 새 가족 그룹 생성
joinFamilyByCode()         // 초대코드로 가족 합류
getSchedules()             // 가족 일정 전체 조회
getScheduleById()          // 단일 일정 조회
createSchedule()           // 일정 생성
updateScheduleStatus()     // 일정 상태 변경
deleteSchedule()           // 일정 삭제
getNotifications()         // 알림 목록
markNotificationRead()     // 알림 읽음 처리
```

### `src/hooks/useCurrentUser.ts`
```typescript
const { user, profile, familyGroupId, loading, refresh } = useCurrentUser()
// user: User 타입 (id, name, email, avatar, role, familyGroupId)
// familyGroupId: string | null — 없으면 null (가족 미가입)
```

### `src/hooks/useSchedules.ts`
```typescript
const { schedules, loading, create, updateStatus, remove } = useSchedules(familyGroupId)
// familyGroupId가 null이면 빈 배열 반환 (자동 처리됨)
```

### `src/types/index.ts`
```typescript
// 핵심 타입들
type UserRole = 'parent' | 'child' | 'guest'
type ScheduleType = 'shared' | 'personal' | 'child' | 'expense'
type ScheduleStatus = 'pending' | 'in_progress' | 'completed' | 'missed'
type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
type ExpenseCategory = 'education' | 'housing' | 'utility' | 'insurance' | 'subscription' | 'other'
type PaymentMethod = 'auto' | 'card' | 'cash' | 'other'

interface Schedule { id, title, type, startTime, endTime, status, participants[], location?, reminder, repeat, memo?, amount?, expenseCategory?, paymentMethod?, familyGroupId, createdBy }
interface User { id, name, email, avatar?, role, familyGroupId? }
interface FamilyGroup { id, name, members[], inviteCode?, createdBy, createdAt }
interface Notification { id, userId, scheduleId?, title, body, type, read, createdAt }
```
