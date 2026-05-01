# 08. 미완료 / 예정 기능

## 우선순위 기준

| 기호 | 의미 |
|------|------|
| 🔴 | 필수 (서비스 핵심 기능) |
| 🟡 | 중요 (사용성 크게 향상) |
| 🟢 | 선택 (있으면 좋음) |

---

## Day 5 — 확장된 캘린더 연동 및 공유

### ✅ 초대 링크 페이지 (`/invite/[code]`) — 완료 (그룹용)
`src/app/invite/[code]/page.tsx` 구현 완료.
비로그인 → `/login?next=` 파라미터로 OAuth 후 자동 복귀 → `joinFamilyByCode()` 자동 처리.

### 🟡 1회성 일정 단건 공유 (지인 초대용)
**목적**: 그룹(가족/연인)에 가입시키지 않고, 특정 일정(친구 모임 등) 단 1건만 외부 지인에게 공유
**구현 계획**:
- 특정 `scheduleId` 기반의 외부 공개용 읽기 전용 뷰 페이지 (`/share/[scheduleId]`) 생성
- 해당 링크를 받은 Guest 사용자는 로그인 없이(또는 간편 로그인 후) 해당 일정 정보만 열람 가능

### 🟡 Google Calendar 양방향 동기화 (완료/테스트 대기)
**사전 조건**: Google Cloud Console에서 Calendar API 활성화 필요
- `schedules` 테이블에 `google_event_id` 컬럼 추가 필요 (수동 작업 대기)
- `src/lib/googleCalendar.ts` 구현 완료

### 🔴 스마트폰 기본 캘린더(OS Native Calendar) 동기화
**목적**: 사용자의 iOS/Android 기기에 기본 내장된 캘린더 앱과 직접 연동
**구현 방안 (검토 필요)**:
1. 향후 Capacitor 또는 React Native로 패키징 시 모바일 기기 권한 획득 플러그인 연동
2. 웹 환경(PWA) 유지 시, `Web Share API` 또는 `.ics` 파일 포맷 제공을 통한 수동 캘린더 등록 지원
3. 사용자가 앱에서 일정을 등록하면 디바이스의 Native 캘린더에도 즉시 기록되도록 설계

### 🟡 Google Drive 사진 첨부
**사전 조건**: Google Cloud Console에서 Drive API 활성화 필요
- Google Picker API 사용 (파일 선택 UI)
- `schedule_attachments` 테이블 추가 필요

---

## Day 6 — 관계 유지 솔루션 & 푸시 알림

### 🔴 Firebase Cloud Messaging (FCM) 설정
**필요 작업**:
1. Firebase 프로젝트 생성 및 FCM 서버 키 발급
2. Vercel 환경변수 추가: `NEXT_PUBLIC_FIREBASE_*`

### 🔴 일정 상태 기반 실시간 알림
- 일정 생성/수정 시 실시간 알림 발송 (커뮤니케이션 오차 제로화)
- 설정된 `reminder` 시간 전 FCM 발송

### 🟡 자동 기념일/D-Day 리마인더 (관계 유지 특화)
- 연인의 기념일, 가족 생일 등 특정 이벤트를 앱이 자동으로 계산하여 N일 전에 미리 알려주는 기능 추가 (Care without asking)

---

## Day 7 — 나머지 화면 디자인 리뉴얼

### ✅ 전 페이지 Green/Teal/Blue 글래스모피즘 리뉴얼 — 완료
- 폐기된 보라색 테마를 완전히 걷어내고, 브랜드 아이덴티티에 맞는 신규 토큰 적용 완료
- `DESIGN_PREVIEW.html` 시연용 프로토타입에 8개 화면 적용 검증 완료

---

## Day 8 — 품질 및 완성도

### 🟡 PWA 완성
- [ ] `public/manifest.json` 아이콘 세트 추가
- [ ] 스플래시 스크린 설정
- [ ] 오프라인 대응 (Service Worker)

### 🟢 Google OAuth 앱 게시 (프로덕션)
- Google Cloud Console → OAuth 동의화면 → **앱 게시**
- 현재는 테스트 사용자만 로그인 가능

### 🟢 일정 수정 기능
- `/schedules/[id]/edit` 페이지 미구현
- 현재는 삭제만 가능

### 🟢 통계 및 분석 페이지 (관계 밀도 시각화)
- 특정 기간 동안 연인/가족과 함께 보낸 시간 통계 제공
- 카테고리별 지출 트렌드 차트

---

## 기술 부채

| 항목 | 내용 | 파일 |
|------|------|------|
| `middleware.ts` 경고 | "middleware" 파일명 deprecated → "proxy"로 변경 권장 | `src/middleware.ts` |
| 일정 수정 페이지 없음 | `/schedules/[id]`의 "수정" 버튼 미연결 | `src/app/schedules/[id]/page.tsx` |
| 재알림 기능 미구현 | UI는 있으나 실제 발송 로직 없음 | 전반 |
| 이미지 첨부 미구현 | UI는 있으나 실제 업로드 로직 없음 | `src/app/schedules/new/page.tsx` |
