# 13. GCP 계정 이관 가이드 (개인 계정 → 글리움 조직 계정)

> 작성일: 2026-05-07  
> 목적: 개인 GCP 계정에 연결된 Google OAuth, Firebase FCM, Google Calendar/Drive API를 글리움 전용 GCP 조직 계정으로 이관하는 전체 절차.  
> **이 문서를 순서대로 따르지 않으면 로그인 장애, 푸시 알림 중단이 발생합니다.**

---

## ⚠️ 이관 전 반드시 확인할 것

### 현재 구조 (개인 GCP 계정)

```
개인 GCP 계정
├── Google Cloud Project: (개인 프로젝트)
│   ├── OAuth 2.0 Client ID/Secret → Supabase에 등록됨
│   ├── Google Calendar API (활성화)
│   └── Google Drive API (활성화)
└── Firebase Project: gleaum-app-e8edf
    ├── Firebase Messaging (FCM)
    ├── Project ID: gleaum-app-e8edf  ← 코드에 하드코딩 ⚠️
    ├── Messaging Sender ID: 892011944168  ← SW에 하드코딩 ⚠️
    └── Service Account JSON → Vercel 환경변수
```

### 하드코딩된 값 위치 (코드 수정 필요)

아래 두 파일은 환경변수가 아닌 **소스코드에 직접 값이 박혀 있습니다**. 이관 시 반드시 코드도 수정해야 합니다.

| 파일 | 하드코딩된 값 | 수정 방법 |
|------|------------|---------|
| `src/lib/fcm.ts` line 8 | `'gleaum-app-e8edf'` (PROJECT_ID) | 환경변수로 교체 |
| `public/firebase-messaging-sw.js` | Firebase 전체 config 객체 | 빌드 시 주입 방식으로 교체 |

---

## 이관 범위 전체 목록

| 항목 | 현재 위치 | 이관 후 위치 | 영향 범위 |
|------|----------|------------|---------|
| Google OAuth Client ID/Secret | 개인 GCP | 글리움 GCP | 로그인 전체 |
| Google Calendar API 권한 | 개인 GCP | 글리움 GCP | 캘린더 동기화 |
| Google Drive API 권한 | 개인 GCP | 글리움 GCP | 파일 첨부 |
| Firebase 프로젝트 (FCM) | 개인 Firebase | 글리움 Firebase | 푸시 알림 전체 |
| Firebase Config 환경변수 | Vercel + .env.local | 동일 위치, 새 값 | - |
| Firebase Service Account | Vercel 환경변수 | 동일 위치, 새 값 | FCM 발송 |
| VAPID Key | Vercel 환경변수 | 동일 위치, 새 값 | 웹 푸시 |
| Supabase OAuth 설정 | Supabase Dashboard | 동일, 새 Client ID/Secret 입력 | - |

---

## STEP 1: 글리움 GCP 프로젝트 설정

### 1-1. Google Cloud Console 접속
https://console.cloud.google.com → 새 계정(글리움 조직 계정)으로 로그인

### 1-2. 새 프로젝트 생성 (이미 생성했다면 해당 프로젝트 선택)
```
프로젝트 이름: gleaum-prod
프로젝트 ID: gleaum-prod (또는 자동 생성된 ID)
조직: 글리움 조직 계정 선택
```

### 1-3. 필요한 API 활성화
Google Cloud Console → APIs & Services → Library에서 순서대로 활성화:

```
✅ Google Calendar API
✅ Google Drive API
✅ Identity and Access Management (IAM) API
✅ Firebase Management API (Firebase 사용 시 자동 활성화됨)
```

---

## STEP 2: OAuth 동의 화면 구성

### 2-1. OAuth consent screen 설정
Google Cloud Console → APIs & Services → OAuth consent screen

```
User Type: External (일반 사용자 대상)
앱 이름: 글리움 (Gleaum)
사용자 지원 이메일: 글리움 공식 이메일
앱 홈페이지: https://gleaum.com
앱 개인정보처리방침: https://gleaum.com/privacy (미구현 시 임시 사용)
앱 서비스 약관: https://gleaum.com/terms (미구현 시 임시 사용)
승인된 도메인: gleaum.com
개발자 연락처 이메일: 글리움 운영 이메일
```

### 2-2. OAuth 스코프 추가 (민감한 스코프 포함)
OAuth consent screen → Scopes 섹션 → ADD OR REMOVE SCOPES:

```
✅ .../auth/userinfo.email
✅ .../auth/userinfo.profile
✅ openid
✅ .../auth/calendar           ← 민감한 스코프
✅ .../auth/calendar.events    ← 민감한 스코프
✅ .../auth/drive.file         ← 민감한 스코프
✅ .../auth/drive.readonly     ← 민감한 스코프
```

