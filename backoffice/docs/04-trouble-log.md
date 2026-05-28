# 04. 트러블슈팅 기록 (Trouble Log)

---

## [2026-05-12] node_modules 깃허브 업로드 에러

**증상**: `git push` 시 `GH001: Large files detected` 에러 발생
```
File backoffice/node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node is 121.73 MB
```
**원인**: 백오피스 프로젝트 초기 설정 시 `backoffice/.gitignore` 파일을 생성하지 않아, `npm install` 후 생성된 `node_modules` 폴더가 깃 트래킹에 포함됨.

**해결**:
1. `backoffice/.gitignore` 생성하여 `node_modules`, `.next`, `.env.local` 제외 처리
2. 이전 커밋 취소(`git reset HEAD~1`) 후 재커밋

---

## [2026-05-12] Vercel 배포 빌드 에러 — Invalid supabaseUrl

**증상**: Vercel 배포 시 빌드 에러 발생
```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
[Error: Failed to collect page data for /users]
```

**원인**: 두 가지 원인이 복합적으로 작용
1. Vercel에 환경변수(`NEXT_PUBLIC_SUPABASE_URL`)를 아직 입력하지 않은 상태
2. `backoffice/.env.local`에 있는 템플릿 값이 유효하지 않은 문자열이라 Supabase 클라이언트가 즉시 에러를 던짐

**해결**: `backoffice/src/lib/supabase.ts`에 URL 유효성 검사 추가
```ts
let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!envUrl.startsWith("http")) {
  envUrl = "https://placeholder.supabase.co";
}
```

---

## [2026-05-12] Vercel 프로젝트 이중 등록 혼선

**증상**: Vercel 대시보드에 `gleaum`과 `gleaum-app` 두 개의 프로젝트가 존재
**원인**: 초기 세팅 시 테스트 목적으로 `gleaum` 프로젝트를 만들었다가 사용 중단.
**해결**: 미사용 `gleaum` 프로젝트 Vercel에서 삭제. 백오피스 전용 프로젝트를 `gleaum-app` 레포지토리 기반, Root Directory: `backoffice`로 신규 생성.

---

## [2026-05-12] 브라우저 에이전트 오작동 — 관리자 인증 설정 시도 중 30분 루프

**증상**: 백오피스 관리자 인증 설정을 브라우저 에이전트에게 위임했더니 500+ 스텝 이상 반복 루프에 빠짐.

**에이전트가 한 행동들**:
1. Supabase SQL 에디터에서 비밀번호 설정 SQL 시도 (실패 반복)
2. 메인 사용자 앱(`www.gleaum.com`)에 `devianne.tsyoo@gmail.com` 계정으로 실제 로그인 및 온보딩 완료 → **프로덕션 DB에 테스트 데이터 생성됨**
3. Supabase Storage에 `avatars` 버킷 의도치 않게 생성

**올바른 해결책**:
- 관리자 계정 생성은 **Supabase 대시보드 → Auth → Users → Create new user** (직접 클릭)
- 인증 로직은 코드(`proxy.ts` + `login/page.tsx`)로 구현. SQL 불필요.

---

## [2026-05-12] Vercel 배포 차단 — CVE-2025-66478 (Next.js 보안 취약점)

**증상**: 빌드는 성공(Exit 0)하지만 Vercel이 배포 자체를 차단
```
Vulnerable version of Next.js detected, please update immediately.
status ● Error
```

**원인**: Next.js 15.1.6에 CVE-2025-66478 보안 취약점이 존재. Vercel이 해당 버전 서비스를 강제 차단.

**해결**: `package.json`에서 Next.js 버전 업그레이드
```
"next": "15.1.6" → "next": "^16.2.6"
"eslint-config-next": "15.1.6" → "^16.2.6"
```

**부수 수정**: `next.config.ts`에서 Next.js 16에서 제거된 `eslint: { ignoreDuringBuilds: true }` 옵션 삭제

---

## [2026-05-12] Next.js 16 — middleware.ts → proxy.ts 네이밍 변경

