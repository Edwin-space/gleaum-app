# 08. 미완료 / 예정 기능

## 우선순위 기준

| 기호 | 의미 |
|------|------|
| 🔴 | 필수 (서비스 핵심 기능) |
| 🟡 | 중요 (사용성 크게 향상) |
| 🟢 | 선택 (있으면 좋음) |

---

## 현재 기술 부채

| 항목 | 내용 | 파일 |
|------|------|------|
| ~~`middleware.ts` 경고~~ | ✅ 해결 — `src/proxy.ts`로 파일명 변경 완료 | — |
| ~~Google Calendar 연동~~ | ✅ 제거 — 기기 캘린더 방식으로 전환 결정 | — |
| 이미지 첨부 미구현 | UI는 있으나 실제 업로드 로직 없음 | `src/app/schedules/new/page.tsx` |
| Google OAuth 앱 게시 | email+profile 스코프만 사용 → 간소화 검수 대상 (정식 출시 전 완료 필요) | Google Cloud Console |
| R8 난독화 미적용 | `minifyEnabled false` 상태 — 정식 출시 전 `true`로 변경 후 `mapping.txt` 업로드 필요 | `android/app/build.gradle` |
| iOS Associated Domains 비활성 | 무료 Apple Developer 계정 빌드를 위해 entitlement 제거됨. 유료 계정 전환 후 Universal Links 재활성화 필요 | `ios/App/App/App.entitlements` |

---

## 🔴 Google Play 정식 출시 전 필수 처리 사항

> 내부 테스트 버전 업로드 완료 (2026-05-14). 정식 출시 전 아래 항목 반드시 처리 필요.

| 항목 | 내용 |
|------|------|
| **R8 난독화 매핑 파일** | `minifyEnabled true` 변경 후 `mapping.txt` Play Console 업로드 |
| **네이티브 디버그 기호** | `.so` 심볼 파일 업로드 (크래시 스택트레이스 해독) |
| **스토어 등록정보** | 앱 설명(국문), 스크린샷(폰/태블릿), 기능 그래픽(1024×500) |
| **데이터 안전 섹션** | 수집 데이터 항목·목적 양식 작성 |
| **콘텐츠 등급** | IARC 등급 설문 완료 |
| **개인정보처리방침 URL** | `https://www.gleaum.com/legal/privacy` Play Console 등록 |
| **Firebase SHA-1 (릴리즈)** | `gleaum-release.keystore` SHA-1 → Firebase Console 등록 (Google 로그인 프로덕션용) |
| **iOS APNs** | Apple Developer Center APNs Auth Key 생성 → Firebase Console 업로드 |
| **iOS Xcode Capabilities** | Push Notifications + Background Modes 추가 |
| **Supabase Redirect URL** | `gleaum://auth/callback` 등록 |

### Android 권한 향후 복원 예정 (기능 추가 시)

> 현재 Play Console 경고 방지를 위해 제거됨. 해당 기능 개발 시 `AndroidManifest.xml`에 복원 필요.

| 권한 | 복원 이유 | 함께 필요한 작업 |
|------|-----------|----------------|
| `CAMERA` | 첨부파일 촬영, 프로필 사진 | `@capacitor/camera` 플러그인 |
| `READ_MEDIA_IMAGES` | 갤러리 이미지 첨부 | `@capacitor/camera` 플러그인 |
| `READ/WRITE_EXTERNAL_STORAGE` | 파일 첨부 저장 | Android 버전별 조건부 처리 |
| `USE_BIOMETRIC` / `USE_FINGERPRINT` | 앱 잠금, 민감 데이터 보호 | `@capacitor-community/biometric-auth` |

---

## 🔴 iOS 출시 전 필수 처리 사항

| 항목 | 내용 |
|------|------|
| **유료 Apple Developer Program** | Associated Domains, Push Notifications, TestFlight/App Store 배포를 위해 필요 |
| **Associated Domains 재활성화** | `applinks:www.gleaum.com` 또는 실제 운영 도메인 기준 entitlement 복구 |
| **APNs Auth Key** | Apple Developer Center에서 생성 후 Firebase Console 업로드 |
| **iOS Capabilities** | Push Notifications + Background Modes + Associated Domains 추가 |
| **Supabase Redirect URL** | `gleaum://auth/callback` 및 필요한 Universal Link redirect 등록 확인 |

---

## 🔴 기능 싱크 / 플랫폼 파리티

> 상세 기준표: `docs/15-feature-parity-matrix.md` 참조

현재 글리움은 PC Web / Mobile Web / Android App / iOS 예정 앱이 하나의 제품으로 운영되어야 한다. UI 모양은 달라도 기능 상태, 진입 경로, 데이터 경계, 권한 정책은 동일한 의미를 가져야 한다.

### 우선 점검 대상

| 우선순위 | 항목 | 내용 |
|---|---|---|
| 🔴 | 로그인/세션 복귀 | Android Google OAuth 후 앱 세션으로 정상 복귀하는지 배포 버전 회귀 테스트 |
| 🔴 | 초대 링크/코드 | 웹 링크, Android App Link, 커스텀 스킴에서 같은 초대 코드가 유효하게 처리되는지 검증 |
| 🔴 | 개인/공간 데이터 경계 | `015_harden_private_schedule_rls.sql` Supabase 실행 후 회귀 테스트 |
| 🟡 | 설정 항목 노출 | 테마, 생체인증, 알림, 캘린더, 홈 구성의 웹/앱 노출 정책 통일 |
| 🟡 | 준비 중 기능 표시 | Apple 로그인, iOS 앱, 기기 캘린더, 지도 API, 이미지 첨부 문구/비활성 상태 통일 |
| 🟡 | 운영/관리 경계 | 사용자 앱 `/admin/*`와 별도 백오피스 기능 역할 분리 |