> ⚠️ **민감한 스코프 사용 시 Google 앱 심사 필요**  
> 현재 "Testing" 상태에서는 테스트 사용자만 로그인 가능 (최대 100명).  
> 실 서비스 오픈 전 Google OAuth 심사 신청 필요 (소요 시간: 1-4주).

### 2-3. 테스트 사용자 추가
OAuth consent screen → Test users → ADD USERS:
```
운영자 이메일 주소 추가 (개발/테스트용)
```

---

## STEP 3: OAuth 2.0 클라이언트 ID 생성

### 3-1. 새 클라이언트 생성
Google Cloud Console → APIs & Services → Credentials → CREATE CREDENTIALS → OAuth client ID

```
애플리케이션 유형: Web application
이름: gleaum-web-client

승인된 JavaScript 원본:
  https://gleaum.com
  https://gleaum-app.vercel.app

승인된 리다이렉션 URI:
  https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback
```

> ⚠️ 리다이렉션 URI는 Supabase 프로젝트의 URL입니다. 변경하지 마세요.  
> (Supabase 프로젝트 ID: `tyvjdsescukaeorcuaga`)

### 3-2. 생성된 값 기록
```
Client ID:     (새로 생성된 값 복사)
Client Secret: (새로 생성된 값 복사)
```

---

## STEP 4: Supabase OAuth 설정 업데이트

### 4-1. Supabase Dashboard 접속
https://supabase.com/dashboard → 글리움 프로젝트 → Authentication → Providers → Google

### 4-2. 새 Client ID/Secret 입력
```
Client ID:     [STEP 3에서 복사한 값]
Client Secret: [STEP 3에서 복사한 값]
Authorized Redirect URL은 변경하지 않음
```

### 4-3. 저장 후 확인
- 로컬에서 구글 로그인 테스트 (기존 계정으로 재로그인 가능해야 함)

> ℹ️ 기존 사용자는 새 OAuth 클라이언트로 재로그인해도 Supabase 계정이 유지됩니다.  
> (Supabase는 이메일 주소 기반으로 계정을 연결합니다.)

---

## STEP 5: Firebase 프로젝트 이관

> ⚠️ **가장 복잡한 단계입니다.** 기존 FCM 토큰은 새 프로젝트로 이전 불가능합니다.  
> 이관 후 사용자들이 앱을 다시 방문하면 새 토큰이 자동 발급됩니다.

### 5-1. Firebase Console 접속
https://console.firebase.google.com → 글리움 조직 계정으로 로그인

### 5-2. 새 Firebase 프로젝트 생성
```
프로젝트 이름: gleaum
GCP 프로젝트 연결: STEP 1에서 생성한 gleaum-prod 선택
Google Analytics: 활성화 권장
```

### 5-3. 웹 앱 등록
Firebase → Project Overview → 앱 추가 → 웹(</>) 아이콘

```
앱 닉네임: gleaum-web
Firebase Hosting 설정: 체크 안 함 (Vercel 사용)
```

등록 후 **Firebase Config 값 전체 복사**:
```javascript
const firebaseConfig = {
  apiKey:            "새 값",
  authDomain:        "새 값.firebaseapp.com",
  projectId:         "새 값",
  storageBucket:     "새 값.appspot.com",
  messagingSenderId: "새 값",
  appId:             "새 값"
};
```

### 5-4. Cloud Messaging (FCM) 설정
Firebase → Project Settings → Cloud Messaging

**웹 푸시 인증서 생성:**
```
Cloud Messaging 탭 → Web configuration → Web Push certificates
→ Generate key pair
→ VAPID Key 복사 (Base64 문자열)
```

### 5-5. 서비스 계정 키 발급
Firebase → Project Settings → Service accounts → Firebase Admin SDK

```
언어: Node.js 선택
"Generate new private key" 클릭
JSON 파일 다운로드 (이 파일은 절대 Git에 커밋하지 마세요!)
```

**다운로드한 JSON을 base64로 인코딩:**
```bash
# macOS / Linux
cat firebase-service-account.json | base64 | tr -d '\n'
# 출력된 값을 FIREBASE_SERVICE_ACCOUNT_BASE64에 사용
```

---

## STEP 6: 코드 수정 (Antigravity가 놓친 부분)

### 6-1. `src/lib/fcm.ts` — PROJECT_ID 하드코딩 제거

**현재 코드 (문제):**
```typescript
const PROJECT_ID = 'gleaum-app-e8edf';  // ← 하드코딩
```