**증상**: Vercel 배포 로그에 경고 발생
```
"middleware" file convention is deprecated. Please use "proxy" instead.
```

**원인**: Next.js 16에서 미들웨어 파일 컨벤션이 변경됨

**해결**:
- `src/middleware.ts` → `src/proxy.ts` 파일 이름 변경
- export 함수명 `middleware` → `proxy` 변경
- config matcher export 유지 (동일)

---

## [2026-05-12] SSR prerender 에러 — createBrowserClient 위치 문제

**증상**: 로그인 페이지 빌드 시 에러
```
@supabase/ssr: Your project's URL and API key are required to create a Supabase client
```

**원인**: `createBrowserClient(...)` 호출을 컴포넌트 최상위 레벨에 배치해서 SSR 사전 렌더링 시 환경변수 없이 실행됨

**해결**: `createBrowserClient(...)` 호출을 `handleLogin` 이벤트 핸들러 내부로 이동
```typescript
// ❌ 잘못된 위치 (컴포넌트 최상위)
const supabase = createBrowserClient(...)

// ✅ 올바른 위치 (이벤트 핸들러 내부)
const handleLogin = async () => {
  const supabase = createBrowserClient(...)
  ...
}
```

---

## [2026-05-12] 대시보드 정적 렌더링 문제 — Supabase 쿼리가 빌드 타임에 실행됨

**증상**: 배포 후 대시보드에 항상 "0"이 표시됨. Vercel 빌드 로그에서 경로가 `○ (Static)`으로 표시됨.

**원인**: Next.js App Router에서 `async` 서버 컴포넌트는 기본적으로 정적으로 렌더링됨. Supabase 쿼리가 빌드 타임에 한 번만 실행되고 캐싱됨.

**해결**: 해당 페이지들에 `export const dynamic = "force-dynamic"` 추가
- `src/app/page.tsx`
- `src/app/users/page.tsx`
- `src/app/spaces/page.tsx`

---

## [2026-05-12] 회원 관리 페이지 컬럼명 불일치

**증상**: 회원 관리 페이지에서 이름이 "이름 없음"으로 표시되고 온보딩 상태가 항상 "미완료"로 표시됨

**원인**: Supabase `profiles` 테이블의 실제 컬럼명과 코드에서 참조하는 컬럼명이 불일치
- `profile.full_name` → 실제 컬럼명: `profile.name`
- `profile.onboarding_completed` → 실제 컬럼명: `profile.onboarding_completed_at`

**해결**: `src/app/users/page.tsx`에서 컬럼명 수정
```typescript
const displayName = profile.display_name || profile.name || "이름 없음";
const doneOnboard = !!profile.onboarding_completed_at;
```

---

## [2026-05-12] GA4 서비스 계정 이메일 — GA4 UI에서 거부됨

**증상**: GA4 속성 액세스 관리에서 서비스 계정 이메일 추가 시 오류
```
이메일이 Google 계정과 일치하지 않습니다
```

**원인**: GA4 UI는 일반 Google 계정만 허용함. 서비스 계정(`xxx@xxx.iam.gserviceaccount.com`) 형식은 UI에서 추가 불가.

**해결**: GA4 Admin API를 직접 호출하여 프로그래밍 방식으로 서비스 계정에 접근 권한 부여
```bash
curl -s -X POST \
  "https://analyticsadmin.googleapis.com/v1alpha/properties/536593148/accessBindings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"user":"gleaum-backoffice@gleaum-firebase.iam.gserviceaccount.com","roles":["predefinedRoles/viewer"]}'
```

**참고**: API 엔드포인트 버전 주의
- `v1beta/properties/.../userLinks` → 404 (deprecated)
- `v1/properties/.../accessBindings` → 404 (잘못된 버전)
- `v1alpha/properties/.../accessBindings` → ✅ 정상 동작

---

## [2026-05-12] GA4 Admin API 인증 — application-default login 차단

**증상**: Google Cloud Shell에서 analytics 스코프 인증 시도 시 차단
```
gcloud auth application-default login --scopes=analytics.manage.users
→ "차단된 앱" 오류 (Google이 OAuth 앱 미승인)
```

