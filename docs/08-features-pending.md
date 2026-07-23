# 08. 미완료 / 예정 기능

> 최종 업데이트: 2026-07-23
>
> **작업 상태의 단일 기준은 `docs/24-project-work-tracker.md`다.** 이 문서는 기능별 상세 후보와 배경을 보관한다. 현재 우선순위는 공간 수명주기 운영 마감 → 공통 코어 계약 확정 → Android → PC Web → Mobile Web 순의 3플랫폼 핵심 기능 파리티 → 통합 회귀다. Remote Config, Google Play 출시 절차와 iOS는 후순위다.

## 지금 바로 남은 작업

| 우선순위 | 작업 | 완료 기준 |
|---|---|---|
| 🔴 | 기존 공간 승격·삭제 운영 마감 | Preview/Production API 배포 후 Android/Web에서 가족 전환·안전 삭제·fallback을 실제 계정으로 검증 |
| 🔴 | 자녀 선택 이메일·토큰 연결 운영 회귀 | 운영 DB·Web 배포 완료. 보호자·자녀 실계정으로 이메일 제한 없음/있음, 승인/거절, 링크 재사용 차단 확인 |
| 🔴 | Android·PC Web·Mobile Web 3플랫폼 핵심 기능 파리티 | 공통 API·DB·권한 계약 확정 후 Android 기준 구현, PC Web, Mobile Web, 통합 회귀 순으로 마감 |
| 🔴 | 알림 설정 발송 경계 | 사용자의 일정·가계부 알림 선택을 Cron/FCM이 실제로 준수하도록 서버에서 강제 |
| 🟡 | 일정 첨부 완성 | 현재 로컬 미리보기를 Storage 업로드·일정 연결·삭제·RLS까지 완성 |
| 🟡 | Web 설정·기능 노출 정합화 | PC/Mobile에서 네이티브 전용·보류·준비 중 기능의 문구와 진입 정책 통일 |
| 🟡 | Android production build 기능 반영 | 위 공통 계약을 Compose에 연결하고 debug/release production build와 실기기 회귀 |
| 🔴 | Android 네이티브 Google 외부 설정 | Firebase/Google Cloud에 debug·release·Play App Signing SHA-1 등록, 최신 `google-services.json` 반영, 계정 선택·취소·재로그인 실기기 확인 |
| ⏸ | Remote Config 운영 안전장치 | 핵심 기능 파리티와 운영 회귀가 끝난 뒤 기존 초기화·백오피스 편집기를 실제 차단 계약에 연결 |
| ⏸ | Google Play 출시·iOS | 현재 기능 안정화와 Web/API 운영 반영이 끝난 뒤 재개 |

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
| R8 릴리즈 산출물 검증 | `minifyEnabled true` 적용 완료. 매 릴리즈에서 `mapping.txt`·native symbols 생성/업로드 확인 필요 | `android/app/build.gradle` |
| iOS Associated Domains 비활성 | 무료 Apple Developer 계정 빌드를 위해 entitlement 제거됨. 유료 계정 전환 후 Universal Links 재활성화 필요 | `ios/App/App/App.entitlements` |

---

## 🔴 Google Play 정식 출시 전 필수 처리 사항

> 내부 테스트 버전 업로드 완료 (2026-05-14). 정식 출시 전 아래 항목 반드시 처리 필요.

| 항목 | 내용 |
|------|------|
| **R8 난독화 매핑 파일** | `minifyEnabled true` 적용됨. 현재 릴리즈의 `mapping.txt` Play Console 업로드 확인 |
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
| 🟡 | 준비 중 기능 표시 | iOS 앱, 기기 캘린더, 지도 API, 이미지 첨부 문구/비활성 상태 통일 (애플·카카오 로그인은 2026-06-15 UI에서 제외) |
| 🟡 | 운영/관리 경계 | 사용자 앱 `/admin/*`와 별도 백오피스 기능 역할 분리 |

## 웹 서비스 잔여 과제

### 🔴 가족 공간 자녀 계정 후속 구현

> 기준 문서: `docs/21-family-child-account-foundation.md`