**수정 후:**
```typescript
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;  // ← 환경변수 참조
```

> 이 값은 `NEXT_PUBLIC_FIREBASE_PROJECT_ID`로 이미 .env.local에 있으므로 별도 추가 불필요.

### 6-2. `public/firebase-messaging-sw.js` — config 하드코딩 제거

서비스 워커(SW)는 Node.js 환경이 아니므로 `process.env`를 직접 사용할 수 없습니다.  
해결 방법: **빌드 시 환경변수를 주입하는 API 라우트 방식 사용**

**Step A**: SW 파일을 환경변수 없이 동적 URL 방식으로 변경

`public/firebase-messaging-sw.js` 수정:
```javascript
// 글리움 — Firebase Cloud Messaging Service Worker
// 빌드 시 주입 방식으로 환경변수 처리
// 앱이 백그라운드 or 닫혀있을 때 푸시 알림 수신 처리

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// SW는 process.env를 사용할 수 없으므로, 설정을 동적으로 가져옴
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 클라이언트(앱)에서 firebaseConfig를 전달받아 초기화
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title ?? '글리움';
      const body  = payload.notification?.body  ?? '';
      const url   = payload.data?.url ?? '/home';

      self.registration.showNotification(title, {
        body,
        icon:  '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data:  { url },
        vibrate: [200, 100, 200],
      });
    });
  }
});

// 알림 클릭 → 해당 URL로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
```

**Step B**: `src/lib/firebase.ts`에서 SW 등록 시 config 전달:
```typescript
// firebase.ts의 requestFCMToken 함수 내부, getToken 호출 직전에 추가:
const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
  scope: '/',
});

// ← 이 코드 추가: SW에 Firebase config 전달
if (registration.active || registration.installing) {
  const sw = registration.active ?? registration.installing;
  sw?.postMessage({
    type: 'FIREBASE_CONFIG',
    config: firebaseConfig,
  });
}

const token = await getToken(messaging, {
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
  serviceWorkerRegistration: registration,
});
```

> ⚠️ **임시 방편**: 서비스 워커에 postMessage로 전달하는 방식은 타이밍 이슈가 있을 수 있습니다.  
> 근본적 해결책은 `/api/firebase-sw-config` API 라우트를 만들어 SW가 fetch로 설정을 가져오는 방식이지만, 현재 단계에서는 위 방식으로 충분합니다.

---

## STEP 7: 환경변수 전면 업데이트

### 7-1. Vercel 환경변수 업데이트

Vercel Dashboard → gleaum-app 프로젝트 → Settings → Environment Variables

아래 변수들을 **새 Firebase 프로젝트의 값으로 전부 교체**:

| 변수명 | 새 값 출처 |
|--------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | STEP 5-3의 firebaseConfig.apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | STEP 5-3의 firebaseConfig.authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | STEP 5-3의 firebaseConfig.projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | STEP 5-3의 firebaseConfig.storageBucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | STEP 5-3의 firebaseConfig.messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | STEP 5-3의 firebaseConfig.appId |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | STEP 5-4의 VAPID Key |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | STEP 5-5의 base64 인코딩된 JSON |

> ⚠️ `NEXT_PUBLIC_*` 변수는 클라이언트(브라우저)에 노출됩니다. 민감한 정보가 없는 Firebase Config는 공개해도 무방합니다.  
> `FIREBASE_SERVICE_ACCOUNT_BASE64`는 서버에서만 사용되므로 `NEXT_PUBLIC_` 없는 변수입니다.

### 7-2. 로컬 `.env.local` 업데이트

`.env.local` 파일의 Firebase 관련 모든 값을 새 프로젝트 값으로 교체:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=새_값
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=새_값.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=새_프로젝트_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=새_값.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=새_값
NEXT_PUBLIC_FIREBASE_APP_ID=새_값
NEXT_PUBLIC_FIREBASE_VAPID_KEY=새_VAPID_키
FIREBASE_SERVICE_ACCOUNT_BASE64=새_base64_값
```

---

## STEP 8: 코드 변경 commit + 배포

코드 수정이 완료되면:

```bash
# STEP 6에서 수정한 파일들
git add src/lib/fcm.ts public/firebase-messaging-sw.js src/lib/firebase.ts
git commit -m "fix: GCP 계정 이관 - Firebase config 하드코딩 환경변수로 교체"
git push origin main
# → Vercel 자동 배포 트리거됨
```

---

## STEP 9: 이관 후 영향 및 대응

### FCM 토큰 무효화 문제

**발생 원인**: Firebase 프로젝트가 변경되면 기존 모든 FCM 토큰이 무효화됩니다.

**증상**: 이관 직후 푸시 알림이 모든 사용자에게 전송되지 않음.

**자동 복구 흐름**:
```
사용자가 앱 방문
  → src/components/FCMProvider.tsx가 마운트됨
  → requestFCMToken() 호출
  → 새 Firebase 프로젝트에서 새 FCM 토큰 발급
  → profiles 테이블의 fcm_token 컬럼 자동 업데이트
  → 이후 푸시 알림 정상 작동