**원인**: `analytics.manage.users` 스코프는 승인된 OAuth 앱만 사용 가능. gcloud CLI는 해당 스코프가 기본 허용 목록에 없음.

**해결**: OAuth Playground (https://developers.google.com/oauthplayground/) 사용
1. `https://www.googleapis.com/auth/analytics.manage.users` 스코프 입력
2. GA4 관리자 계정(`ts.yoo@gleaum.com`)으로 인증 (관리자 권한 필요)
3. Access token 발급 후 curl 명령어에 직접 사용

**주의**: GA4 속성에서 관리자(Administrator) 역할을 가진 계정으로 OAuth 인증해야 함. 뷰어/편집자 역할로는 403 에러 발생.

---

## [2026-05-13] GA4 Data API gRPC 번들링 에러 — Next.js serverExternalPackages 필요

**증상**: 배포 후 Vercel 함수 로그에서 에러
```
[GA4] 데이터 조회 실패: Error: undefined undefined: undefined
  code: undefined, details: undefined
  metadata: { internalRepr: Map(0) {}, opaqueData: Map(0) {} }
```

**원인**: `@google-analytics/data` 패키지는 gRPC 기반(`@grpc/grpc-js`)으로 동작함. Next.js가 해당 라이브러리를 번들링하는 과정에서 gRPC 클라이언트가 정상 초기화되지 않음.

**해결**: `next.config.ts`에 `serverExternalPackages` 설정 추가
```typescript
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@google-analytics/data", "@grpc/grpc-js", "google-auth-library"],
};
```

**원리**: 해당 패키지들을 Next.js 번들러 밖에서 Node.js 네이티브로 실행하도록 지정. gRPC 소켓 연결이 정상 동작하게 됨.

---

## 배포 파이프라인 원칙 (위 에러들을 통해 확립)

```
1. 로컬에서 npm run build → Exit code: 0 확인
2. 문제 발생 시 로컬에서 원인 분석 및 해결
3. 로컬 빌드 성공 확인 후에만 git commit
4. git push origin main → Vercel 자동 배포
5. Vercel 배포 에러 → 해당 커밋 로그 확인 → 로컬에서 재현 후 수정
6. Vercel 함수 로그(Logs 탭) — 런타임 에러 확인 필수
```

---

## [2026-05-14] Android AAB 빌드 — proguard-android.txt 미지원 에러

**증상**:
```
Build file '.../android/app/build.gradle' line: 29
`getDefaultProguardFile('proguard-android.txt')` is no longer supported
```

**원인**: Gradle 9.4.1에서 `proguard-android.txt` 파일 참조가 제거됨. R8 최적화를 막는 `-dontoptimize` 옵션이 포함되어 있어 지원 중단.

**해결**: `android/app/build.gradle`에서 파일명 변경
```groovy
// Before
proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
// After
proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
```

---

## [2026-05-14] Android AAB 빌드 — 키스토어 비밀번호 오류 (특수문자 쉘 해석)

**증상**:
```
Failed to read key gleaum from store "~/gleaum-release.keystore": keystore password was incorrect
```

**원인**: 비밀번호에 `$` 문자가 포함되어 있어 쉘이 `$12`를 변수(`$12`)로 해석. 큰따옴표(`"`) 사용 시 `$` 이후 문자열이 빈 값으로 치환되어 실제 비밀번호와 달라짐.

**해결**: 환경변수 전달 시 **작은따옴표(`'`)** 사용
```bash
# 오류 발생 (큰따옴표)
KEYSTORE_PASSWORD="Edwinyoo($12" ./gradlew bundleRelease

# 정상 동작 (작은따옴표)
KEYSTORE_PASSWORD='Edwinyoo($12' KEY_PASSWORD='Edwinyoo($12' ./gradlew bundleRelease
```

**원칙**: 쉘 특수문자(`$`, `` ` ``, `\`, `!`, `(`, `)`)가 포함된 비밀번호는 항상 작은따옴표로 감쌀 것.

---

## [2026-05-14] Google Play 패키지명 인증 — adi-registration.properties 토큰 불일치

**증상**:
```
업로드된 APK에 잘못된 토큰 파일이 있습니다.
```

**원인 1**: `echo` 명령어가 파일 끝에 개행문자(`\n`)를 추가해 토큰 값이 달라짐.

**원인 2**: 화면 스크린샷에서 토큰 값을 수동으로 읽어 입력 시 A 문자 1개 누락
- 잘못된 값: `DJ3DGQPVEK6CKAAAAAAAAAAAA` (25자)
- 실제 값: `DJ3DGQPVEK6CKAAAAAAAAAAAAA` (26자)

**해결**:
1. Play Console UI의 복사 버튼(📋)을 직접 클릭해 클립보드로 복사
2. `printf` (개행 없음) 사용으로 파일 생성
```bash
printf '토큰값' > android/app/src/main/assets/adi-registration.properties
```
3. Debug APK 재빌드 후 업로드 → 통과

**주의**: 소유권 인증 완료 후 `adi-registration.properties` 파일은 즉시 삭제할 것 (배포 APK/AAB에 포함 불필요).

---

## [2026-05-14] Android 터미널 빌드 — Java Runtime 미발견

**증상**:
```
The operation couldn't be completed. Unable to locate a Java Runtime.
```

**원인**: macOS 시스템 PATH에 Java가 설정되어 있지 않음. Android Studio는 자체 JDK를 번들링하고 있으나 터미널에서는 인식 안 됨.

**해결**: Android Studio 내장 JDK를 JAVA_HOME으로 지정 후 빌드
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew bundleRelease
```

---

## [2026-05-14] Android 미사용 권한으로 인한 Play Console 경고

**증상**: AAB 업로드 후
```
APK 또는 Android App Bundle에서 개인정보처리방침이 필요한 권한을 사용합니다(android.permission.CAMERA).
```

**원인**: `AndroidManifest.xml`에 선언된 CAMERA, BIOMETRIC 등 권한이 실제 서비스에서 미사용 상태임에도 민감 권한으로 분류되어 개인정보처리방침 연결을 요구함.

**해결**: 현재 미구현 기능에 해당하는 권한 일괄 제거
- 제거: `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `USE_BIOMETRIC`, `USE_FINGERPRINT`
- 유지: `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`, `c2dm.RECEIVE`

**향후**: 카메라/생체인증 기능 구현 시 해당 권한 복원 + Play Console 데이터 안전 섹션 업데이트 필요. (`docs/08-features-pending.md` 참조)

---

## [2026-05-28] Firebase App Distribution 백오피스 데이터 미표시

**증상**: Firebase Console에는 `internal-testers` 그룹과 테스터가 존재하지만, 백오피스 `/releases` 페이지에서는 릴리즈/테스터가 모두 비어 보임.

**원인**:
1. App Distribution REST API 경로에 `projects/{projectNumber}`가 필요하지만 기존 코드는 Firebase project id(`gleaum-firebase`)를 사용함.
2. 그룹 상세 조회 응답에는 테스터 목록이 포함되지 않는데, 기존 코드는 `groups.get?view=FULL`에서 `testers` 배열을 기대함.
3. Firebase API 실패 응답을 빈 배열로 처리해서 실제 오류가 관리자 화면에 노출되지 않음.

**해결**:
- `PROJECT_NUMBER`를 Android app id에서 파생하거나 `FIREBASE_PROJECT_NUMBER` 환경변수로 받을 수 있게 수정.
- 릴리즈/그룹/테스터 조회 경로를 `projects/{projectNumber}` 기준으로 변경.
- 테스터 목록은 `projects/{projectNumber}/testers`를 조회한 뒤 `tester.groups`에 대상 그룹이 포함된 항목만 필터링.
- Firebase API 오류를 숨기지 않고 상태 코드와 메시지를 백오피스 화면에 전달.
- `/releases` 페이지에 기능 설명 및 연결 대상 그룹 진단 UI 추가.

**검증**:
- 로컬 `npm run build` 통과.
- 실제 Firebase API 확인 결과: groups 1개(`internal-testers`, testerCount 1), testers 1명, releases 0개.