- [x] Supabase migration `020_family_child_foundation.sql`, `021_family_child_foundation_hardening.sql` 운영 적용
- [x] 초기 비용 최적화용 보호자 이메일 OTP 확인·항목별 동의·최종 승인 흐름
- [x] 운영 Supabase Auth의 Magic Link/OTP 제목·본문을 `supabase/email-templates/` 기준으로 적용
- [x] 보호자 휴대폰 직접 공유와 `/invite/child/[token]` 랜딩
- [x] 자녀 이메일 선택화와 Google/이메일 로그인 계정의 토큰 기반 claim
- [x] claim 단계의 후보 스냅샷 저장, 공간/연령 권한 생성 보류, 보호자 승인/거절
- [x] Android Google/이메일 로그인 완료 후 자녀 초대 경로 복귀
- [ ] 보호자·자녀 실계정 2개로 선택 이메일 없음/있음, 승인/거절, 토큰 재사용 차단 운영 회귀
- [ ] 서비스 볼륨 확대 시 SMS OTP/PASS/NICE/KCB 본인확인으로 전환
- [x] 공통 `/api/session/context`를 Web/Android 메뉴·광고·가계부·공간 권한에 적용
- [ ] iOS 메뉴·홈·광고 capability 동등화 (`IOS-005`)
- [x] Web·Android 자녀 전용 홈 적용
- [ ] 만 14세 본인 재동의 화면
- [ ] 일정 assignee/observer 및 자녀/보호자 전용 RLS
- [ ] 만 14세·19세 전환 알림과 일괄 Cron
- [ ] 수동 위치 체크인 MVP 및 별도 위치 동의

보호자 이메일 확인은 초기 운영용이다. 자녀 이메일은 필수 본인확인 수단이 아니라 선택적인 초대 계정 제한값이며 지속 권한은 `auth.users.id`로 판정한다. 활성 자녀 1,000명, 월 연결 500건, 관계 분쟁 1건, 위치/결제 도입 중 하나라도 발생하면 외부 본인확인으로 전환한다.

### 🟢 소셜 로그인 확장 (애플 / 카카오) — 보류
- **2026-06-15: 심사·연동 절차 부담으로 `/login` UI에서 버튼 제외(보류).** 아래는 추후 재도입 시 참고
- **애플**: 유료 Apple Developer Program + Services ID/Key(.p8)로 Client Secret(JWT) 생성 → Supabase Apple provider 설정. iOS 앱에 구글 로그인이 있으면 App Store 심사상 사실상 필수
- **카카오**: 카카오 개발자센터 앱 등록 + **비즈 인증(이메일 동의항목)** + Redirect URI(`<supabase>/auth/v1/callback`) → Supabase Kakao provider 설정. `handle_new_user` 트리거의 메타데이터 매핑(닉네임/이메일) 점검 필요
- 연동 시 개인정보처리방침 제1조(수집 항목)·제5조(위탁) 표에 해당 업체 추가

### 🟡 Supabase 이메일 인증 발송 설정 (이메일 회원가입 운영화)
- 코드는 완료(`signUpWithEmail` + `emailRedirectTo`). 실제 메일 발송은 대시보드 설정에 의존
- Authentication → Providers → Email → **"Confirm email" ON** 확인
- Authentication → URL Configuration → Redirect URLs에 `https://www.gleaum.com/auth/callback`, `gleaum://auth/callback` 등록
- 운영 트래픽 증가 시 **커스텀 SMTP(Resend/SendGrid) + 자체 도메인 발신**(`helper@gleaum.com`) 연결 권장 (기본 SMTP는 시간당 발송 한도 있음)

### ✅ 가계부 Phase 2 — 개인 원장 기반 수입/반복 처리 완료
- `ledger_entries`(migration `017_ledger_entries.sql`)를 개인 가계부의 기준 데이터로 사용한다. 수입·지출·순액·카테고리·예정/완료 상태를 하나의 원장에서 관리한다.
- Android/웹 가계부는 개인 공간(`scope='personal'`)만 읽으므로 공유 공간 지출이 개인 가계부에 섞이지 않는다.
- 정기 수입/지출은 월별/주별/연별 발생분을 `materializeRecurringLedger()`로 생성하고, 이번 달 항목은 `pending`으로 시작해 수령/결제 완료를 독립적으로 처리한다.
- Android 가계부는 수입/지출, 반복 예정, 현금 흐름, 카테고리별 지출 요약을 제공한다.

### 🟡 기기 캘린더 연동
- Android 구현 완료: 권한 요청, 대상 캘린더 선택, 앞으로 30일 수동 내보내기, 글리움 표식 일정의 생성/수정/삭제 자동 반영, 외부 기기 일정의 네이티브 미리보기·개인 일정 가져오기와 중복 제외.
- 가져오기는 선택한 기기 캘린더의 앞으로 30일 범위만 미리보기 후 실행한다. 글리움 표식 이벤트와 제목·시작 시각이 같은 개인 일정은 제외하며 공유 공간에는 생성하지 않는다.
- Android 남은 QA: 격리 테스트 일정으로 실제 가져오기 → 재조회 중복 제외, 자동 동기화 생성·수정·삭제 확인.
- 후속 작업: iOS EventKit 동등 구현, 반복 외부 일정의 원본 추적/양방향 동기화 여부에 대한 별도 제품 결정.