```

**조치**: 이관 후 별도 작업 없음. 사용자가 앱을 한 번 방문하면 자동 복구됩니다.

### 기존 사용자 OAuth 세션

**상황**: Supabase의 Google OAuth Client ID/Secret 변경 시 기존 세션 처리.

**결과**: 기존 로그인 세션은 Supabase JWT 기반이므로 **즉시 만료되지 않습니다**.  
그러나 세션 갱신 시점(보통 1시간) 이후 재인증이 필요할 수 있습니다.

**권장**: 이관 공지 후 사용자에게 재로그인 안내 (자동으로도 처리됨).

### Google Calendar/Drive provider_token

**상황**: 캘린더/드라이브 API는 Supabase 로그인 시 발급받은 `provider_token` 사용.  
새 OAuth 앱으로 재로그인하면 새 token이 발급됩니다.

**조치**: 재로그인 유도 → 자동 처리됨.

---

## STEP 10: 이관 완료 확인 체크리스트

### 구글 로그인

- [ ] 기존 계정으로 구글 로그인 가능
- [ ] 신규 계정으로 구글 로그인 가능
- [ ] 로그인 후 `/home`으로 정상 리다이렉트

### FCM 푸시 알림

- [ ] 앱 방문 후 알림 권한 요청 팝업 표시됨
- [ ] `profiles` 테이블에 `fcm_token` 값이 새 프로젝트 형식으로 업데이트됨
- [ ] 테스트 알림 전송: `/api/notifications/send` POST 호출
- [ ] 백그라운드 알림 수신 확인

### 구글 캘린더

- [ ] `/settings/calendar`에서 연동됨 표시
- [ ] 일정 생성 시 구글 캘린더에 이벤트 생성됨
- [ ] 일정 삭제 시 구글 캘린더에서 이벤트 삭제됨

### Supabase Cron (Reminders)

- [ ] `/api/cron/reminders` 정상 호출됨 (CRON_SECRET은 그대로)
- [ ] 리마인더 5분 전 FCM 발송 확인

---

## 이관 시 작업 흐름 요약

```
1. 글리움 GCP 프로젝트 생성 (STEP 1)
   ↓
2. OAuth 동의 화면 구성 (STEP 2) — 스코프 심사 시작 (비동기 진행)
   ↓
3. OAuth Client ID/Secret 생성 (STEP 3)
   ↓
4. Supabase에 새 OAuth 정보 입력 (STEP 4)
   ↓ [여기서 구글 로그인 이관 완료]
5. 새 Firebase 프로젝트 생성 + Config/VAPID/ServiceAccount 준비 (STEP 5)
   ↓
6. 코드 수정: fcm.ts, firebase-messaging-sw.js, firebase.ts (STEP 6)
   ↓
7. Vercel 환경변수 + .env.local 업데이트 (STEP 7)
   ↓
8. git commit + push → Vercel 배포 (STEP 8)
   ↓ [여기서 FCM 이관 완료]
9. 이관 후 영향 모니터링 (STEP 9)
   ↓
10. 전체 체크리스트 확인 (STEP 10)
```

---

## Antigravity가 놓친 항목 (이 문서에서 보완된 내용)

| 누락 항목 | 위험도 | 이 문서에서 처리 |
|---------|--------|--------------|
| `src/lib/fcm.ts` PROJECT_ID 하드코딩 | 🔴 Critical | STEP 6-1에서 환경변수 교체 |
| `public/firebase-messaging-sw.js` config 하드코딩 | 🔴 Critical | STEP 6-2에서 동적 주입 방식으로 교체 |
| FCM 토큰 무효화 및 자동 복구 흐름 | 🟡 중요 | STEP 9에서 명시 |
| OAuth 동의 화면 스코프 심사 필요 | 🟡 중요 | STEP 2에서 경고 |
| SW에 Firebase config 전달 로직 추가 | 🔴 Critical | STEP 6-2 Step B에서 firebase.ts 수정 |
| 기존 사용자 세션/provider_token 처리 | 🟢 낮음 | STEP 9에서 명시 |
