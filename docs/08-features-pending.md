# 08. 미완료 / 예정 기능

## 우선순위 기준

| 기호 | 의미 |
|------|------|
| 🔴 | 필수 (서비스 핵심 기능) |
| 🟡 | 중요 (사용성 크게 향상) |
| 🟢 | 선택 (있으면 좋음) |

---

## Day 5 — Google 연동 심화

### ✅ 초대 링크 페이지 (`/invite/[code]`) — 완료
`src/app/invite/[code]/page.tsx` 구현 완료.
비로그인 → `/login?next=` 파라미터로 OAuth 후 자동 복귀 → `joinFamilyByCode()` 자동 처리.

### 🟡 Google Calendar 양방향 동기화
**사전 조건**: Google Cloud Console에서 Calendar API 활성화 필요

**구현 계획** (`src/lib/googleCalendar.ts` 신규 생성):
```typescript
// 글리움 → 구글 캘린더 내보내기
createGoogleEvent(token, schedule)
updateGoogleEvent(token, eventId, schedule)
deleteGoogleEvent(token, eventId)

// 구글 캘린더 → 글리움 가져오기
fetchGoogleEvents(token, calendarId, timeMin, timeMax)
```

**`schedules` 테이블에 `google_event_id` 컬럼 추가 필요**:
```sql
ALTER TABLE schedules ADD COLUMN google_event_id text;
```

### 🟡 Google Drive 사진 첨부
**사전 조건**: Google Cloud Console에서 Drive API 활성화 필요

**구현 계획**:
- Google Picker API 사용 (파일 선택 UI)
- 선택한 파일 → Supabase Storage 또는 Drive URL 저장
- `schedule_attachments` 테이블 추가 필요

---

## Day 6 — 푸시 알림

### 🔴 Firebase Cloud Messaging (FCM) 설정
**필요 작업**:
1. Firebase 프로젝트 생성
2. FCM 서버 키 발급
3. `public/firebase-messaging-sw.js` 서비스워커 생성
4. 환경변수 추가: `NEXT_PUBLIC_FIREBASE_*`

### 🔴 일정 알림 시스템
- 일정 생성 시 알림 예약 (Supabase Edge Function 또는 Vercel Cron)
- 설정된 `reminder` 분 전에 FCM 발송
- `notifications` 테이블에 기록

### 🟡 자녀 일정 미완료 재알림
- 일정 종료 시각 기준으로 `missed` 처리
- 부모에게 자동 재알림 발송

---

## Day 7 — 나머지 화면 디자인 리뉴얼

### ✅ 전 페이지 Vibrant Purple 리뉴얼 — 완료

모든 페이지에 `#5A32FA` 보라 브랜드 디자인 통일 적용됨:

| 페이지 | 완료 내용 |
|--------|----------|
| `/schedules/new` | 이모지 유형 칩, 보라 포커스 테두리, 그라디언트 저장 버튼 |
| `/schedules/[id]` | 유형별 그라디언트 히어로 헤더, 24px 둥근 카드, 보라 버튼 |
| `/schedules/children` | SVG 원형 완료율 프로그레스, 보라 탭/스텝퍼 |
| `/family` | 보라 그라디언트 히어로 카드 |
| `/budget` | 보라 그라디언트 요약 카드, 카테고리 아이콘 칩+진행률 바 |
| `/mypage` | 보라 그라디언트 프로필 히어로, 아이콘 칩 설정 행 |
| `/notifications` | 타입별 원형 아이콘, 미읽음 보라 배경/테두리 |

---

## Day 8 — 품질 및 완성도

### 🟡 PWA 완성
- [ ] `public/manifest.json` 아이콘 세트 추가
- [ ] 스플래시 스크린 설정
- [ ] 오프라인 대응 (Service Worker)

### 🟢 Google OAuth 앱 게시 (프로덕션)
- Google Cloud Console → OAuth 동의화면 → **앱 게시**
- 현재는 테스트 사용자만 로그인 가능
- 게시 후 누구나 로그인 가능

### 🟢 자녀 계정 연동
- 현재 자녀는 이메일 없이 프로필에만 존재
- 자녀가 직접 로그인할 수 있는 계정 연동 플로우 필요

### 🟢 일정 수정 기능
- `/schedules/[id]/edit` 페이지 미구현
- 현재는 삭제만 가능

### 🟢 통계 및 분석 페이지
- 월간 자녀 일정 완료율
- 카테고리별 지출 트렌드 차트

---

## 기술 부채

| 항목 | 내용 | 파일 |
|------|------|------|
| `middleware.ts` 경고 | "middleware" 파일명 deprecated → "proxy"로 변경 권장 | `src/middleware.ts` |
| 일정 수정 페이지 없음 | `/schedules/[id]`의 "수정" 버튼 미연결 | `src/app/schedules/[id]/page.tsx` |
| 재알림 기능 미구현 | UI는 있으나 실제 발송 로직 없음 | 전반 |
| 이미지 첨부 미구현 | UI는 있으나 실제 업로드 로직 없음 | `src/app/schedules/new/page.tsx` |