## 웹 서비스 잔여 과제

### 🟡 통계 및 분석 페이지
- 월간 자녀 일정 완료율 차트
- 카테고리별 지출 트렌드 (월별 추이)
- 사용자 활동 요약 대시보드

### 🟡 1회성 일정 단건 외부 공유
- 특정 `scheduleId` 기반 읽기 전용 공개 뷰 (`/share/[scheduleId]`)
- 비로그인 게스트도 해당 일정 정보 열람 가능

### 🟡 Google Drive 사진 첨부
- Google Picker API 연동
- `schedule_attachments` 테이블 추가 필요
- Drive API 활성화 선행 필요

### 🟢 마이페이지 PC UI 최적화
- 프로필 수정 영역 PC 대시보드 구조화

### 🟢 Space 아키텍처 2단계 확장 (Phase 1·2 완료, Phase 3 대기)
- ✅ Phase 1 완료: `/space` 페이지, 공간 관리 UI, 초대/합류/권한 시스템
- ✅ Phase 2 완료: 역할(Admin/Editor/Viewer) UI 적용, visibility 보안 수정, 가계부 탭 분리
- Phase 3 미완: `family_groups.type` 추가 → 개인/연인/가족/모임 Space 구분
- Phase 3 미완: `schedule_assignees`, `schedule_observers`, `notification_rules` 테이블 설계

---

## 네이티브 앱 확장 계획

> 상세 계획서: `docs/14-native-app-plan.md` 참조

### Phase A — macOS 앱 (우선 진행) 🔴

**전략**: Capacitor.js로 현재 Next.js 웹을 macOS 네이티브 앱으로 래핑
**배포**: Mac App Store 및/또는 직접 배포 (.dmg)
**진행 상태**: 계획 수립 완료, 작업 대기 중

주요 작업 항목:
- [ ] `@capacitor/core` + `@capacitor/cli` 설치 및 프로젝트 초기화
- [ ] `capacitor.config.ts` 구성 (Bundle ID: `com.gleaum.app`)
- [ ] Next.js 정적 export 설정 (`output: 'export'`) 또는 local webserver 방식 결정
- [ ] Xcode 프로젝트 생성 및 Mac Catalyst 활성화
- [ ] 네이티브 스플래시 스크린 + 앱 아이콘 세트 구성
- [ ] APNs 푸시 알림 연동 (현재 FCM → APNs 브릿지)
- [ ] `@capacitor/local-notifications` 플러그인 연동
- [ ] `@capacitor/browser` 플러그인 (OAuth 플로우)
- [ ] macOS 창 크기/메뉴바 설정
- [ ] Apple Developer 계정 등록 및 프로비저닝 프로파일 설정
- [ ] Mac App Store 심사 제출

### Phase B — iOS / iPad 앱 🟡

**전략**: macOS Capacitor 설정 재활용 (동일 Xcode 프로젝트에서 iOS 타겟 추가)
**배포**: App Store

주요 추가 작업:
- [ ] iOS 타겟 추가 (iPad + iPhone 유니버설)
- [ ] `@capacitor/status-bar` 상태바 스타일 조정
- [ ] `@capacitor/keyboard` 키보드 이벤트 처리
- [ ] `@capacitor/haptics` 햅틱 피드백
- [ ] Face ID / Touch ID 인증 (`@capacitor-community/biometric-auth`)
- [ ] 네이티브 캘린더 동기화 (`@capacitor-community/native-market`)
- [ ] App Store 스크린샷 및 메타데이터 제출

### Phase C — Android 앱 🟢

**전략**: 동일 Capacitor 코드베이스에서 Android 타겟 추가
**배포**: Google Play Store

진행 상태:
- [x] Android 플랫폼 추가 및 Gradle/Kotlin 충돌 해결
- [x] Firebase FCM 네이티브 분기 처리 완료
- [x] Google Play Console 패키지명 인증 및 내부 테스트 AAB 업로드 완료
- [ ] 정식 출시 전 R8 매핑 파일, 네이티브 디버그 기호, 스토어 등록정보, 데이터 안전 섹션 작성

---

## 백오피스(Admin Backoffice) 잔여 과제

> 상세 내용은 `backoffice/docs/03-current-status.md` 참조

### 🔴 즉시 필요
- [ ] Vercel 환경변수 입력 (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] 관리자 인증 시스템 — 현재 URL 직접 접근 시 인증 없이 진입 가능

### 🟡 Phase 4 — 실데이터 연동
- [ ] 대시보드 KPI 실제 Supabase 데이터 연동
- [ ] 회원/공간 상세 페이지 (`/users/[id]`, `/spaces/[id]`)

### 🟡 Phase 5 — CRM 발송 API
- [ ] Firebase Admin SDK 앱/웹 푸시 발송
- [ ] 알리고(Aligo) SMS API 연동
- [ ] SendGrid 이메일 API 연동

### 🟢 Phase 6 — 광고 매니저 DB 연동
- [ ] 광고 전략 설정 DB 저장 (`app_settings` 테이블 생성)
- [ ] 배너 CRUD API 및 Supabase Storage 이미지 업로드

마지막 업데이트: 2026-06-02