### 🟡 통계 및 분석 확장
- 완료: 가계부 월별 수입·지출·순액·저축률·고정/변동·정기/일회 현금 흐름·카테고리별 지출 요약.
- 보류: 가족/자녀 도메인 확정 후 자녀 일정 완료율 차트, 장기 월별 추이, 사용자 활동 대시보드.

### 🟡 1회성 일정 단건 외부 공유
- 특정 `scheduleId` 기반 읽기 전용 공개 뷰 (`/share/[scheduleId]`)
- 비로그인 게스트도 해당 일정 정보 열람 가능

### 🟡 Google Drive 사진 첨부
- Google Picker API 연동
- `schedule_attachments` 테이블 추가 필요
- Drive API 활성화 선행 필요

### 🟢 마이페이지 PC UI 최적화
- 프로필 수정 영역 PC 대시보드 구조화

### 🟢 Space 아키텍처 2단계 확장
- ✅ Phase 1 완료: `/space` 페이지, 공간 관리 UI, 초대/합류/권한 시스템
- ✅ Phase 2 완료: 역할(Admin/Editor/Viewer) UI 적용, visibility 보안 수정, 가계부 탭 분리
- ✅ Phase 3 기반: migration `020`의 `family_groups.space_type`으로 personal/general/family 구분
- Phase 3 미완: 기존 공간 생성·설정 UI의 space_type 전환 회귀 검증
- Phase 3 미완: `schedule_assignees`, `schedule_observers`, `notification_rules` 테이블 설계

---

## 네이티브 앱 확장 계획

> 상세 계획서: `docs/14-native-app-plan.md` 참조

### Phase A — macOS 앱 (Android 안정화 후)

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

### Phase B — iOS / iPad 앱 (Android 안정화 후 우선)

**전략**: macOS Capacitor 설정 재활용 (동일 Xcode 프로젝트에서 iOS 타겟 추가)
**배포**: App Store

주요 추가 작업:
- [ ] iOS 타겟 추가 (iPad + iPhone 유니버설)
- [ ] `@capacitor/status-bar` 상태바 스타일 조정
- [ ] `@capacitor/keyboard` 키보드 이벤트 처리
- [ ] `@capacitor/haptics` 햅틱 피드백
- [x] Face ID / Touch ID 인증 — 자체 Capacitor 브리지로 구현 완료
- [ ] 네이티브 캘린더 동기화 (`@capacitor-community/native-market`)
- [ ] App Store 스크린샷 및 메타데이터 제출

### Phase C — Android 앱 (현재 최우선)

**전략**: 동일 Capacitor 코드베이스에서 Android 타겟 추가
**배포**: Google Play Store

진행 상태:
- [x] Android 플랫폼 추가 및 Gradle/Kotlin 충돌 해결
- [x] Firebase FCM 네이티브 분기 처리 완료
- [x] Google Play Console 패키지 인증·테스트·프로덕션 배포 이력 확보
- [x] R8 `minifyEnabled true`, 네이티브 디버그 심볼 FULL 설정
- [x] 주요 사용자 화면 Compose Material 3 feature gate 활성화
- [ ] 실기기 light/dark/system·태블릿·접근성 최종 QA
- [ ] 현재 릴리즈 AAB의 mapping/native symbols 및 Firebase/AdFit 운영 검증

---

## 백오피스(Admin Backoffice) 잔여 과제

> 상세 내용은 `backoffice/docs/03-current-status.md` 참조

### 🔴 즉시 필요
- [ ] Vercel 운영 환경변수 재검증 (`SUPABASE_*`, 서버 전용 `ADMIN_EMAILS`) — 트래커 `OPS-001`
- [x] 관리자 인증 서버 강제 및 Service Role 경계 강화 — 2026-07-16 로컬 구현·검증 완료, 운영 배포 확인은 트래커 `OPS-003`

### 🟡 Phase 4 — 실데이터 연동
- [x] 대시보드 KPI 실제 Supabase 데이터 연동
- [x] 회원/공간 상세 페이지 (`/users/[id]`, `/spaces/[id]`)

### 🟡 Phase 5 — CRM 발송 API
- [x] Firebase Admin SDK 앱/웹 푸시 발송과 발송 이력
- [ ] 알리고(Aligo) SMS API 연동
- [ ] SendGrid 이메일 API 연동

### 🟢 Phase 6 — 광고 매니저 DB 연동
- [x] 광고 슬롯·배너 CRUD와 Supabase Storage 이미지 업로드
- [ ] 광고 성과 차트·상세 통계와 인앱 팝업 정책

마지막 업데이트: 2026-07-23
