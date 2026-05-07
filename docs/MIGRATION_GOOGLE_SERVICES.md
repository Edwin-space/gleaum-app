# Google 서비스 및 OAuth 계정 이전 가이드

이 문서는 개인 계정으로 설정된 GCP(Google Cloud Platform) 및 인증 설정을 글리움(Gleaum) 전용 신규 계정으로 안전하게 이전하기 위한 상세 가이드입니다.

---

## 1단계: Google Cloud Platform (GCP) 신규 설정

새로운 글리움 전용 계정으로 로그인한 뒤 진행합니다.

### 1.1. 새 프로젝트 생성
- [Google Cloud Console](https://console.cloud.google.com/) 접속
- **프로젝트 선택** -> **새 프로젝트** -> 프로젝트 이름: `Gleaum` (또는 `글리움`)

### 1.2. 필수 API 활성화
사용자가 앱 내에서 캘린더와 사진을 사용할 수 있도록 다음 API를 찾아 **[사용]** 버튼을 누릅니다.
- `Google Calendar API`
- `Google Drive API`

### 1.3. OAuth 동의 화면 (Consent Screen) 설정
- **내부/외부**: 실서비스용이므로 **[외부]** 선택
- **앱 정보**: 앱 이름(글리움), 사용자 지원 이메일, 로고 업로드
- **범위(Scopes) 추가**: 
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
  - `.../auth/calendar` (캘린더 읽기/쓰기)
  - `.../auth/drive.file` (파일 업로드/관리)

### 1.4. 사용자 인증 정보 (Credentials) 생성
- **[사용자 인증 정보 만들기]** -> **[OAuth 클라이언트 ID]** 선택
- **애플리케이션 유형**: `웹 애플리케이션`
- **이름**: `Gleaum Web Client`
- **승인된 자바스크립트 원본**:
  - `http://localhost:3000` (로컬 개발용)
  - `https://gleaum-app.vercel.app` (Vercel 배포용)
  - `https://gleaum.com` (실제 운영 도메인)
- **승인된 리디렉션 URI**: 
  - `https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback`
  > **주의**: 반드시 Supabase 프로젝트 설정(`Authentication -> Providers -> Google`)에 표시된 `Callback URL (for OAuth)`과 정확히 일치해야 합니다. (글리움은 Supabase를 통해 구글 인증을 중개하므로, 구글 설정에는 Supabase의 콜백 주소를 넣어야 합니다.)

---

## 2단계: Supabase 설정 업데이트

GCP에서 발급받은 **클라이언트 ID**와 **보안 비밀번호(Secret)**를 Supabase에 등록합니다.

- [Supabase Dashboard](https://supabase.com/dashboard/) -> 프로젝트 선택
- **Authentication** -> **Providers** -> **Google**
- **Client ID**: 신규 ID 입력
- **Client Secret**: 신규 Secret 입력
- **저장(Save)**

---

## 3단계: Firebase (FCM) 이전 (필요 시)

푸시 알림 계정도 신규 계정으로 통합할 경우 진행합니다.

- [Firebase Console](https://console.firebase.google.com/) 접속
- **프로젝트 추가** (GCP에서 만든 `Gleaum` 프로젝트 선택 가능)
- **앱 추가 (웹)** -> Firebase 설정값(apiKey, authDomain 등) 메모
- **클라우드 메시징(FCM)** -> 서버 키(V1) 확인

---

## 4단계: 환경변수 및 로컬 환경 업데이트

### 4.1. Vercel 환경변수 수정
- [Vercel Dashboard](https://vercel.com/) -> `gleaum-app` -> **Settings** -> **Environment Variables**
- 다음 항목들의 값을 새 계정의 값으로 수정:
  - `NEXT_PUBLIC_FIREBASE_API_KEY` 외 관련 변수 전체
  - `FIREBASE_SERVICE_ACCOUNT_BASE64` (새 계정의 서비스 계정 JSON 인코딩 값)

### 4.2. 로컬 `.env.local` 수정
- 로컬 개발 환경의 `.env.local` 파일도 동일하게 새 값으로 업데이트합니다.

---

## 5단계: 최종 테스트 및 검증

1. **로그아웃 후 재로그인**: 새로운 클라이언트 ID로 구글 로그인 창이 뜨는지 확인
2. **캘린더 연동 테스트**: 일정 생성 시 구글 캘린더에 정상 기록되는지 확인
3. **푸시 알림 테스트**: 알림이 정상적으로 수신되는지 확인

> [!CAUTION]
> 계정 이전 직후에는 기존 로그인 세션이 유효하지 않을 수 있으므로, 테스트 시 브라우저 캐시를 삭제하거나 시크릿 창에서 테스트하는 것을 권장합니다.
