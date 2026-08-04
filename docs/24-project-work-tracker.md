# 24. 프로젝트 통합 작업 트래커

> **단일 기준 문서(SSOT)**: 현재 무엇을 해야 하는지, 무엇이 진행 중인지, 무엇이 언제 어떤 근거로 완료됐는지는 이 문서를 기준으로 판단한다.
>
> 최초 작성: 2026-07-16
> 최종 업데이트: 2026-08-04
> 현재 iOS 재구축 기준점: `853c649`, Claude 혼합 WIP 보존 `b12e0f2` (`codex/archive-claude-wip-20260727`), 작업 브랜치 `codex/ios-rebuild-20260727`

## 1. 운영 규칙

### 상태 표기

| 표기 | 의미 | 필수 기록 |
|---|---|---|
| `⬜ 대기` | 아직 시작하지 않음 | 다음 행동 |
| `🟠 진행 중` | 실제 코드·설정·검증 작업 진행 중 | 시작일, 현재 작업 내용 |
| `🔴 차단` | 외부 권한·기기·의사결정이 없어 진행 불가 | 차단 사유, 해제 조건 |
| `⏸ 보류` | 지금은 하지 않기로 결정 | 보류 이유, 재개 조건 |
| `✅ 완료` | 완료 기준과 검증을 모두 충족 | 완료일, 검증 명령·운영 확인·관련 파일 |

### 갱신 절차

1. 모든 작업 시작 전에 `git log --oneline -5`, `git status -sb`와 이 문서의 **현재 실행 큐**를 확인한다.
2. 시작하는 작업의 상태를 `🟠 진행 중`으로 바꾸고 시작일을 기록한다.
3. 범위가 커지면 기존 ID 아래 세부 체크를 추가한다. 같은 일을 새 ID로 중복 등록하지 않는다.
4. 코드 작성만 끝난 상태는 완료가 아니다. 빌드·테스트·운영 확인 등 완료 기준을 충족한 뒤 `✅ 완료`와 완료일을 기록한다.
5. 외부 콘솔 작업은 실제 적용 결과를 확인하기 전까지 `⬜ 대기` 또는 `🔴 차단`으로 유지한다.
6. 작업 종료 시 이 문서의 작업 행과 **작업 일지**를 함께 갱신한다. 상세 설계가 변한 경우에만 연결된 도메인 문서도 갱신한다.
7. 완료 항목은 삭제하지 않는다. 현재 표가 길어지면 완료 기록 보관 섹션으로 이동하되 ID와 근거를 유지한다.

## 2. 현재 실행 큐

위에서부터 순서대로 처리한다. 2026-07-29 사용자 결정으로 **네이티브 앱 기능 제공을 유지하고 웹앱은 종료**한다. 현재 최우선 운영 축은 웹 종료 경계의 배포·회귀와 App Check 단계적 도입이며, iOS 출시 준비·Android 수동 회귀와 외부 콘솔 대기 항목은 별도 잔여 큐로 유지한다.

| 순서 | ID | 작업 | 상태 | 다음 행동 |
|---:|---|---|---|---|
| 1 | `AUTH-002` | Android/iOS Kakao 로그인·자녀 초대 identity | `🟠 네이티브 SDK 전환 진행 중` | Android/iOS Kakao SDK 앱 전환·ID token→Supabase 세션 교환·키 해시/URL scheme를 구현하고 빌드한 뒤 외부 Kakao/Supabase 설정과 운영 migration·실계정 회귀 |
| 2 | `WEB-014` | FAQ·Q&A 접수·백오피스 이메일 답변 | `🟠 DB·코드 검증 완료·SMTP 대기` | Production SMTP 환경변수 등록 후 공개 문의→관리자 답변→실메일 수신을 검증 |
| 3 | `WEB-015` | 실제 화면 기반 기능 안내·검색 최적화·웹 보안 보강 | `🟠 Production 완료·색인 관측 대기` | Google Search Console·Naver Search Advisor에서 sitemap 제출과 색인 상태를 관측 |
| 4 | `WEB-013` | `www` 대표 도메인·검색 인증·앱 링크 정합화 | `🟠 웹 배포 완료·앱 릴리스 대기` | Production의 HTML 태그·canonical·robots·sitemap·`www` assetlinks 직접 200까지 확인했다. 다음 Android/iOS 릴리스에 `www` 단일 연결 도메인을 포함하고 Play/App Store 딥링크 상태를 최종 확인 |
| 5 | `IOS-007` | Xcode·서명·capability·권한 기준선 | `✅ 완료` | 2026-07-29 유료 Team `JBN99YZ7KN`의 유효한 인증서·profile로 Debug 실기기 설치·실행, Push/Apple 로그인/Associated Domains entitlement와 Development 서명 Release Archive를 통과했다. App Store Distribution export/TestFlight는 `IOS-006`에서 진행 |
| 6 | `IOS-008` | 네이티브 인증·세션 마감 | `🟠 Production 2차 보정 완료·실계정 회귀 대기` | 최초 허용 정책 외 RESTRICTIVE capability 정책이 신규 계정 INSERT를 계속 차단한 2차 원인까지 운영 보정했다. Production `dpl_ARUQd7ftK9SfbZBTxSStuCrL8KKZ` 배포 완료. 신규 Apple·Google·이메일 전체 회귀 필요 |
| 7 | `IOS-009` | SwiftUI 단일 앱 셸·라우터·선조회 | `🟠 핵심 5탭 완료·실계정 회귀 대기` | SwiftUI 단일 root, 브랜드 전환·병렬 snapshot·시스템 5탭과 홈·일정·공간·가계부·전체 메뉴를 모두 네이티브 화면으로 연결했다. 다음은 실제 계정에서 탭별 상태 보존·딥링크·세션 만료 회귀 |
| 8 | `IOS-010` | 일정·공간·가계부·알림·전체 메뉴 네이티브화 | `✅ 완료` | 2026-07-28 전체 메뉴·프로필 수정·테마·Face ID/Touch ID 앱 잠금·비밀번호·탈퇴/복원·로그아웃을 Apple `NavigationStack`·`List`·`Form`으로 구현했다. 법적 원문만 전용 인앱 `WKWebView`를 유지하며 죽은 기능과 중복 탭 링크는 노출하지 않는다 |
| 9 | `IOS-005` | 가족·자녀 capability 동등화 | `🟠 코드 완료·실계정 회귀 대기` | 가족 관계·일반 가족/자녀 초대 분리와 보호자 등록→8자리 OTP→필수 동의→72시간 초대→자녀 claim→보호자 승인/거절을 SwiftUI로 구현했다. 다음은 보호자·자녀 실계정 2개 전체 회귀 |
| 10 | `IOS-002`~`IOS-004` | EventKit·APNs·Universal Links | `🟠 장기 일정 보정·EventKit 코드 완료` | 7일 종일/자정 통과 일정의 조회·표시·편집 보정은 빌드·단위 테스트 통과. 실제 iPhone 가져오기와 APNs·Universal Links를 검증 |
| 11 | `IOS-011` | iPhone·테마·접근성 QA | `🟠 핵심 화면·적응형 내비게이션 보정 완료·기기 회귀 대기` | 화면 모드 식별 색·양쪽 테마 미리보기와 5개 Large Title을 통일했다. iOS 18 이상은 5개 메뉴를 유지한 채 폭·높이·아이콘·레이블이 함께 전환되는 적응형 플로팅 탭 바를 사용한다. 다음은 실제 iPhone 손가락 제스처·소형/대형 iPhone, Reduce Motion·VoiceOver 실음성·오프라인/세션 회귀이며 iPad·Split View는 후순위 |
| 12 | `IOS-006` | TestFlight/App Store 출시 | `🟠 1.0 승인·1.0.1 빌드 4 준비` | 사용자 확인 기준 `1.0 (2)` 승인·배포 완료. `1.0.1` App Store 버전과 메타데이터를 생성했고 AdFit dSYM 경고를 제거한 빌드 4를 새로 Archive·Upload한 뒤 실기기 회귀 및 App Review 제출 |
| 13 | `IOS-014` | Kakao AdFit 앱 전환 광고·하단 UI 가림 보정 | `🟠 코드·스토어 고지 완료·실기기/새 빌드 대기` | AdFit `3.21.24` 앱 전환 광고와 ATT 구현, 공개 고지·신고 경로, App Privacy Publish, 연령등급 Advertising=Yes, 1.0.1 심사 노트 반영 완료. 공식 AdFit dSYM을 Archive에 포함하고 UUID 일치 검증 완료. 빌드 4 실기기 동의/거부·광고·닫기·오늘 그만 보기·자녀 미노출 회귀가 남음 |
| 14 | `FAM-011` / `FAM-013` | 보호자 필수 동의 운영 복구·Android 자녀 계정 연결 전체 회귀 | `🟠 운영 DB 복구 완료·양 플랫폼 실기기 재시도 대기` | iOS는 기존 실패 화면에서 동의 완료를 다시 실행하고, Android는 동일 API의 등록→OTP→동의→초대→claim→승인/거절 전체 회귀 |
| 15 | `AND-011` | Android Credential Manager Google 로그인 | `🟠 외부 설정 대기` | Firebase SHA-1·최신 `google-services.json` 반영 후 실제 계정 선택·취소·재로그인 검증 |

### 필수 운영 게이트 — 사용자 완료 확인 전 해제 금지

- `SEC-010` App Check는 **Android/iOS 클라이언트 토큰 적용 → 스토어 업데이트 배포 → Production `monitor` 관측 → `enforce` 전환**을 모두 완료해야 닫는다.
- 사용자가 직접 완료했다고 확인하기 전에는 `SEC-010`을 `✅ 완료`로 변경하지 않는다.
- 그 전까지 모든 배포·보안 검토·AI 인수인계에서 `App Check enforce 전환 미완료`를 필수 검증 사항으로 다시 알린다.
- 현재 Production은 `off` 유지 대상이다. 업데이트 제출 직후가 아니라 실제 배포·사용자 업데이트·정상 토큰 수신을 확인한 뒤 `monitor`, 이후 `enforce`로 전환한다.

### 2026-07-23 맥북 작업 대조 결과

| 범위 | 판정 | 확인 근거 | 남은 완료 조건 |
|---|---|---|---|
| 보안·DB·백오피스 경계 | 구현·운영 기록 완료 | `8b15af7`, 운영 migration·Advisor·백오피스 build 기록 | 비관리자 403·관리자 2xx 실제 세션은 `OPS-003` |
| 가족/자녀 기반·account capability | 구현 완료 | `ff43799`, `a30cf60`, `2176a5d`; capability 4/4·데이터 경계 9/9 | assignee/observer, 연령 전환, 약관 운영은 `FAM-003`~`FAM-005` |
| Android Material 3·캘린더·권한 | 코드·로컬 빌드 완료 | `da2384e`, `bf69e1e`, `5ad7ba0`; 맥미니 debug compile/unit/lint/assemble 성공 | 인증 이후 실기기·TalkBack·캘린더 CRUD는 `AND-001`, `AND-003`, `AND-005` |
| 공간 수명주기·일정 상세·알림 파리티 | 코드·자동 검증 완료 | `42b53b0`; root production build 54/54, 데이터 경계 9/9, 알림 설정 2/2 | Production 배포와 역할별 Web/Android 실제 계정 회귀 |
| PC/Mobile Web 마이페이지·설정 | 1차 구현·인증 회귀 완료 | 2026-07-17 동일 계정 홈·일정·알림·마이페이지·공간 확인 | 제한 계정·라이트/다크·키보드/터치 회귀 |
| Google Play 등록정보 | 카피·폰 이미지 제작 완료 | `564b923`; 1080×1920 RGB PNG 6장과 글자 수 검증 | 1024×500 기능 그래픽, Console 업로드·정책·서명 확인 |
| 작업 환경 동기화 | 완료 | 맥미니 HEAD와 원격 `564b923` 일치, 최신 lockfile 의존성 복원, root/backoffice/Android 빌드 성공 | 오래된 로컬 `stash@{0}`는 최신 코드에 자동 적용하지 않고 안전 백업으로만 유지 |

### 명시적 후순위

- PC/Mobile Web 앱: 2026-07-29 종료 결정. 공개 랜딩·다운로드·지원·법적 문서·초대 브리지·보호자 동의 브리지만 유지한다. 과거 기능 파리티 작업은 재개하지 않으며 공통 API·DB·알림 계약만 네이티브 앱을 위해 유지한다.
- Google Play 출시 절차: `AND-006`의 등록정보 제작은 진행 중이지만 Console 제출·정책·서명 확인과 `AND-002` 최종 AAB는 기능 안정화 뒤 재개한다.
- iOS: 사용자 확인 기준 App Store `1.0 (2)` 승인·배포 완료. `1.0.1 (3)` 업로드는 AdFit dSYM 경고로 교체하며, 다음 제출 대상은 dSYM 보정 `1.0.1 (4)`이다. Firebase APNs·실기기 푸시·딥링크·ATT/광고 회귀 후 제출한다.
- 태블릿: 2026-07-27 사용자 결정으로 iPad, Android 태블릿·폴더블의 신규 구현과 시각 QA를 모두 후순위로 둔다. 현재 완료 조건은 iPhone iOS 네이티브 핵심 기능이며, 휴대전화 기능 안정화 뒤 별도 재개한다.
- Remote Config: `WEB-007`, `AND-009`는 3플랫폼 핵심 기능 파리티와 운영 회귀가 끝난 뒤 재개한다.
- 장기 후보·외부 본인확인·위치·CRM 채널은 각 항목의 기존 재개 조건을 유지한다.

## 3. P0 보안·운영

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `SEC-001` | 백오피스 관리자 권한 서버 강제 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `ADMIN_EMAILS` fail-closed, 페이지/API 이중 검증, Service Role fallback 제거. `backoffice` build·tsc·대상 lint 통과 |
| [x] | `SEC-002` | 백오피스 운영 의존성 보안 업데이트 | `✅ 완료` | 2026-07-16 | 2026-07-16 | Next `16.2.10`, React/React DOM `19.2.4`, PostCSS `8.5.10`; `npm audit --omit=dev` 0건 |
| [x] | `SEC-003` | 저장소 현재 파일의 CRON 비밀값 제거 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 저장소 검색 결과 실제 값 0건. Git 이력 노출 때문에 `OPS-002` 회전은 별도 필수 |
| [x] | `DB-SEC-001` | 가족·자녀 Data API 권한 migration 작성 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `20260716010715_explicit_family_child_data_api_grants.sql`; authenticated SELECT 전용 |
| [x] | `OPS-001` | 백오피스 `ADMIN_EMAILS` 운영 설정 확인 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `ADMIN_EMAILS`와 Supabase 필수 3개 키가 Production/Preview sensitive로 존재. 폐기된 `NEXT_PUBLIC_ADMIN_EMAILS` 제거 후 0건 확인. 실제 로그인은 `OPS-003`에서 검증 |
| [x] | `OPS-002` | 운영 CRON 키 회전 | `✅ 완료` | 2026-07-16 | 2026-07-16 | Vercel sensitive 키 교체 후 기존 메인 Production 소스 재배포. Vault secret 1개, 활성/Vault 참조/정식 도메인 각 6개, 평문 Bearer 0개, `/api/cron/automations` 200 확인 |
| [x] | `DB-001` | `DB-SEC-001` 운영 DB 적용 | `✅ 완료` | 2026-07-16 | 2026-07-16 | migration `20260716024321` 등록. RLS 6/6, anon grant 0, authenticated SELECT 6·쓰기 0, service role 6개 테이블 확인 |
| [x] | `SEC-005` | Supabase 함수 권한·실행 환경 하드닝 | `✅ 완료` | 2026-07-16 | 2026-07-16 | migration `20260716024712`: `cleanup_old_invite_attempts()`는 service role 전용, 함수 3종 `search_path=public, pg_temp`. Advisor에서 관련 WARN 6건 제거 확인 |
| [x] | `SEC-006` | 공개 광고 이미지 버킷 목록 노출 차단 | `✅ 완료` | 2026-07-16 | 2026-07-16 | migration `20260716025042`: broad SELECT 0, 관리자 INSERT/DELETE 각 1, public bucket 유지, 기존 이미지 URL 200, Advisor 경고 제거 |
| [x] | `SEC-007` | 광고 이벤트 무제한 Data API INSERT 차단 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 배포 `dpl_2QYcncve3PajMHpBTVUtV1kqQ6dV` READY·운영 검증 404, migration `20260716025712`: anon/auth INSERT·sequence false, service role true, INSERT policy 0, Advisor 경고 제거 |
| [x] | `SEC-008` | 루트 웹 의존성 보안 업데이트 | `✅ 완료` | 2026-07-16 | 2026-07-16 | Next·eslint-config-next `16.2.10`, PostCSS `8.5.12` override, 안전 범위 전이 업데이트. `npm audit` 0건, production build·TypeScript 통과 (`3867550`) |
| [ ] | `SEC-009` | Next/Sharp 신규 보안 권고 대응 | `🟠 상위 패치 대기` | 2026-07-23 | — | root/backoffice Next·eslint-config-next `16.2.12`, PostCSS `8.5.24`로 갱신하고 build·TypeScript를 통과했다. root의 Next→sharp high 2건과 backoffice의 Next→sharp·Google SDK 전이 high 7건은 호환성 검증 없는 강제 override/downgrade를 금지하고 공식 호환 패치를 추적한다. Nodemailer는 `9.0.3`으로 갱신해 기존 취약점을 제거했다 |
| [ ] | `SEC-010` | 네이티브 API Firebase App Check 단계적 강제 | `🟠 필수 운영 게이트·사용자 확인 대기` | 2026-07-29 | — | App Check JWT 서명·issuer·audience·허용 앱 ID 검증과 `off/monitor/enforce` 모드를 추가했다. Android/iOS `X-Firebase-AppCheck` 적용 → 스토어 업데이트 배포 → Production `monitor` 관측 → `enforce` 전환 순서로 진행한다. 사용자가 전체 완료를 직접 확인하기 전에는 완료 처리 금지·모든 배포/인수인계에서 반복 고지 |
| [ ] | `AUTH-001` | Supabase 유출 비밀번호 차단 활성화 | `🔴 차단` | 2026-07-16 | — | Pro 이상 기능. Dashboard `Authentication → Providers → Email`의 leaked password protection 활성화 권한 또는 Management API PAT 필요. 활성화 뒤 Advisor 재검사 |
| [ ] | `AUTH-002` | Android/iOS Kakao OAuth와 자녀 초대 identity | `🟠 네이티브 SDK 전환 진행 중` | 2026-08-04 | — | 1차 Supabase 브라우저 OAuth와 이메일 없는 Kakao identity용 자녀 claim/승인 migration을 구현한 뒤, 사용자 결정으로 Android/iOS Kakao SDK의 카카오톡 앱 전환·OpenID ID token→Supabase 세션 교환·키 해시/URL scheme까지 확장 중이다. 외부 키/OIDC 설정, 운영 DB 적용 승인, 양 플랫폼 일반·자녀 실계정 검증 후 완료 |
| [ ] | `OPS-003` | 백오피스 배포 및 인증 스모크 테스트 | `🔴 차단` | 2026-07-16 | — | 배포 `dpl_EN4cMqPT3ReXG7NduMcRv1vn3S4b` READY·`admins.gleaum.com` 연결. 로그인 200, 미인증 페이지 307→`/login`, API 401 확인. 완료에는 비관리자 403·관리자 페이지/API 2xx 실제 세션 검증 필요. 환경 미설정 503은 코드 fail-closed/build로 확인 |
| [ ] | `SEC-004` | 백오피스 전체 source lint 정상화 | `⬜ 대기` | — | — | `.next` 제외 설정 후 기존 React effect/타입 lint 오류 해결, `npm run lint` 0 error |

## 4. 저장소·배포 프로세스

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `REPO-000` | 프로젝트를 외장 SSD 작업 경로로 이전 | `✅ 완료` | 2026-07-14 | 2026-07-16 | 외부 작업 이동·복구 절차 검증 완료 |
| [x] | `DOC-001` | 프로젝트 통합 작업 트래커 도입 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 전체 도메인 작업에 ID·상태·날짜·완료 기준을 부여하고 `AGENTS.md` 시작/종료 규칙에 연결 |
| [x] | `REPO-001` | 기존 미커밋 변경 검토·안전한 커밋 분리 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 비Android 7개 체크포인트 후 Android·캘린더/테마·문서를 `da2384e`로 보존. Android debug/test/lint/release package, 웹 lint/build, 실기기 로그인 검증 근거 포함 |
| [ ] | `REPO-002` | 비밀·환경·릴리즈 키 백업 상태 확인 | `⬜ 대기` | — | — | `.env.local`, Android release keystore, 서명 비밀번호의 저장소 외 백업 확인 |
| [x] | `REPO-003` | 맥북 최신 작업을 맥미니 작업공간에 동기화 | `✅ 완료` | 2026-07-23 | 2026-07-23 | `codex/platform-parity-sync-20260723` 로컬·원격 `564b923` 일치, lockfile 기준 의존성 복원. root 테스트 9/9·4/4·2/2와 production build 54/54, backoffice build, Android debug compile/unit/lint/assemble 통과 |
| [x] | `REPO-004` | Portable SSD를 정식 작업공간으로 재동기화 | `✅ 완료` | 2026-07-23 | 2026-07-23 | `/Volumes/Portable SSD/AI/gleaum`에 전체 미러링. 원본 대비 rsync 차이 0건, HEAD `142b1da`, 추적 파일 723개, `.env.local`·Vercel 연결·lockfile 체크섬 일치. 기존 SSD 작업본은 `gleaum-pre-sync-backup-20260723-1800`에 보존 |
| [ ] | `OPS-004` | 메인 웹 최신 변경 배포·운영 회귀 | `🟠 진행 중` | 2026-07-16 | — | 기존 Production은 `084676b` 계열까지 검증. 최신 기능 기준 `42b53b0`은 GitHub 브랜치와 로컬 build까지 완료됐으나 Production 반영 전. Preview → Production 승격 후 공간·가계부 쓰기와 알림 설정 회귀 필요 |
| [x] | `ARCH-001` | CodePush형 빠른 업데이트 전달 구조 검토 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 현재 `server.url`로 Web/API는 이미 즉시 반영되며 Compose는 OTA 대상이 아님을 확인. `docs/26-live-update-delivery-strategy.md`에 Remote Config·Web fallback·Play 업데이트 3단계 전략과 정책 경계 기록 |

상세 이동·복구 절차: `docs/23-external-work-checkpoint.md`

## 5. Android

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `AND-000` | 주요 화면 Compose Material 3 기반 전환 | `✅ 완료` | 2026-06-24 | 2026-07-14 | 코드 감사 평균 90.8/A, `assembleDebug`·`lintDebug` 통과 기록 |
| [ ] | `AND-001` | 실기기 시각·핵심 회귀 QA | `🟠 진행 중·일정 등록 복구` | 2026-07-16 | — | `SM_F731N`에서 개인 일정 저장 성공 후 활성 공유 공간만 조회해 목록이 비는 결함을 재현·수정. 개인 공간+활성 공유 공간 집계, 저장 응답 즉시 캐시 반영, ISO 시간 정규화, 상세 권한 재조회까지 적용. 제목·날짜·시작·종료 입력→목록·홈→상세 날짜/권한→삭제 실기기 회귀 통과. 남은 가계부 쓰기·가족 전환·삭제 회귀는 계속 진행 |
| [ ] | `AND-002` | Release AAB 검증 | `⏸ 보류` | 2026-07-16 | — | 사용자 결정으로 Google Play 출시 구간 후순위. 기능 production build와 핵심 회귀가 끝난 뒤 서명 비밀번호를 확보해 최종 AAB 검증 |
| [ ] | `AND-003` | 휴대전화 접근성 QA / 태블릿·폴더블 | `🟠 휴대전화 접근성·태블릿 보류` | 2026-07-16 | — | compact·글꼴 1.3배·다크·expanded NavigationRail/840dp 폭·UI 의미/터치 영역의 기존 검증 근거는 보존한다. 실제 휴대전화 TalkBack 음성 탐색만 Android 재개 시 수행하며, 태블릿·폴더블 신규 구현·시각 QA는 2026-07-27 사용자 결정으로 후순위 |
| [x] | `AND-004` | 로그인/가입 Compose 전환 여부 결정 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 브랜드 고정 다크 XML 예외 승인. 1080×2640·글꼴 1.3배에서 잘림/겹침 없음. 기능·정보 구조 대폭 변경 시 Compose 재평가 |
| [ ] | `AND-005` | 기기 캘린더 2·3차/가져오기 QA | `🟠 진행 중` | 2026-07-14 | — | WebView 가져오기 경로를 Compose 네이티브 Activity로 교체. `SM_F731N` 권한·캘린더 선택·후보 3개 조회·선택 UI 통과. 격리 일정으로 실제 가져오기→재조회 중복, 자동 생성·수정·삭제 확인 필요 |
| [ ] | `AND-006` | Play Console 출시 자료·정책 점검 | `🟠 진행 중` | 2026-07-16 | — | Android 1.1.5 기준 한국어 등록정보 카피와 익명화된 휴대전화 스크린샷 6장 준비 완료. `docs/25-google-play-release-readiness.md` 기준 1024×500 기능 그래픽 제작, Console 업로드·최신 versionCode·IARC·App access·서명 확인 필요 |
| [x] | `AND-007` | Android 백업·컴포넌트·R8·캘린더 변경 경계 하드닝 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `allowBackup=false`, preview Activity 비공개, 광범위 ProGuard keep 제거, 캘린더 표식/대상 검증. debug/test/lint/release package 재통과 |
| [x] | `AND-008` | Android 권한·개인정보·Data safety 정합성 보완 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 미사용 CAMERA/feature 제거, 캘린더·Firebase·AdMob/AdFit 개인정보처리방침 반영, Play 입력 초안 문서화. release package manifest의 카메라·미디어·외부 저장소 권한 0건·Android debug/test/lint·웹 lint/build 통과 |
| [ ] | `AND-009` | Remote Config 긴급 차단·필수 업데이트 기반 | `⏸ 보류` | — | — | 사용자 결정으로 3플랫폼 핵심 기능 파리티 이후 재개. 주요 기능 차단·필수 업데이트·API 버전 계약 범위 유지 |
| [ ] | `AND-010` | 앱 시작 선조회·공유 캐시·새로고침 정책 | `🟠 실기기 검증 중` | 2026-07-23 | — | 스플래시 병렬 선조회 후 `SM_F731N` 홈 즉시 데이터 표시, 핵심 메뉴 왕복과 크래시/ANR 0건 확인. pull-to-refresh·mutation 선택 무효화·오프라인/부분 실패 체감 검증 후 완료 |
| [ ] | `AND-011` | Credential Manager 네이티브 Google 로그인 | `🟠 코드 완료·외부 설정 대기` | 2026-07-23 | — | Credential Manager 계정 선택 → Google ID token → Supabase `/auth/v1/token?grant_type=id_token` 교환과 기존 SessionManager 저장 구현, Kotlin compile 통과. Firebase/Google Cloud에 debug·release·Play App Signing SHA-1 등록 후 실제 계정 선택·취소·재로그인 검증 필요 |
| [ ] | `AND-012` | 광고 설치 유입·핵심 전환 측정 | `🟠 코드·빌드 완료·콘솔/실기기 대기` | 2026-08-04 | — | Play Install Referrer 2.2와 Firebase 캠페인·온보딩·최초 핵심 행동·일정/공간 생성·참여·알림 열기 이벤트를 연결했다. 서비스 콘텐츠와 자녀 정보를 보내지 않고 `canShowAds=false` 계정은 측정하지 않는다. Kotlin compile 통과. Firebase 실수신, 핵심 이벤트 지정, Google Ads 연결·전환 가져오기가 남았으며 Meta/MMP는 별도 재개 조건까지 보류 |

### `AND-009` 세부 체크리스트

- [ ] Remote Config 키 계약과 앱 내 안전 기본값 정의
- [ ] 앱 시작 fetch/activate 및 foreground 실시간 변경 수신 구현
- [ ] 공간 삭제·가족 전환·일정 쓰기·가계부 등 주요 기능별 kill switch 연결
- [ ] 기능 중지 사유·점검 안내·재시도 UX 구현
- [ ] `latest_version`, `minimum_supported_version`, `update_mode`, 스토어 URL·안내 문구 적용
- [ ] Google Play Immediate/Flexible In-App Update와 스토어 이동 fallback 구현
- [ ] 모든 네이티브 API 요청에 앱 버전·빌드 번호 헤더 추가
- [ ] 서버 최소 지원 버전 검사와 `426 upgrade_required` 공통 응답 적용
- [ ] Remote Config 실패·오프라인·오래된 캐시에서의 fail-safe 정책 구현
- [ ] 권한 판정은 Remote Config가 아닌 API/DB에서 계속 강제하는지 검증
- [ ] Crashlytics 지표·단계적 rollout·긴급 rollback 운영 절차 문서화
- [ ] 단위 테스트·Android build/lint·구버전/최신버전 실기기 시나리오 검증

상세 QA: `docs/20-android-native-release-qa.md`, `docs/22-android-material3-ui-audit.md`

### Android 작업의 플랫폼 후속 기록

| Android 기준 기능 | 공통 계약 영향 | PC/Mobile Web 후속 | iOS 후속 |
|---|---|---|---|
| 가족 공간 전환 (`FAM-008`) | 기존 공간 ID·데이터 유지, admin 권한, 개인 공간 차단, 오류 코드 계약 유지 | Android 마감 뒤 동일 API의 전환·오류·fallback UX 회귀 | iOS 공간 관리 구현 시 같은 API·오류 계약 적용 |
| 가족 관계·초대/설정 분리 (`FAM-009`) | `space_members.role`은 권한, `family_role`은 표시 관계. 일반 가족 코드 초대와 자녀 검증 초대 분리 | 가족 멤버 카드 관계 우선 표시, 멤버 탭 전용 초대 유형 선택, 설정의 초대 제거 | Android 확정 정보 구조와 동일하게 네이티브 구현 |
| 자녀 초대 WebView 경로 유지 (`FAM-010`) | 네이티브 저장 세션 재적용은 현재 기능 경로를 덮어쓰지 않음 | Web 브라우저는 기존 라우팅 유지, 별도 후속 없음 | iOS WebView 기능 진입 시 동일한 세션 재적용 규칙을 사용 |
| 선택 이메일·토큰 연결 (`FAM-012`) | 자녀 이메일은 선택 제한값, `auth.users.id`가 지속 식별자. claim은 후보만 저장하고 최종 승인 전 멤버십·연령 권한 생성 금지 | PC/Mobile 공통 관리·공유·QR·Google/이메일 claim UI 구현. 운영 실계정 회귀만 남음 | iOS 자녀 초대 진입 시 동일한 pending route·후보 승인 계약 적용 |
| 자녀 연결 Compose 전환 (`FAM-013`) | 기존 DB/RLS/RPC는 유지하고 자녀 API 8개가 Cookie·Bearer 인증을 공통 지원 | 기존 Web 화면은 브라우저·법적 문서·fallback으로 유지 | 보호자 관리·OTP·동의·claim을 같은 API 계약으로 SwiftUI/UIKit 구현 |
| 네이티브 Google 로그인 (`AND-011`) | Supabase 세션 토큰 형식은 기존과 동일 | Web OAuth는 현행 유지 | Google 네이티브 로그인과 App Review 4.8 대응 로그인 수단을 함께 구현 |
| 앱 시작 선조회·캐시 (`AND-010`) | API 응답 계약은 유지하고 Android 클라이언트 요청 정책만 변경 | Android 완료 뒤 Web 라우트 이동 중 중복 fetch와 SWR/캐시 정책 별도 감사 | 앱 시작 시 account/home/space 선조회와 pull-to-refresh 동등 정책 적용 |

Android 구현 중 새 공통 API·DB·권한 변경이 발생하면 이 표와 `PAR-001` 싱크 보드에 먼저 기록한다. Web/iOS 코드를 같은 작업에서 임의 수정하지 않는다.

## 6. 가족·자녀·공간 권한

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `FAM-000` | 자녀 사전등록·보호자 이메일 확인·초대·승인 기반 | `✅ 완료` | 2026-07-13 | 2026-07-14 | migration 020~022 운영 적용 기록과 Web/API 기반 구현 |
| [x] | `FAM-001` | 공통 session context capability 적용 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `/api/session/context` Cookie·Bearer 검증, 공통 mapper/provider, Web 메뉴·광고·가계부·공간 UI, Web/native API, 운영 RLS 7개 차단. capability 4건·데이터 경계 8건·변경 대상 ESLint·tsc·build 통과. 네이티브 전용 UI는 `FAM-002`/`IOS-005` |
| [x] | `FAM-002` | 자녀 전용 홈·메뉴 제한 | `✅ 완료` | 2026-07-16 | 2026-07-16 | Web 자녀 안내 홈·문구, Android account context 캐시·자녀 홈 카드, 가계부/공간 관리 메뉴·액티비티·딥링크 차단, AdMob 네이티브/App Open 광고 차단. capability 4/4·데이터 경계 8/8·변경 대상 ESLint·tsc·production build·Android compile/test/lint/assemble 통과 |
| [ ] | `FAM-003` | 일정 assignee/observer 모델·RLS | `⬜ 대기` | — | — | 자녀/보호자 역할별 조회·수정 테스트 포함 |
| [ ] | `FAM-004` | 만 14세 재동의·만 19세 전환 | `⬜ 대기` | — | — | UI, 알림, 일괄 Cron, 과거 동의 이력 보존 검증 |
| [ ] | `FAM-005` | 약관·개인정보처리방침 개정 운영 | `⬜ 대기` | — | — | 사전 고지일·시행일·버전 기록과 법률 검토 완료 |
| [ ] | `FAM-006` | 외부 본인확인 전환 | `⏸ 보류` | — | — | 자녀 1,000명/월 500건/분쟁 1건/위치·결제 도입/정책 요구 중 하나 발생 시 재개 |
| [ ] | `FAM-007` | 수동 위치 체크인 MVP | `⏸ 보류` | — | — | 별도 법률 검토·본인확인·위치 동의 완료 후에만 재개 |
| [ ] | `FAM-008` | 기존 공간 수명주기·가족 공간 승격 | `🟠 실기기 검증 대기` | 2026-07-16 | — | 전환 실패 직접 원인은 운영 API 미배포로 확인(기존 404). Production `dpl_9H8AaLttD7fsXuZUzzMdMycQNcHY` 배포 후 동일 경로가 정상 인증 계약 401을 반환. DB migration·API·Android 구현·build 완료; 로그인 공간 지기 계정의 실제 전환과 개인 공간/권한 오류 UX 최종 확인 필요 |
| [x] | `FAM-009` | 가족 관계 역할·초대/설정 분리 | `✅ 완료` | 2026-07-23 | 2026-07-23 | 권한 `role`과 표시 관계 `family_role` 분리, 운영 migration 2개·Native API·Android 관계 관리와 전용 초대 유형 구현. Production `dpl_2j1WLB6oEb2zVbupH7J98XLaqUHy`, root build 54/54, Android unit/assemble, `SM_F731N` 관계/초대/설정 UI 회귀 통과. 실제 관계값 저장은 운영 데이터 보호를 위해 미실행 |
| [x] | `FAM-010` | Android 자녀 초대 WebView 경로 유지 | `✅ 완료` | 2026-07-23 | 2026-07-23 | 네이티브 세션 재적용이 `/space/children`을 `/home`으로 덮어쓰던 문제 수정. Production `dpl_8haU9476UgHXLDmZ3Pnd8maqwXJN` 배포 후 `SM_F731N`에서 `MainActivity`와 `/space/children?sid=...` URL 유지 확인 |
| [ ] | `FAM-011` | 보호자 이메일 OTP·필수 동의 정합화 | `🟠 운영 DB 복구 완료·양 플랫폼 재시도 대기` | 2026-07-23 | — | 2026-08-03 운영 500 재발 원인은 `RETURNS TABLE` 출력 변수 `dependent_id`와 `family_relationships` UPDATE의 미한정 열 충돌. `20260803000531_fix_guardian_consent_qualified_update.sql`을 운영 적용하고 rollback 기반 성공 경로 검증 완료. iOS·Android가 동일 API를 사용하므로 기존 앱 모두 즉시 복구 대상이며, 실제 계정 동의 완료 후 500 로그 0건 확인 필요 |
| [ ] | `FAM-012` | 자녀 선택 이메일·일회성 토큰·최종 승인/거절 | `🟠 Production 배포 완료·Kakao 운영 적용/실계정 회귀 대기` | 2026-07-23 | — | 이름·생년월일 중심 등록, 선택 이메일 제한, 검증 로그인 identity claim 후보 스냅샷, 보호자 본인 claim 차단, 승인 전 멤버십·연령 권한 보류, 거절·재초대, OS 공유·문자·QR 구현. 2026-08-04 자녀 초대 페이지를 앱 열기→자녀 로그인→연결 요청→보호자 승인 단계로 재구성했고, Kakao/Apple/Google/이메일과 이메일 없는 검증 Kakao identity를 허용하는 migration을 작성했다. 외부 Kakao Provider 설정·운영 migration·보호자/자녀 실계정 회귀 필요 |
| [ ] | `FAM-013` | Android 자녀 계정 연결 Compose 전환 | `🟠 코드 완료·실기기 대기` | 2026-07-23 | — | Compose Material 3 보호자 목록/등록/8자리 OTP/필수 동의/초대 공유/후보 승인·거절과 자녀 token claim 구현. 자녀 API 8개 Cookie·Bearer 공통 인증, `/space/children`, `/family/guardian/verify`, `/invite/child/{token}` 네이티브 라우팅, Kotlin compile 통과. Production API 배포 후 보호자·자녀 실계정 회귀 필요 |

상세 기준: `docs/21-family-child-account-foundation.md`

## 7. Web·API·데이터

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [ ] | `WEB-001` | 개인/공유 공간 데이터 경계 자동 회귀 테스트 | `🔴 차단` | 2026-07-16 | — | `3867550`: Node/tsx 접근 매트릭스 8개 통과. 개인 일정·개인 원장 비노출, 공간 데이터 멤버십, admin/editor 쓰기, 개인 일정의 공유 공간 폴백 차단을 운영 코드와 함께 검증. 2차는 Docker CLI만 있고 daemon·Supabase CLI·`config.toml`이 없어 차단. Docker Desktop 실행 후 로컬 Supabase 구성·RLS 역할별 CRUD 테스트 추가 필요 |
| [ ] | `WEB-002` | 이메일 가입 운영 설정 검증 | `⬜ 대기` | — | — | Custom SMTP, 확인 템플릿, Redirect URL, 만료/재발송 실제 계정 테스트 |
| [ ] | `WEB-003` | 이미지 첨부 실제 업로드 | `⬜ 대기` | — | — | Storage/RLS/용량·확장자 제한/삭제·실패 UX 구현 |
| [ ] | `WEB-004` | 통계·분석 확장 | `⬜ 대기` | — | — | 지표 정의 후 웹/백오피스 소유 경계를 확정하고 구현 |
| [ ] | `WEB-005` | 일정 단건 외부 공유 | `⬜ 대기` | — | — | 만료·취소 가능한 읽기 전용 링크와 개인정보 노출 검토 |
| [ ] | `WEB-006` | 마이페이지 Desktop/Mobile 기능 일치 | `⏸ 웹앱 종료로 N/A` | 2026-07-16 | — | 2026-07-29 웹 기능 제공 종료 결정. 기존 소스는 롤백 기간에만 보존하고 사용자 경로는 `/download`로 전환 |
| [ ] | `WEB-007` | Remote Config 운영 안전장치·버전 gate | `⏸ 보류` | — | — | 사용자 결정으로 플랫폼 기능 파리티 이후 재개. 현재 `initRemoteConfig()`와 백오피스 편집기는 존재하지만 실제 소비처가 없음 |
| [ ] | `WEB-008` | Web 설정·준비 중 기능 노출 정합화 | `⏸ 웹앱 종료로 N/A` | 2026-07-16 | — | 공개 웹에서 앱 설정 화면을 제공하지 않는다. 종료 경로는 `/download`로 전환 |
| [ ] | `WEB-009` | 일정 장소·지도 기능 완성 | `⏸ 웹앱 종료로 N/A` | 2026-07-16 | — | 일정 장소 기능은 Android/iOS에서만 후속 구현하며 웹 UI는 종료 |
| [ ] | `WEB-010` | 알림 설정 서버 발송 경계 적용 | `🟠 진행 중` | 2026-07-16 | — | 일정 리마인더·재알림·자녀 미완료·결제 초과·주간 소비 요약에서 opt-in을 강제하고 명시적 false 사용자의 FCM/인앱 기록을 차단. 운영 배포 후 실제 수신/비수신 회귀 필요 |
| [x] | `WEB-011` | 공개 첫 접근 랜딩 크로스 플랫폼 개편 | `✅ 완료` | 2026-07-23 | 2026-07-23 | PC 전용·모바일 로그인 강제 구조를 제거하고 모든 Web 뷰포트에 서비스 소개, 핵심 기능, 플랫폼 상태, Google Play/웹 진입을 제공. 실제 Android 화면의 정보 구조를 개인정보 없이 재구성. PC 1440×900·Mobile 390×844 시각 회귀, SSR 소개 문구, production build·링크 검증 완료 |
| [ ] | `WEB-012` | 웹앱 종료·앱 초대 브리지·PWA 제거 | `🟠 Production 배포 완료·실기기 회귀 대기` | 2026-07-29 | — | 공개 랜딩에서 웹앱 진입 홍보를 제거하고 Web Push·PWA·브라우저 초대 참여를 종료했다. 자녀·일반 초대 브리지는 단계형 흐름, OS별 앱 실행/스토어 직접 연결, 실행 실패 안내, KakaoTalk 등 인앱 브라우저 외부 열기 안내를 제공한다. Production `dpl_7xrPbBdmofA3BBzYna6pYxWopSoR`에서 390×844 가로 넘침 0, 내부 세로 스크롤·하단 링크 도달, KakaoTalk Android 안내 렌더, Smart App Banner·noindex를 확인했다. Play 배포본의 WebView fallback 보호를 위해 네이티브 최소 버전 보급 후에만 `WEB_APP_RETIREMENT_MODE=enforce`로 전환한다. 실제 Android/iPhone·카카오톡 회귀 후 완료 |
| [ ] | `WEB-013` | `www` 대표 도메인·검색 인증·앱 링크 정합화 | `🟠 웹 배포 완료·앱 릴리스 대기` | 2026-07-29 | — | canonical·Open Graph·사이트맵·초대/다운로드 링크를 `https://www.gleaum.com`으로 통일하고 Naver 소유권 토큰을 교체했다. 랜딩의 Web 제공 카드를 제거했다. Production에서 metadata·robots·sitemap과 `www/.well-known/assetlinks.json`의 redirect 없는 200을 확인했다. 다음 Android/iOS 릴리스와 Play 딥링크 경고 해소 확인이 남음 |
| [ ] | `WEB-014` | FAQ·Q&A 접수·백오피스 이메일 답변 | `🟠 Production 문의 저장 완료·SMTP 대기` | 2026-07-29 | — | 공개 `/support`에 FAQ와 회원/비회원 문의 양식을 구성하고 서버 검증·HMAC 요청 식별·횟수 제한·Service Role 전용 저장을 구현했다. 운영 migration 2개 적용, RLS와 anon/auth 차단·service_role CRUD·replied_by 인덱스를 확인했다. root `dpl_8mkfh6MtiHkBr7niDiAsKejwhP6d`, backoffice `dpl_HhjB8YU9fdTbTWHPLA8JnyNS6Xwi`를 Production 배포했다. 실제 도메인에서 허용되지 않은 Origin 403, 유효 문의 201·DB 저장·테스트 삭제, 미인증 관리자 307→login·X-Robots noindex, 양쪽 런타임 오류 0건을 확인했다. Production SMTP 환경변수와 실제 관리자 답변→실메일 수신 회귀 후 완료 |
| [ ] | `WEB-015` | 실제 화면 기반 기능 안내·검색 최적화·웹 보안 보강 | `🟠 Production 완료·색인 관측 대기` | 2026-07-29 | — | `/features`와 7개 상세 페이지에 Android/iOS 실제 화면, 공간·가족/자녀·가계부·캘린더·알림 활용법을 구성했다. canonical·이미지 sitemap·JSON-LD·보안 헤더·백오피스 전체 noindex를 보강했다. root/backoffice production build·TypeScript·대상 lint와 PC 1440×900·Mobile 390×844 시각 검증을 통과했다. Production `www.gleaum.com`의 support/features/가족 상세/sitemap/robots 200, 이미지 sitemap 7개, `admins.gleaum.com/support` noindex 경계를 확인했다. Google/Naver sitemap 제출과 색인·검색 성과 관측 후 완료 |
| [ ] | `WEB-016` | 양 스토어 공개 랜딩·법적 문서·종료 경로 감사 | `🟠 Production 완료·iPhone 회귀 대기` | 2026-08-04 | — | Android/iPhone 플랫폼 카드를 각각 Google Play·App Store 직접 링크로 통일하고 공개 메인 테마를 감사했다. iOS `?app=1` 법적 문서는 웹 헤더/푸터 없이 테마 토큰과 독립 스크롤을 사용한다. 웹 기능 종료 경로와 유지 브리지 목록을 문서화했으며 `/space/[spaceId]/join`은 사용처 확인 전 삭제 후보다. Next 65/65·iOS Simulator build 통과, Production `dpl_CpJ37RAwauGgMpJCQtgP5jRQ2oPH` READY. 운영 루트 200·양 스토어 URL·양 법적 문서 nav/footer 0·스크롤 스타일·compat 경로 200 확인. 실제 iPhone 끝까지 스크롤/양 테마만 남음 |
| [x] | `WEB-017` | 앱 다운로드 페이지 반응형 리뉴얼 | `✅ 완료` | 2026-08-04 | 2026-08-04 | 모바일 단일 카드·인라인 스타일·3초 강제 스토어 이동을 제거하고 PC/Mobile 분리 구조, 실제 Android/iPhone 화면, OS별 추천 CTA, 양 스토어 카드, 설치 3단계와 데이터 경계 안내로 재구성했다. 테마 토큰과 페이지 전용 스크롤 컨테이너를 적용하고 전역 푸터 중복을 제거했다. 대상 ESLint·TypeScript·Next 65/65 build 통과. Production `dpl_6Mm1L8vWpz7GaHRjw3XJQjiedira` READY. 운영 PC 1440×1000·iPhone 390×844에서 가로 넘침 0, 끝까지 스크롤, 푸터 1개, canonical·Google Play·App Store·기기 추천 CTA를 확인 |
| [ ] | `LEGAL-001` | 공개 운영 주체·개인정보 담당 표기 정리 | `🟠 일반 표기 완료·법률 검토 대기` | 2026-07-29 | — | 공개 UI와 일반 문의 주체를 `글리움 운영팀`, 이용약관 운영 주체를 `글리움`, 개인정보 보호 담당부서를 `글리움 운영팀`으로 정리했다. 유료 거래 도입 전 실제 사업자명·대표자·주소·통신판매 표기 의무를 별도 법률 검토하고 약관 시행일·변경 고지를 확정해야 완료 |
| [ ] | `FIN-001` | 개인 가계부·공간 자금 단일 거래 전환 | `🟠 운영 배포 완료·실기기 회귀 대기` | 2026-08-03 | — | `ledger_entries` 한 행을 `owner_id` 개인 가계부와 `space_id` 공간 자금에서 함께 조회하도록 Android/iOS/API를 구현했다. 공간 화면에 완료 수입·지출·예정·최근 내역과 공간이 선택된 등록 진입점을 추가했다. 공간 멤버는 같은 ID를 읽되 작성자만 수정·상태 변경·삭제한다. 신규 저장의 사본 생성은 없다. Vercel Production `dpl_62rJn8wbizSZS4QTthL14DsYT87N` READY, 공개 루트 200·미인증 쓰기 401·최근 runtime error 0건 확인. 기존 레거시 일정 지출 16건의 파괴적 정리는 별도 백업·대조 후 진행 |
| [ ] | `FIN-002` | 정기 지출 예정·연체·실제 결제일 수명주기 | `🟠 운영 배포 완료·크론/실기기 회귀 대기` | 2026-08-03 | — | 운영 migration `20260803031000` 적용: `due_at`, `settled_at`, 안정적 `recur_rule_id`, 중복 방지·조회 인덱스와 개인/공간 SELECT RLS를 확인했다. 실제 합계와 예정 합계를 분리하고 결제 완료 시 실제 날짜를 받는다. 양 플랫폼에서 이번 회차 건너뛰기와 정기 항목 중지를 제공하며, 중지는 선택 회차 이후 pending을 제외하고 새 회차 생성을 막는다. 반복 선생성·연체·주간 다이제스트는 원장 기준이다. Production `dpl_62rJn8wbizSZS4QTthL14DsYT87N` 배포 완료. 인증된 크론의 D0/D+1/D+3/D+7·다음 회차·월경계 실데이터 회귀 필요 |
| [ ] | `NOTI-001` | 공간 일정·공간 지출 이벤트 푸시와 다중 기기 전달 | `🟠 운영 배포 완료·실수신 회귀 대기` | 2026-08-03 | — | 서버 일정/공간 원장 생성 이벤트, 공간 멤버·일정 참여자·결제자 수신 정책, 설정 opt-in, 인앱 `dedupe_key`, `fcm_tokens` 다중 기기+legacy fallback, UNREGISTERED 정리를 통합했다. 거래 알림은 `/budget?entry={id}`로 양 플랫폼 상세에 연결되고 타 멤버에게 읽기 전용으로 열린다. 운영 migration `20260803030000`과 Vercel Production `dpl_62rJn8wbizSZS4QTthL14DsYT87N` 적용, 보호된 크론 401·runtime error 0건·3플랫폼 빌드 통과. Android/iOS 실수신·탭·설정 OFF·중복 0건 확인 필요 |
| [ ] | `PAR-001` | PC Web·Mobile Web·Android 3플랫폼 핵심 기능 파리티 회귀 | `⏸ 웹앱 종료로 종료` | 2026-07-16 | — | 2026-07-29 웹 기능 제공 종료 결정으로 3플랫폼 UI 파리티 목표를 폐기했다. 아래 보드는 과거 감사 근거로만 보존하며 공통 API·DB·권한 계약은 Android/iOS 네이티브 기준으로 계속 관리한다 |

### `PAR-001` 3플랫폼 운영 규칙 (종료된 과거 기준)

> 2026-07-29 이후 신규 작업에는 적용하지 않는다. 아래 내용과 싱크 보드는 웹앱 종료 전 감사 이력으로만 보존한다.

- 당시 지원 플랫폼은 `PC Web`, `Mobile Web`, `Android App` 3개로 고정했다.
- API·DB·RLS·capability·오류 코드는 Web 플랫폼 작업이 아닌 **공통 코어 계약**으로 관리한다.
- 기본 실행 순서는 **공통 코어 영향 확인·계약 확정 → Android App 구현·검증 → PC Web 구현·검증 → Mobile Web 구현·검증 → 3플랫폼 통합 회귀**로 고정한다.
- Android App을 기준 동작과 최우선 구현 대상으로 삼되, Android 전용 제약을 공통 API·DB 계약으로 확대하지 않는다.
- 긴급한 운영 오류·보안·데이터 손실 위험은 플랫폼 순서보다 우선하며, 예외 순서와 사유를 작업 일지에 남긴다.
- 플랫폼 하나의 구현이 완료돼도 상위 기능은 계속 `🟠 진행 중`으로 두고, 나머지 플랫폼을 완료하거나 `N/A — 사유`를 기록한 뒤 닫는다.
- Android 또는 Web 작업을 시작할 때 아래 **플랫폼 영향 확인**을 먼저 수행하고 해당 기능 체크리스트에 반영한다.
- iOS는 현재 지원 플랫폼과 `PAR-001` 완료 조건에서 제외하고 8절의 후순위로 관리한다.

#### 플랫폼 영향 확인 체크리스트

> 아래는 일회성 완료 항목이 아니라 **변경 작업마다 해당 기능 아래에 복사해 사용하는 템플릿**이다. 영향이 없는 플랫폼도 비워두지 말고 `N/A — 사유`를 기록한다.

- [ ] 공통 API 요청·응답·오류 코드가 변경되는가?
- [ ] DB·RLS·capability·개인/공간 데이터 경계가 변경되는가?
- [ ] Android에 같은 기능·권한·실패 UX가 필요한가?
- [ ] PC Web에 같은 기능·권한·실패 UX가 필요한가?
- [ ] Mobile Web에 같은 기능·권한·실패 UX가 필요한가?
- [ ] 네이티브 전용 기능이면 Web에서 숨김·앱 전용 안내·`N/A` 중 어느 처리가 필요한가?
- [ ] 알림·딥링크·오류 메시지가 세 플랫폼에서 같은 의미를 갖는가?
- [ ] 적용하지 않는 플랫폼에 `N/A` 사유를 기록했는가?

#### 3플랫폼 싱크 보드

| 기능 | 공통 코어 계약 | Android App | PC Web | Mobile Web | 상위 상태·다음 행동 |
|---|---|---|---|---|---|
| 핵심 내비게이션 | capability 기준 메뉴 노출 | `✅` | `✅` | `✅` | `✅ 완료` |
| 마이페이지·설정 | 계정 capability·플랫폼 지원 범위 | `✅` | `🟠` | `🟠` | PC/Mobile 시각·제한 계정 회귀 |
| 홈 | 계정 모드·홈 구성·개인 원장·빈/오류 상태 | `⬜` | `✅` | `✅` | Android 동일 계정 집계·자녀 계정 비교 |
| 일정 목록 | 개인/공간 경계·역할·필터 | `⬜` | `⬜` | `⬜` | 공간 전환·권한·빈/오류 상태 비교 |
| 일정 생성·수정 | 저장 필드·참여자·알림·반복 계약 | `⬜` | `⬜` | `⬜` | 플랫폼별 지원 필드 감사 |
| 일정 상세 | 소속 공간·private 생성자·admin/editor/viewer 권한 | `🟠` | `🟠` | `🟠` | 3플랫폼 구현과 SDK 36 빌드 완료. admin/editor/viewer/private 생성자 실제 계정 회귀 후 완료 |
| 공간 | 선택·초대·역할·가족 전환·안전 삭제 | `🟠` | `🟠` | `🟠` | Preview/Production 배포 후 동일 계정 검증 |
| 가계부 | 개인/공간 원장·권한·반복 지출 | `⬜` | `⬜` | `⬜` | CRUD·개인/공간 경계 비교 |
| 알림 | 설정·발송 경계·읽음·이동 대상 | `🟠` | `🟠` | `🟠` | Android 서버 설정 동기화·딥링크와 SDK 36 빌드 완료. 설정별 FCM·Web 읽음/이동 실계정 회귀 대기 |
| 로그인·세션 | Cookie/Bearer·OAuth 복귀·capability | `🟠` | `✅` | `✅` | Android 재로그인·세션 복귀 실기기 검증 |
| 초대·딥링크 | 동일 초대 코드·권한·만료 계약 | `⬜` | `⬜` | `⬜` | Web link·App Link·custom scheme 회귀 |

#### 기능별 세부 체크리스트

##### 마이페이지·설정

- 공통 코어
  - [x] 가계부·공간 진입을 계정 capability로 제한
  - [x] 생체인증·기기 캘린더를 네이티브 전용으로 분류
- Android App
  - [x] 빠른 실행·알림·계정·약관·네이티브 전용 설정 분리
  - [ ] 재로그인 후 capability·메뉴 노출 실기기 회귀
- PC Web
  - [x] 빠른 실행·알림 목록/설정·약관 동선·권한별 노출 1차
  - [ ] 라이트/다크·성인/제한 계정·키보드 시각 회귀
- Mobile Web
  - [x] 미구현 Apple 로그인·포인트·프리미엄·Web 미지원 네이티브 진입점 정리
  - [x] 개인 공간을 무료 공유 공간 한도에서 제외하고 `공유 공간 n/2`로 표시
  - [ ] 라이트/다크·성인/제한 계정·터치 영역·뒤로가기 회귀

##### 홈

- 공통 코어
  - [x] PC/Mobile Web이 동일한 개인 공간 원장과 월간 지출 집계 계약 사용
  - [x] 로딩 중 Mobile Web이 `0원`을 확정값처럼 노출하지 않도록 PC와 표시 시점 통일
- Android App
  - [ ] 동일 계정에서 오늘 일정·개인 가계부 월간 합계·빈/오류 상태 실기기 회귀
- PC Web
  - [x] 인증 계정 이름·오늘 일정·월간 개인 가계부 `320,000원` 표시 확인
- Mobile Web
  - [x] 인증 계정 이름·오늘 일정·월간 개인 가계부 `320,000원` 표시 확인

##### 일정 상세

- 공통 코어
  - [x] 일정 소속 공간 기준 멤버·역할 조회
  - [x] private 생성자/admin/editor만 변경 허용, viewer 직접 편집 차단
  - [x] 참여자를 멤버십 ID가 아닌 사용자 ID로 연결
  - [x] 자녀 일정·재알림 대상을 `family_dependents.linked_user_id`로 계산
- Android App
  - [x] 서버 계산 `permissions`로 수정·삭제·상태 변경·재알림 노출 제어
  - [x] viewer의 직접 편집 딥링크 진입·저장 차단
  - [x] 참여자 ID 응답 파싱·인원 표시, 장소 표시·외부 지도 열기, Bearer 재알림 연결
  - [x] MacBook CLI 환경에 Android SDK Platform 36·Build-Tools 36.0.0·Platform-Tools 설치 후 `compileDebugKotlin`·unit test·lint·assemble 통과
  - [ ] admin/editor/viewer/private 생성자 실기기 회귀
- PC Web
  - [x] Android과 동일한 `canWriteScheduleBoundary` 공통 권한 함수로 판정 통합
  - [x] 권한별 변경 동작 노출·재알림 API·외부 지도 열기 구현
  - [ ] editor/viewer/private 생성자 계정별 수정·삭제·상태 전환·재알림 회귀
- Mobile Web
  - [x] PC와 공유하는 상세 컨트롤러에 동일 공통 권한 함수 반영
  - [x] 권한별 변경 동작 노출·재알림 API·외부 지도 열기 구현
  - [ ] editor/viewer/private 생성자 계정별 터치·뒤로가기·오류 UX 회귀

##### 공간

- 공통 코어
  - [x] 개인 공간 가족 전환·삭제 차단
  - [x] 멤버 잔존·자녀 이력·관리자 권한·미존재 오류 계약 구분
  - [x] 안전 삭제 후 fallback 공간·사용자 컨텍스트 갱신 계약 구현
- Android App
  - [x] 가족 전환·안전 삭제·mutation 오류 복구 UX 구현
  - [ ] 운영 API 배포·재로그인 후 공간 전환·삭제 실기기 회귀
- PC Web
  - [x] 관리자 공유 공간의 `/space/settings?sid=...` 진입·가족 전환·삭제 UX
  - [ ] Preview/Production에서 가족 전환·삭제·fallback 회귀
- Mobile Web
  - [x] 고급 설정 진입·가족 전환·삭제·오류별 안내
  - [ ] Preview/Production에서 터치·뒤로가기·fallback 회귀

##### 알림

- 공통 코어
  - [x] 일정·자녀·가계부 알림의 명시적 `false` 설정을 서버 발송·인앱 기록에서 강제
  - [x] 설정이 없는 기존 사용자는 호환을 위해 활성으로 처리
- Android App
  - [x] 알림 목록·개별/전체 읽음·일정 딥링크 동작 코드 감사
  - [x] 일정·루틴·가계부 알림 설정을 Android 로컬에서 서버 `profiles.notification_settings`로 전환·동기화
  - [x] Cookie/Bearer 공통 인증으로 재알림 API 연결, 구버전 API 응답은 저장 성공으로 오인하지 않게 차단
  - [x] MacBook CLI 환경에 Android SDK Platform 36·Build-Tools 36.0.0·Platform-Tools 설치 후 `compileDebugKotlin`·unit test·lint·assemble 통과
  - [ ] Web과 동일 계정으로 설정별 FCM 수신/비수신 실기기 회귀
- PC Web
  - [x] 알림 카드 키보드 접근·읽음 처리·연결 일정 상세 이동
  - [ ] 설정별 실제 수신/비수신·키보드·오류 UX 회귀
- Mobile Web
  - [x] 알림 카드 터치·읽음 처리·연결 일정 상세 이동
  - [ ] 설정별 실제 수신/비수신·터치·뒤로가기 회귀

##### 나머지 기능 확장 대기

- [x] 홈: 공통 계약 → Android → PC Web → Mobile Web 체크리스트 추가
- [ ] 일정 목록: 공통 계약 → Android → PC Web → Mobile Web 체크리스트 추가
- [ ] 일정 생성·수정: 공통 계약 → Android → PC Web → Mobile Web 체크리스트 추가
- [ ] 가계부: 공통 계약 → Android → PC Web → Mobile Web 체크리스트 추가
- [ ] 로그인·세션: 공통 계약 → Android → PC Web → Mobile Web 체크리스트 추가
- [ ] 초대·딥링크: 공통 계약 → Android → PC Web → Mobile Web 체크리스트 추가
- [ ] 공통 회귀: Web production build, Android production build, 동일 테스트 계정의 PC/Mobile 브라우저·Android 실기기 검증

## 8. iOS·Apple 플랫폼

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `IOS-000` | iOS 네이티브 셸·홈·일정 등록 1차 기반 | `✅ 완료` | 2026-06-18 | 2026-06-18 | Swift 네이티브 API client, 홈, 일정 Sheet, 라우팅 기반 |
| [ ] | `IOS-001` | 운영 API 실제 계정 회귀 | `⬜ 대기` | — | — | 네이티브 셸 전환 뒤 홈 요약·일정 등록·세션 유지와 공통 API 오류 계약 검증 |
| [ ] | `IOS-002` | EventKit 캘린더 UX | `🟠 장기 일정 보정·실기기 가져오기 대기` | 2026-07-28 | — | EventKit의 종료일 배타 규칙을 반영해 7일 종일 일정이 7일 모두에 노출되고 종료 다음 날에는 제외되도록 공통 기간 겹침 조회를 추가했다. iOS 월/예정/홈/공간 표시는 날짜 범위·기간을 표시하고, 종일 일정 편집은 저장된 배타 종료일을 사용자용 포함 종료일로 변환한다. 기존 실기기 내보내기 CRUD·중복 정리는 통과. 실제 iPhone 장기 일정 가져오기→전체 기간 표시, 재조회 중복 차단, 권한 거절 UX를 확인한 뒤 완료 처리 |
| [ ] | `IOS-003` | APNs·알림 운영 설정 | `🔴 Firebase APNs 키 대기` | 2026-07-29 | — | 유료 Team entitlement·실기기 APNs/FCM 토큰 등록은 통과했다. 직접 FCM 발송은 `THIRD_PARTY_AUTH_ERROR`로 실패한다. Apple `.p8` 발급, Firebase 등록, Debug/TestFlight 수신·탭 회귀 절차는 `docs/31-ios-apns-xcode-release-guide.md`; 전달 감사는 `docs/29-notification-delivery-audit.md` |
| [ ] | `IOS-004` | Universal Links 재활성화 | `⬜ 대기` | — | — | Associated Domains·AASA·초대/알림 링크 실기기 검증 |
| [ ] | `IOS-005` | 가족·자녀 capability 동등화 | `🟠 코드 완료·실계정 회귀 대기` | 2026-07-28 | — | 기존 가족 관계/권한 분리를 재사용하고 가족 초대 유형 선택, 자녀 목록·등록, 보호자 8자리 OTP·필수 동의, 일회성 링크 공유, 로그인 전 경로 보존, 자녀 claim, 보호자 승인/거절을 SwiftUI와 공통 API 8개에 연결했다. Debug·Release와 화면 QA 통과. 보호자·자녀 실계정 전체 회귀 후 완료 처리 |
| [ ] | `IOS-006` | TestFlight/App Store 출시 | `🟠 1.0 승인·1.0.1 빌드 4 준비` | 2026-07-29 | — | `1.0.1 (3)` 업로드는 완료됐으나 AdFit dSYM 누락 경고가 발생했다. App Store Connect 1.0.1 버전·업데이트 설명·심사 노트·App Privacy·광고 연령등급 반영 완료. dSYM 보정 빌드 `1.0.1 (4)` Archive/Upload→TestFlight 실계정 원장·푸시·ATT/AdFit 회귀→업데이트 심사 순으로 진행 |
| [x] | `IOS-007` | Xcode·서명·capability·권한 기준선 | `✅ 완료` | 2026-07-23 | 2026-07-29 | Apple Developer Program Team `JBN99YZ7KN`의 새 Development 인증서·profile로 bundle `com.gleaum.app`을 서명했다. Debug 앱의 Push `development`, Apple 로그인, Associated Domains entitlement와 profile capability, 연결 iPhone 포함, 설치·실행을 확인했다. `xcodebuild archive` Release 구성도 Development profile로 성공했다. Archive의 `aps-environment=development`, `get-task-allow=true`를 확인했으며 App Store Distribution export·TestFlight는 `IOS-006` 범위다 |
| [ ] | `IOS-008` | 네이티브 인증·세션 마감 | `🟠 Production 2차 보정 완료·실계정 회귀 대기` | 2026-07-27 | — | Apple 인증 사용자는 이름·이메일 재입력 없이 3단계 온보딩으로 이동한다. 1차 정책 추가 뒤에도 `space_members: account capability insert`가 RESTRICTIVE로 모든 INSERT에 AND 적용되어 신규 계정을 차단했다. `20260730040500_allow_owner_membership_through_capability_guard.sql`을 운영 적용해 본인이 소유한 공간의 초기 admin 등록만 capability guard에서도 허용했다. authenticated 역할 INSERT·ROLLBACK 검증, Next Production build 65/65, Production `dpl_ARUQd7ftK9SfbZBTxSStuCrL8KKZ` READY·`www.gleaum.com` alias·미인증 API 401 확인. 신규 Apple·Google·이메일 실계정 전체 회귀 후 완료 처리 |
| [ ] | `IOS-009` | SwiftUI 단일 앱 셸·라우터·선조회 | `🟠 1차 기반 구현·iPhone 검증` | 2026-07-27 | — | SwiftUI `IOSAppRootView`가 실제 window root를 소유하며 launching/signedOut/onboarding/authenticated/offline 상태를 단일 관리한다. 인증 세션 확정 뒤 `/api/native/profile`의 `onboardingCompleted`를 확인해 신규 소셜 사용자를 네이티브 온보딩으로 분기한다. Launch Screen·브랜드 전환·로그인 공식 BI, `StartupSnapshotStore` 병렬 선조회·5분 캐시·부분 실패, 시스템 `TabView` 5탭, SwiftUI 홈 1차를 구현했다. Capacitor는 지연 생성되는 레거시 화면 폴백으로 축소했다. 다음은 탭별 네이티브 화면으로 폴백 제거 |
| [x] | `IOS-010` | 핵심 기능 네이티브화 | `✅ 완료` | 2026-07-27 | 2026-07-28 | 홈·온보딩·일정·공간·개인 가계부·알림·전체 메뉴의 핵심 사용자 흐름에서 WebView 폴백을 제거했다. 전체 메뉴는 프로필, 화면 모드, 알림, 생체인증 앱 잠금, 비밀번호, 계정 탈퇴/복원, 로그아웃을 공통 API와 로컬 보안 계약에 연결했다. 약관·개인정보 원문만 서버 HTML을 전용 인앱 `WKWebView`로 표시한다 |
| [ ] | `IOS-011` | iPhone·테마·접근성 QA | `🟠 라이트 표면·탭 바 safe-area 보정 완료` | 2026-07-28 | — | 실제 iPhone 16 Pro에서 5개 탭 이동, 시스템/라이트/다크와 상태바 전환을 확인했다. 2026-07-28 라이트/시스템에서 홈·공간의 정보 영역이 평면으로 합쳐지던 문제를 가계부와 동일한 흰색 semantic surface와 얇은 경계로 보정했다. 일정·소식·가계부 역할 색은 배경이 아닌 아이콘·제목에만 사용한다. 플로팅 탭 바의 전체 높이를 스크롤 영역에 예약해 마지막 콘텐츠·고정 하단 액션 충돌을 제거했다. 축소는 실제 24pt 이상 스크롤된 뒤 시작하고 역방향 30pt에서 복원해 짧은 목록의 rubber-band 재확장을 차단했다. 접근성 트리는 4/5탭 각각 독립 버튼·선택 상태와 공간 보조 메뉴를 확인했다. 소형/대형 iPhone, Reduce Motion·VoiceOver 실음성, 오프라인/세션 회귀가 남음. iPad·Split View는 후순위 |

| [ ] | `IOS-012` | Crashlytics·Performance Monitoring 운영 계측 | `🟡 코드·빌드 완료 / 콘솔 검증 대기` | 2026-07-30 | — | iOS SPM 선택 연결, Crashlytics dSYM 업로드 Build Phase, Performance 자동 수집, Privacy Manifest·개인정보처리방침 정합화, Debug·Release 무서명 빌드 및 Release 앱·dSYM UUID 일치 검증 완료. 다음은 실기기 `-GleaumCrashlyticsTest` 수신과 Firebase Performance 대시보드 확인. 상세 `docs/34-ios-observability-app-store-privacy.md` |
| [ ] | `IOS-013` | 자녀 초대 전달 수단·일정 공간 선택 UX | `🟠 코드·Simulator 빌드 완료 / 실기기 회귀 대기` | 2026-08-03 | — | 자녀 초대에 기기 공유·문자·로컬 QR·링크 복사를 제공하고, 새 일정의 `공유`를 `공간`으로 변경했다. 공간 없음은 개인 일정 전환 안내, 복수 공간은 명시 선택, 공간 화면은 권한 있는 사용자에게 해당 공간 일정 추가를 제공한다. iOS Simulator Debug build와 diff check 통과. 실제 iPhone 문자/카카오/QR, 개인·복수·가족 공간 저장 회귀 뒤 완료. Android 전달 선택 UI·일정 공간 선택은 후속 |
| [ ] | `IOS-014` | Kakao AdFit 앱 전환 광고·UI 버튼 가림 감사 | `🟠 코드·스토어 고지·dSYM 보정 완료 / 실기기·빌드 4 대기` | 2026-08-03 | — | 공식 SPM `AdFitSDK 3.21.24`와 단위 `DAN-8GjjSLh3IXRv8FGt` 구현, ATT·자녀 제외·신고 경로·하단 UI 보정 완료. App Store Connect App Privacy에 User ID·Device ID 추적 및 Advertising Data·Product Interaction 광고 목적을 Publish하고 연령등급 Advertising=Yes, 1.0.1 검토 노트를 저장했다. Organizer의 AdFit dSYM 누락 경고는 공식 dSYM Vendor 고정+UUID 검증 Build Phase로 보정했으며 무서명 Archive에서 프레임워크/dSYM UUID 일치를 확인했다. 빌드 4 업로드와 실제 iPhone ATT 허용·거부, 광고 수신·닫기·오늘 그만 보기·no-fill, 자녀 미노출·광고 신고 확인이 남음 |
| [ ] | `IOS-015` | 약관·개인정보 인앱 문서 스크롤·테마 정합화 | `🟠 코드·빌드 완료·실기기/Production 대기` | 2026-08-04 | — | `?app=1`·`platform=ios`를 앱 문서 모드로 인식하고 웹 로고·홈 링크·푸터를 제거했다. 법적 문서의 배경·본문·표·경계를 공통 라이트/다크 토큰으로 전환하고 WKWebView와 HTML root의 세로 스크롤을 명시했다. iOS Simulator build와 Next build 통과. Production 배포 후 실제 iPhone에서 약관/개인정보 끝까지 스크롤·양 테마·닫기 동작을 확인해야 완료 |

상세 계획: `docs/16-ios-native-roadmap.md`, 재개 감사: `docs/27-ios-resumption-readiness.md`

## 9. 백오피스·CRM·광고

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `BO-000` | KPI·회원/공간 상세·FCM 캠페인·광고 CRUD 기반 | `✅ 완료` | 2026-05-12 | 2026-07-16 | 현재 라우트와 데이터 연동 코드 존재. 운영 배포 검증은 `OPS-003`에서 수행 |
| [ ] | `BO-001` | 대시보드 추세·구성비 차트 | `⬜ 대기` | — | — | WAU와 가계부/캘린더 지표 정의·기간 필터·빈 상태 구현 |
| [ ] | `BO-002` | CRM SMS 채널 | `⏸ 보류` | — | — | 제공사·비용·수신 동의/거부 정책 결정 후 재개 |
| [ ] | `BO-003` | CRM 이메일 채널 | `⏸ 보류` | — | — | 제공사·도메인 인증·수신 동의/거부 정책 결정 후 재개 |
| [ ] | `BO-004` | 광고 성과 차트·상세 통계 | `⬜ 대기` | — | — | 노출/클릭 이벤트 신뢰성 검증 후 기간·플랫폼·슬롯 분석 구현 |
| [ ] | `BO-005` | 인앱 팝업 광고 서비스 컴포넌트 | `⏸ 보류` | — | — | 노출 빈도·닫기·아동 계정 광고 정책 확정 후 재개 |
| [ ] | `BO-006` | 캠페인 다중 기기 발송·네이티브 딥링크·클릭 추적 | `🟠 코드·빌드 완료·배포 회귀 대기` | 2026-07-29 | — | `fcm_tokens` 다중 기기, 공간 수신 설정, Web/Native 목적지 분리, 인증된 네이티브 클릭 기록, 명시적 무효 토큰 정리를 구현했다. 메인·백오피스 Production 배포 후 격리 캠페인 도달·실패·클릭을 검증한다 |

상세 문서: `backoffice/docs/03-current-status.md`

## 10. 장기 후보

| 체크 | ID | 작업 | 상태 | 재개 조건 |
|---|---|---|---|---|
| [ ] | `LONG-001` | Apple/Kakao 소셜 로그인 | `⏸ 보류` | 사용자 요구·전환율 근거와 운영 계정 준비 |
| [ ] | `LONG-002` | macOS/Catalyst 앱 | `⏸ 보류` | Android·iOS 안정화와 데스크톱 수요 확인 |
| [ ] | `LONG-003` | Space 타입·템플릿 고도화 | `⏸ 보류` | 가족 capability 안정화 후 연인/모임 요구사항 확정 |

## 11. 완료된 기반 요약

세부 과거 이력은 `docs/07-features-completed.md`가 보관한다. 현재 작업 판단에 필요한 기준점은 다음과 같다.

- 웹 서비스 운영, Google/이메일 인증, 개인·공유 공간, 일정·가계부·알림 기반 완료
- Android Google Play 배포 이력과 주요 Compose Material 3 화면 기반 완료
- iOS 네이티브 로그인·셸·홈·일정 등록 1차 기반 완료
- 백오피스 KPI·회원·공간·캠페인·릴리즈·Remote Config·광고 관리 기반 완료
- 가족·자녀 사전등록·보호자 이메일 확인·초대·최종 승인 기반과 migration 020~022 운영 적용 기록 완료

## 12. 작업 일지

작업 일지는 최신 항목을 위에 추가한다. `완료`뿐 아니라 `진행`, `차단`, `의사결정`도 남긴다.

| 날짜 | 관련 ID | 구분 | 기록 | 검증·다음 행동 |
|---|---|---|---|---|
| 2026-08-04 | `AUTH-002`, `FAM-012` | Kakao 로그인·자녀 identity 구현 | Android 로그인에 Kakao 공식 패턴 버튼과 Supabase OAuth Custom Tab을 추가하고 기존 `gleaum://auth/callback` 세션 저장·초대 경로 보존을 재사용했다. iOS는 `ASWebAuthenticationSession` 소셜 coordinator를 Google/Kakao 공통화하고 Kakao 버튼을 추가했다. 자녀 claim/승인 RPC는 `auth.identities`의 Apple·Google·Kakao·email을 검증하며 이메일을 제공하지 않는 Kakao 계정도 허용하되, 보호자가 제한 이메일을 지정한 경우 확인된 동일 이메일을 계속 강제한다. 개인정보처리방침과 `docs/37-kakao-login-operations.md`를 갱신했다 | Android `assembleDebug`, iOS Simulator Debug, Next Production 65/65, 대상 ESLint·diff check 통과. 운영 migration은 명시적 적용 승인 전 보류했다. Kakao Developers REST 키/secret/callback, Supabase Kakao Provider·`Allow users without an email`, `gleaum://auth/callback` allow-list 설정과 migration·Advisor·실계정 회귀가 남았다 |
| 2026-08-04 | `WEB-017` | 앱 다운로드 페이지 전면 리뉴얼 | 모바일 전용 단일 다크 카드와 3초 강제 스토어 이동을 제거하고 공개 랜딩과 같은 디자인 언어로 PC 2컬럼·Mobile 단일 흐름을 각각 구성했다. 실제 Android 홈·iPhone 일정 화면, 기기별 추천 CTA, 양 스토어 선택, 핵심 기능·설치 3단계·개인/공간 데이터 경계 안내를 연결했다. 페이지 자체 스크롤 컨테이너와 다크모드 토큰을 적용하고 전역 푸터 중복을 차단했다 | 대상 ESLint·TypeScript·Next 65/65 build 통과. Production `dpl_6Mm1L8vWpz7GaHRjw3XJQjiedira` READY·`www` alias 완료. 운영 1440×1000과 iPhone 390×844에서 가로 넘침 0, 모바일 `scrollTop=3358/4202`, 푸터 1개, canonical과 Google Play·App Store 링크를 확인 |
| 2026-08-04 | `FAM-012`, `WEB-012`, `IOS-004` | 자녀 초대 앱 연결·메신저 인앱 브라우저 보정 | 단순 `gleaum://` 링크와 중간 다운로드 페이지만 제공하던 초대 브리지를 앱 열기→자녀 계정 로그인→연결 요청→보호자 승인 단계로 개편했다. Android는 package 지정 intent와 Play Store 폴백, iOS는 custom scheme·초대 URL Smart App Banner, 모바일은 OS별 스토어 직접 링크를 사용한다. 앱 실행 실패는 자동 스토어 이동 대신 안내를 표시하고 KakaoTalk 등 인앱 브라우저는 Android 외부 Chrome 열기 또는 iOS Safari 메뉴·링크 복사를 제공한다. 일반 공간 초대도 같은 브리지 계약으로 통일했다 | 대상 ESLint·TypeScript, Next Production build 65/65 통과. Production `dpl_7xrPbBdmofA3BBzYna6pYxWopSoR` READY·`www` alias 완료. 운영 390×844 iOS Safari UA에서 `scrollWidth=390`, `main 844/1067`, KakaoTalk Android UA에서 오류 없이 `main 844/1246`을 확인했다. AASA·assetlinks redirect 없는 200, 초대 Smart App Banner·noindex도 확인. 실제 Android/iPhone의 설치됨/미설치·로그아웃/로그인·카카오톡 링크 회귀가 남음 |
| 2026-08-04 | `AND-012`, `IOS-015`, `WEB-016` | 광고 성과 기반·양 스토어 공개 웹·인앱 법적 문서 보정 | Android 1.1.10에 Play Install Referrer와 개인정보 최소화 전환 이벤트를 연결하고 자녀/제한 계정 측정을 차단했다. 공개 랜딩의 Android/iPhone 카드를 각 스토어 직접 링크로 통일했다. iOS 약관·개인정보는 앱 전용 쿼리를 인식해 웹 헤더를 제거하고 테마 토큰·세로 스크롤을 적용했다. 유지 브리지와 종료 대상 페이지를 `docs/36-android-attribution-and-web-bridge-audit.md`에 고정했다 | Android Kotlin compile, Next production build 65/65, iOS Simulator Debug build 성공. Production `dpl_CpJ37RAwauGgMpJCQtgP5jRQ2oPH` READY, 운영 루트·양 스토어·법적 문서·compat 경계 확인. 다음은 iPhone 실기기 문서 스크롤과 Firebase/Google Ads 콘솔 연결이다. Meta/MMP·웹 `enforce` 전환은 보류하며 App Check는 토큰 보급→monitor→enforce 확인 전 강제 금지 |
| 2026-08-03 | `IOS-014`, `WEB-013` | iOS 광고 고지·App Store 웹 연결 | 개인정보처리방침에 iOS AdFit 수집 항목, ATT 허용·거부와 철회 경로, 자녀/제한 계정 광고 제외, 부적절 광고 신고 경로를 보완했다. iOS 전체 메뉴에서 공개 고객지원 문의를 인앱으로 열고 `오류·광고 신고`로 접수하도록 연결했다. 공개 다운로드·랜딩·메타데이터·구조화 데이터·모바일 설치 배너에 App Store ID `6795727692`를 반영했다 | Next production build 65/65와 iOS Simulator Debug build, diff check, PrivacyInfo.xcprivacy·Info.plist lint를 통과했다. 운영 배포 후 `/download` iPhone 자동 이동·데스크톱 양 스토어 노출·개인정보처리방침 200을 확인한다. App Store Connect에서는 User ID·Device ID 추적과 Advertising Data·Product Interaction 목적을 Publish한 뒤 심사 제출한다 |
| 2026-08-03 | `IOS-014`, `IOS-011` | iOS AdFit 앱 전환 광고·하단 버튼 가림 보정 | iOS SPM에 Kakao `AdFitSDK 3.21.24`를 고정 연결하고 앱 전환 광고 단위 `DAN-8GjjSLh3IXRv8FGt`를 인증·온보딩 뒤 홈 최초 진입에 연결했다. 일반 계정의 광고 capability를 서버 기준으로 재확인하며 프로세스당 1회, 세로 iPhone·활성 앱·잠금 해제 상태에서만 요청한다. ATT 미결정 상태는 홈 진입 뒤 시스템 동의를 요청하고 자녀/제한 계정·iPad·가로·Debug 미리보기는 제외한다. 플로팅 탭 바는 콘텐츠 위 오버레이로 유지하고 스크롤 콘텐츠에 투명 하단 여백만 예약해 고정형 하단 배경 회귀를 제거했다 | iPhone 17 Pro iOS 26.5 Simulator에서 공간·가계부의 확장/축소 탭 바, 홈 인디케이터 뒤로 이어지는 콘텐츠, 공간 자금 기록·새 소식 작성, 가계부 마지막 거래가 겹치지 않고 좌우 검은 띠가 없음을 확인했다. Debug Simulator·Release iphoneOS 무서명 build 성공, 번들의 `NSUserTrackingUsageDescription`, `AdFitSDK.framework/PrivacyInfo.xcprivacy` 포함 확인. 다음은 App Store Connect 개인정보/추적 Publish와 실제 iPhone ATT 허용·거부·AdFit 수신/no-fill/닫기/오늘 그만 보기·자녀 미노출 회귀다 |
| 2026-08-03 | `FIN-001`, `FIN-002`, `NOTI-001`, `WEB-010` | 자금·정기지출·알림 연결 감사 | 공간 결제는 사본 없이 한 원장 행을 개인/공간이 함께 조회하는 모델로 확정했다. 코드·운영 DB·Supabase pg_cron/pg_net·Vercel Production 로그를 대조한 결과, 공간 일정/지출 즉시 푸시는 Desktop Web 일부에만 클라이언트 의존으로 존재하고 네이티브 API에는 없었다. 5개 크론은 활성·최근 7일 성공/API 200이지만 정기지출·연체·주간 다이제스트가 레거시 `schedules`를 조회해 네이티브 원장과 단절되어 있다 | 운영 원장 24건 중 pending 기한 경과 4건, 정기 12건 모두 `recur_rule_id` 없음, 레거시 일정과 동일 조건 원장 16건, 최근 14일 notifications 1건을 확인했다. 다음은 서버 알림 이벤트/다중 토큰 통합 → 원장 수명주기 migration/API → Android/iOS 결제 확인 UI → 격리 실계정 수신·딥링크 회귀 순서 |
| 2026-08-03 | `FIN-001`, `FIN-002`, `NOTI-001` | 단일 원장·정기 수명주기·서버 알림 구현 | 운영 DB에 알림 `dedupe_key`와 원장 `due_at`/`settled_at` migration을 적용하고 누락값 0건·반복 규칙 누락 0건·대상 인덱스 6개를 확인했다. 일정/공간 자금 생성 알림을 서버 이벤트로 이동하고 수신 설정, 다중 기기+legacy 토큰, 무효 토큰 정리를 통합했다. 반복 선생성·연체·주간 요약은 원장 기준으로 교체했다. Android/iOS는 공간 자금 요약·등록, 실제 결제일 확인·이번 회차 건너뛰기·정기 중지, 거래 딥링크를 구현했고 타 멤버 상세는 읽기 전용이다 | Next Production build 65/65, 데이터 경계 9/9·capability 4/4·가족 3/3·일정 기간 4/4, Android Kotlin compile, iOS Simulator Debug build, diff check 통과. 앱 버전은 Android `1.1.7 (28)`, iOS `1.0.1 (3)`으로 준비했다. Production API/크론 배포와 두 플랫폼 실기기 푸시·D-day·월경계 회귀, 기존 레거시 중복 16건의 사전 백업형 보정은 남음 |
| 2026-08-03 | `IOS-006`, `IOS-014` | App Store 1.0.1 광고 메타데이터·AdFit dSYM 보정 | App Privacy에 Advertising Data 추가, User ID·Device ID 추적, Product Interaction 광고 목적을 Publish하고 제품 페이지 Preview의 `Data Used to Track You`를 확인했다. 연령등급 `Advertising=Yes`와 계산 결과 4+를 저장하고 iOS `1.0.1` 버전·업데이트 설명·광고/ATT 심사 노트를 생성했다. 공식 AdFit 3.21.24 기기 dSYM을 Vendor에 고정하고 Archive Build Phase에서 UUID를 검증해 포함하도록 보정했다 | `1.0.1 (3)`은 업로드 성공했지만 dSYM 경고가 남으므로 선택하지 않는다. 무서명 Release Archive의 AdFit 프레임워크·dSYM UUID `8EB76FB6-0E7C-30C7-83D1-E7C65BF5717B` 일치 확인. 다음은 `1.0.1 (4)` 서명 Archive/Upload, Advertising Identifier 질문 Yes, TestFlight 실기기 ATT/광고/푸시 회귀 후 Add for Review |
| 2026-08-03 | `IOS-013`, `FAM-012`, `FIN-001` | 자녀 초대 전달·일정 공간 선택 구현 / 자금 경계 제안 | iOS 자녀 초대 발급 뒤 문자·설치 앱 공유·로컬 QR·링크 복사를 한 화면에 제공했다. 일정 생성은 `공유` 대신 `공간`을 사용하고 권한 있는 복수 공간을 명시 선택하며, 대상 공간이 없으면 개인 일정 전환을 제공한다. 공간 화면에는 활성 공간이 미리 선택된 일정 추가 액션을 연결했다. 개인 가계부와 공간 자금은 자동 혼합하지 않고 실제 본인 부담액만 명시 반영하는 제품안을 기록했다 | generic iOS Simulator Debug build·대상 diff check 통과. 실제 iPhone의 문자/카카오/QR와 개인·복수·가족 공간 저장, Android 전달 선택·일정 공간 UX 동등화가 남음. `FIN-001`은 사용자 방향 확정 전 구현 금지 |
| 2026-08-03 | `FAM-011`, `FAM-013`, `IOS-005` | 보호자 필수 동의 운영 500 긴급 복구 | Vercel Production에서 `/api/spaces/children/guardian-verification/complete` 500 2건과 `column reference "dependent_id" is ambiguous`를 확인했다. 7월 29일 named constraint 보정 뒤에도 `UPDATE public.family_relationships WHERE dependent_id = ...`가 `RETURNS TABLE` 출력 변수와 충돌했다. 테이블 alias로 조건 열을 완전히 한정한 `20260803000531_fix_guardian_consent_qualified_update.sql`을 운영 Supabase에 적용했다 | iOS·Android 모두 같은 API와 동일 consent payload를 사용한다. 합성 challenge를 만든 뒤 성공 RPC 전체를 실행하고 예외 subtransaction으로 롤백하는 검증 통과, 합성 행 0건·재시도 가능한 실제 verified challenge 1건 확인. 앱 업데이트 없이 기존 화면에서 재시도 가능. 실제 iOS 완료 후 Vercel 500 0건, 이어 Android 전체 흐름을 확인해야 완료 |
| 2026-07-30 | `IOS-008`, `OPS-004` | 신규 소셜 계정 온보딩 500 2차 복구·Production 배포 | 1차 INSERT 허용 정책 이후에도 RESTRICTIVE capability 정책이 신규 계정의 초기 `space_members` admin 등록을 AND 조건으로 차단하는 것을 운영 로그에서 재확인했다. `20260730040500_allow_owner_membership_through_capability_guard.sql`을 적용해 본인이 생성한 공간의 자기 admin 등록만 제한 정책에서도 예외 처리했다 | authenticated 역할로 실제 INSERT 후 ROLLBACK 성공, 정책 2종 확인, Security Advisor 재조회, Next Production build 65/65, Vercel Production `dpl_ARUQd7ftK9SfbZBTxSStuCrL8KKZ` READY·`www.gleaum.com` alias·`POST /api/native/onboarding/complete` 미인증 401 확인. 신규 Apple/Google 계정 온보딩 실테스트와 배포 후 500 로그 0건 확인이 남음 |
| 2026-07-30 | `IOS-006`, `IOS-008`, `DB-SEC-006` | TestFlight 온보딩 500 복구·App Store 빌드 2 재심사 | TestFlight 빌드 1의 Google 인증 뒤 `/api/native/onboarding/complete` 500을 Vercel·Supabase 운영 로그로 추적했다. 개인 공간 생성은 성공했지만 초기 `space_members` admin UPSERT가 순환 RLS로 403이 되어 완료가 중단됐다. `20260730023130_fix_native_onboarding_owner_membership.sql`을 운영 적용해 `created_by=auth.uid()`, `user_id=auth.uid()`, `role=admin`인 최초 등록만 허용했고 정책 존재를 확인했다. 기존 빌드 1도 재시도 가능하다. 이어 버전 `1.0 (2)` Archive·업로드, 심사 빌드 교체, 추적 없음 Privacy 게시·연령등급 `No` 확인, 영문 심사 노트·리뷰 답변과 재제출을 완료했으며 App Store Connect 상태는 `Waiting for Review`다 |
| 2026-07-30 | `IOS-006`, `IOS-008` | App Review 핵심 거절 사유 보정 | Apple 인증 결과의 일회성 이름을 온보딩 컨텍스트로 보존하되 Apple 사용자의 이름·이메일 재입력 단계를 완전히 제거했다. Apple은 사용 목적·홈 구성·알림 3단계, Google/이메일은 기존 4단계를 유지한다. 온보딩 완료 API는 profile/개인 공간 조회 오류를 명시 처리하고 네트워크·408·429·5xx에 한해 1회 재시도하며 서버에 비식별 오류 로그를 남긴다 | generic iOS Simulator Debug, iPad Air 11-inch M4 iOS 26.5 지정 build, compatibility mode 설치·실행과 첫 화면 `1 / 3`·하단 safe area, Next production build 65 routes 및 diff check 통과. 운영 API 배포와 신규 Apple 실계정의 완료→홈 진입, TestFlight iPad 회귀는 남음 |
| 2026-07-30 | `IOS-012` | Crashlytics·Performance Monitoring 연결 | iOS SPM에 Crashlytics와 Performance를 선택 연결하고 dSYM 업로드 Build Phase, Debug 전용 명시적 테스트 충돌, Privacy Manifest·개인정보처리방침·App Store 개인정보 신고 기준을 반영했다. iOS 광고 SDK와 ATT는 최초 승인 뒤 별도 버전으로 유지한다 | Xcode의 중복 LLDB Attach 세션을 종료하고 Scheme의 테스트 인자 비활성·자동 Launch·Debug executable 정상값을 확인했다. 연결 iPhone 재실행 Launch 리포트는 Success. 다음은 최신 SSD 소스 Debug·Release/dSYM 검증과 Firebase Console 실제 수신 |
| 2026-07-29 | `WEB-014`, `WEB-015`, `LEGAL-001`, `SEC-009` | 고객지원·기능 안내·공개 웹 최적화 | 공개 고객지원에 검색 가능한 FAQ와 회원/비회원 Q&A 양식을 추가하고 개인정보 동의·서버 검증·남용 제한·Service Role 전용 저장 경계를 적용했다. 관리자 백오피스에는 상태별 문의함과 SMTP 이메일 답변을 추가했다. 운영 migration 2개와 RLS/grant/index를 검증했다. 실제 앱 화면을 사용하는 7개 기능 안내와 활용 절차, canonical·이미지 sitemap·JSON-LD·보안 헤더·백오피스 noindex를 구성하고 공개 운영 주체 표기를 글리움/글리움 운영팀으로 정리했다. root/backoffice Next `16.2.12`, PostCSS `8.5.24`, Nodemailer `9.0.3`으로 갱신했다 | root/backoffice production build·TypeScript·대상 lint, PC 1440×900·Mobile 390×844 시각 검증 통과. Production root `dpl_8mkfh6MtiHkBr7niDiAsKejwhP6d`, backoffice `dpl_HhjB8YU9fdTbTWHPLA8JnyNS6Xwi` READY·alias 완료. support/features/가족 상세/sitemap/robots 200, cross-origin 403, 문의 201·DB 저장/삭제, 관리자 307·noindex, 런타임 오류 0건 확인. SMTP 환경변수·답변 실메일 회귀와 검색 콘솔 색인 관측이 남는다. FAQ 구조화 데이터는 의미 전달용이며 순위를 보장하지 않는다. 법적 적정성은 유료 거래 전 별도 검토. App Check enforce 전환 미완료 |
| 2026-07-29 | `WEB-012`, `WEB-013` | 대표 도메인·앱 링크·검색 소유권 정합화 | 대표 도메인을 `https://www.gleaum.com`으로 통일하고 공개 랜딩의 Web 제공 카드를 제거했다. Naver 소유권 토큰을 신규 `www` 등록값으로 교체하고 새 초대·다운로드 링크도 `www`를 사용한다. apex의 `assetlinks.json`이 redirect되어 Google 검증 조건을 위반하므로 Android App Links와 iOS Associated Domains는 `www`만 선언한다. 현재 Play 배포본의 WebView fallback을 보호하기 위해 웹앱 종료 redirect는 환경변수 기반 compat를 기본으로 유지한다 | Next production build 56/56·대상 lint·Android merged manifest·iOS entitlement plist 통과. Production `dpl_DgpTiWF1yECoMKBfLsnkebwZ2d2S` READY·`www.gleaum.com` alias 완료. 운영 HTML의 신규 Naver 태그/canonical/OG, Web 제공 문구 0건, robots/sitemap `www`, `www` assetlinks `200 application/json`, compat 기능 경로 200 확인. Google DAL API는 `www` statement를 정상 반환하고 apex는 `ERROR_CODE_REDIRECT`로 재현했다. Play 경고 해소는 다음 Android 릴리스에서 최종 확인 |
| 2026-07-29 | `WEB-012`, `SEC-010` | 웹앱 종료 경계·초대 브리지·App Check 서버 기반 | 웹 제공 범위를 랜딩·다운로드·지원·법적 문서·일반/자녀 초대·보호자 동의로 축소하고 기존 로그인·홈·일정·공간·가계부·설정 경로는 다운로드 안내로 전환했다. 공개 레이아웃에서 Supabase 세션·FCM·PWA를 제거하고 종료용 Service Worker, noindex/no-store, 축소 CSP를 적용했다. 일반/자녀 초대는 브라우저 인증·join 대신 앱 딥링크를 사용하며 Android/iOS 일반 초대 라우팅을 연결했다. 네이티브 API에는 Firebase App Check JWT 검증과 off/monitor/enforce 모드를 추가했다 | Next production build 56/56·대상 lint·Android compileDebugKotlin·iOS Simulator Debug build 통과. 로컬 production HTTP에서 공개 경로 200, 종료 경로 307→download+noindex/no-store, 브라우저 join 410, 무인증 native API 401을 확인했다. 운영 배포와 일반/자녀 초대·보호자 동의·기존 PWA 해제 회귀가 남았다. Android/iOS가 `X-Firebase-AppCheck`를 보내기 전에는 enforce 금지. 상세는 `docs/32-web-service-retirement-security.md` |
| 2026-07-29 | `IOS-002`, `IOS-003` | 스케줄 뷰 빌드 경고·APNs 런타임 로그 판별 | 장기 일정 필터에서 시작일 존재 여부만 확인하면서 사용하지 않던 `date` 바인딩을 불리언 검증으로 교체해 Xcode Issue Navigator 경고를 제거했다. 화면 로그의 APNs entitlement 오류는 코드/프로파일 누락이 아니라 entitlement가 없는 unsigned Simulator 산출물에서 발생한 것으로 확인했다 | Simulator Debug build 성공 및 해당 Swift 경고 0건. 현재 Debug iphoneos 앱과 embedded provisioning profile에는 `aps-environment=development`, Team `JBN99YZ7KN`이 모두 포함됨. 실제 APNs 검증은 서명된 실기기/TestFlight 빌드에서 진행 |
| 2026-07-29 | `IOS-002`, `IOS-003`, `IOS-006` | 장기 캘린더 기간 보정·iOS 배포 실행 가이드 | EventKit 종일 종료일의 배타 규칙과 앱 조회가 어긋나 7일 일정이 시작일 하루로 축약되던 문제를 수정했다. 공통 기간 겹침 조회를 홈/캘린더에 적용하고 iOS 월/예정/홈/공간 표시와 종일 편집 종료일을 보정했다. APNs `.p8` 발급→Firebase 연결→실기기·TestFlight 검증, Xcode General/Signing/AppIcon/Launch Screen, Archive/Validate/Upload 절차를 프로젝트 실값으로 문서화했다 | 기간 단위 테스트 4건, 대상 lint, TypeScript, Next production build 56/56, generic iOS Simulator Debug·Release build 통과. 실제 iPhone의 7일 일정 가져오기·전체 기간 표시와 Firebase APNs 키 등록·Production 푸시, Distribution Upload는 외부 실행 대기 |
| 2026-07-29 | `IOS-006` | App Store Connect 입력 가이드 보강 | 실제 iOS SPM·Privacy Manifest와 Apple 공식 문서를 대조해 연령등급 7단계·Additional Information, 비면제 암호화 없음, EU DSA·국가별 허가, StoreKit 미사용에 따른 Server Notifications 공란, App Privacy 8개 데이터 유형별 목적·연결·추적 답변을 확정 | 현재 iOS 타깃에는 Firebase Messaging만 연결되고 광고·StoreKit·Crashlytics·Performance는 연결되지 않음을 정적 확인. App Store Connect 실제 입력과 최종 Archive Privacy Report 대조가 남음 |
| 2026-07-29 | `FAM-011`, `IOS-006` | 보호자 동의 운영 오류 복구·App Store 준비 시작 | 보호자 필수 동의 완료 API의 운영 500을 Vercel runtime에서 추적해 `complete_guardian_email_consent`의 `RETURNS TABLE` 출력명과 `ON CONFLICT (dependent_id, ...)` 모호성 충돌을 확인했다. named constraint로 변경한 migration을 운영 Supabase에 적용하고 anon 실행 차단/authenticated 실행 허용을 재확인했다. 동시에 App Store 한국어 등록정보·Privacy·연령·심사 노트, `/support`, 1024 불투명 아이콘과 6.9형 1320×2868 스크린샷 6장을 준비했다 | 실패 요청의 OTP 확인 증적은 남아 있지만 기존 challenge는 현재 만료되어 새 확인 코드를 요청한 뒤 전체 흐름을 재시도해야 한다. migration 정적 검증, iOS Simulator Debug build, 이미지 6장 크기·알파 0 확인. 다음은 실계정 동의 재시도, `/support` 운영 200, Distribution/TestFlight/APNs 회귀 |
| 2026-07-29 | `IOS-003`, `IOS-007`, `PAR-001`, `WEB-010`, `BO-006` | 유료 Apple 서명 복구·알림 전달/딥링크 P0 통합 | Apple Developer Program Team `JBN99YZ7KN`의 새 Development 인증서·profile로 Push/Apple 로그인/Associated Domains가 포함된 Debug 앱을 연결 iPhone에 설치·실행했다. Android 토큰 등록·Android 13+ 권한, Web 중복 알림, 서비스 이벤트의 `notifications.destination`, Android/iOS 중앙 라우팅, 백오피스 다중 기기 캠페인·네이티브 클릭 추적·무효 토큰 정리를 통합했다. 운영 Supabase에 `notifications.destination` migration을 적용했다 | root/backoffice production build, TypeScript, 대상 lint, Android compile/unit, iOS Debug device build/install/launch와 Development 서명 Release Archive 통과. iOS FCM 토큰은 운영 등록됐으나 직접 발송이 `401 THIRD_PARTY_AUTH_ERROR`로 실패해 Firebase APNs `.p8` 등록이 외부 차단점이다. 메인·백오피스 배포, Android 새 빌드, APNs 키 등록 뒤 플랫폼별 실제 수신·탭 회귀 필요 |
| 2026-07-28 | `IOS-009`, `IOS-010`, `IOS-011` | 라이트 표면·플로팅 탭 바·공간 정보 구조 보정 | 홈의 인사/종합 일정/오늘 일정/가계부와 공간의 현재 공간/다가오는 일정/소식을 가계부와 동일한 semantic surface로 통일했다. 라이트는 흰색 카드와 hairline 경계, 다크는 공통 dark surface이며 역할 색은 아이콘·제목에만 남긴다. 커스텀 탭 바는 확장 높이 76pt를 스크롤 safe area에 명시적으로 예약하고, 실제 스크롤 24pt 이전에는 축소하지 않으며 역방향 30pt에서 복원하도록 hysteresis를 키웠다. 공간 루트에서는 멤버·관리 섹션을 제거하고 현재 공간의 점 3개 보조 메뉴 아래 `멤버·가족 초대·공간 설정`으로 이동해 일정·소식을 기본 콘텐츠로 유지했다 | iPhone 17 Pro iOS 26.5 라이트 모드에서 white surface 카드, compact 공간 헤더, 통합 보조 메뉴·멤버 sheet를 확인했다. 목록 끝까지 접근 가능한 상태에서 확장→축소 후 1.8초 유지→역방향 복원 확인. Simulator Debug·Release build와 `git diff --check` 통과. 새 실기기 빌드는 로컬 Development 인증서 갱신 뒤 재확인 |
| 2026-07-28 | `IOS-002`, `IOS-007`, `IOS-011` | 실제 iPhone EventKit CRUD·상세 탭 충돌 회귀 | iPhone 16 Pro에서 전체 캘린더 접근을 허용하고 iCloud 캘린더를 선택했다. 운영 계정에 격리 `[QA] iOS` 일정을 생성해 EventKit 추가 1건, 제목 수정 후 업데이트 1건, 서비스 일정 삭제 후 기기 일정 정리 1건, 재동기화 0건을 확인하고 QA 데이터를 모두 제거했다. 실제 가져오기 화면에서 루트 플로팅 탭 바가 하단 액션을 덮는 결함을 발견해 상세 화면 진입 중 탭 바를 숨기고 복귀 시 복원하도록 수정했다. EventKit은 매 동기화 전 저장소를 재조회하고 동일 `gleaum:schedule:{id}` 이벤트가 여러 개면 대표 1개만 남기도록 보강했다 | 실제 iPhone에서 권한·캘린더 선택·내보내기 생성/수정/삭제·테마 3종·탭 축소/복원 통과. 시뮬레이터 fixture에서 가져오기 3건·중복 1건·하단 버튼 노출과 Debug/Release build 통과. 후속 실기기용 빌드는 로컬 Development 인증서 만료/무효로 재설치가 차단돼 Xcode 계정·인증서 갱신이 필요하다. 이후 실제 기기 일정 1건 가져오기→재조회 중복 차단과 권한 거절 UX를 마감 |
| 2026-07-28 | `IOS-009`, `IOS-011` | Instagram형 적응형 플로팅 탭 바 보정 | 사용자 제공 16초 Instagram iOS 녹화를 프레임별로 대조해 요구를 재정의했다. 선택 탭 하나로 최소화하는 Apple 기본 동작을 폐기하고, iOS 18 이상의 홈·일정·공간·가계부·전체 스크롤 오프셋을 공통 상태로 연결했다. 콘텐츠를 아래로 탐색하면 모든 탭을 유지한 채 캡슐과 아이콘을 줄이고 레이블을 숨긴다. 반대 방향·목록 상단·탭 전환에서는 복원하며 접근성 글자 크기에서는 축소하지 않는다. iOS 15~17은 시스템 탭 바를 유지한다 | iPhone 17 Pro iOS 26.5에서 4탭·5탭 각각 확장→축소→역방향 복원과 중복 시스템 탭 바 제거를 확인했다. Debug·Release Simulator build와 diff check 통과. 실제 iPhone 손가락 속도에서 14pt/10pt 전환 임계값과 safe-area 촉감을 최종 회귀한다 |
| 2026-07-28 | `IOS-009`, `IOS-011` | iOS 테마·루트 제목 체계 보정 및 탭 바 1차 해석 | 화면 모드 의미색·독립 라이트/다크 미리보기와 5개 Large Title은 유지한다. 탭 바는 최초에 선택 탭 하나로 최소화하는 Apple 시스템 동작으로 해석했다 | Debug·Release와 화면 모드 QA는 통과했으나 사용자 제공 Instagram 영상 대조 결과 탭 전체를 유지하며 비례 축소하는 요구와 달랐다. 같은 날 상단의 적응형 플로팅 탭 바 구현으로 대체했으며 이 행의 시스템 최소화 방식은 재사용하지 않는다 |
| 2026-07-28 | `IOS-002`, `IOS-011` | 기기 캘린더 동기화 UX 재구성 | 기존 권한·캘린더 선택·내보내기·가져오기가 각각 분리되어 사용자가 흐름을 조합해야 했던 구조를 수정했다. 권한은 `연결 상태`로 최소화하고, 대상 캘린더·계정·`글리움 일정을 iPhone에 반영`·`iPhone 일정을 글리움에 추가`를 하나의 `일정 동기화` 섹션으로 통합했다. 기술적인 방향 화살표 제목 대신 사용 목적이 바로 읽히는 자연어와 30일·예상 일정 수·개인 일정 저장 설명을 사용한다 | iPhone 17 Pro iOS 26.5에서 라이트·다크·접근성 큰 글자 화면을 확인했고 Debug·Release Simulator build와 diff check를 통과했다. 실제 iPhone EventKit CRUD 회귀는 기존 `IOS-002` 완료 조건으로 유지 |
| 2026-07-28 | `IOS-002`, `IOS-010`, `IOS-011` | iOS EventKit 캘린더 네이티브 UX 코드 완료 | 전체 메뉴에 Apple 시스템 목록 기반 기기 캘린더 설정을 추가했다. 전체 접근 권한과 쓰기 가능 캘린더를 명시적으로 선택하고, 글리움 개인/공유 일정의 앞으로 30일 내보내기와 iPhone 일정의 선택 가져오기를 제공한다. 내보낸 이벤트에는 `gleaum:schedule:{id}` 마커를 기록해 앱 소유 이벤트만 갱신·삭제하며, 가져오기는 제목 정규화+시작시각 60초 기준으로 개인 일정 중복을 차단한다. 지출 일정은 내보내지 않고 종일 일정의 EventKit 종료일 규칙을 보존한다 | iPhone 17 Pro iOS 26.5 DEBUG fixture에서 라이트·다크·접근성 큰 글자 화면을 확인하고 generic Simulator Debug·Release build 및 diff check를 통과했다. 검증용 window 우회가 만든 검은 화면은 제거해 기존 AppDelegate 진입 흐름을 보존했다. 실제 iPhone의 iCloud/Google 캘린더 권한·계정별 CRUD·중복 회귀 뒤 `IOS-002` 완료 처리 |
| 2026-07-28 | `IOS-005`, `IOS-009`, `IOS-011`, `FAM-012` | iOS 가족·자녀 계정 연결 네이티브화 | 가족 공간의 초대 동선을 일반 가족/자녀 선택으로 분리하고 기존 `family_role` 표시와 공간 권한 분리를 유지했다. 자녀 목록·DatePicker 기반 등록, 보호자 이메일 8자리 OTP·재발송·3종 필수 동의·인앱 약관, 72시간 일회성 초대 공유, 자녀 계정 claim, 보호자 최종 승인/거절을 공통 API 8개에 연결했다. 로그인 전 `/invite/child/{token}` 경로와 `/space/children?sid=`, 보호자 동의 쿼리를 네이티브 라우터가 보존하며 승인 전에는 가족 공간 정보를 열지 않는다. 위치 수집은 명시적으로 제외했다 | iPhone 17 Pro iOS 26.5 DEBUG fixture에서 라이트·다크·접근성 큰 글자의 목록·상태·액션 배치를 확인했다. generic Simulator Debug·Release build와 diff check 통과. 보호자 실메일 OTP, 자녀 다른 계정 claim, 승인/거절 후 capability·멤버십 반영은 실제 계정 2개로 회귀한 뒤 `IOS-005` 완료 처리 |
| 2026-08-04 | `AUTH-002`, `IOS-008` | iOS 소셜 계정 연동·브랜드 스토어 뱃지 정비 | iOS [설정] 메뉴에 Kakao/Apple/Google 소셜 계정 연동 인프라(`NativeAuthClient.swift` - `fetchIdentities`, `linkIdentity`, `unlinkIdentity`) 및 UI 섹션을 구축하고 사용자 요청에 따라 미연동 버튼을 비활성화된 `연동 준비 중입니다` 뱃지 및 구글 공식 4색 로고 에셋(`GoogleGOfficial`)으로 정비했다. 웹 다운로드 및 PC 랜딩 페이지의 스토어 버튼을 Apple 및 Google Play 공식 브랜드 가이드라인 뱃지 SVG 컴포넌트로 일체 보정했고, Xcode 15/16/17 User Script Sandboxing 및 AdFit dSYM 삭제 경로 빌드 오류를 완전히 수정해 xcodebuild 통과 및 Vercel Production 배포를 마쳤다 | xcodebuild generic iOS simulator `BUILD SUCCEEDED` 3회 검증, `git diff --check`, Vercel production deployment 승격 완료. 현재 소셜 계정 연동 버튼은 준비 중 뱃지 상태로 비활성화 유지 |
| 2026-07-28 | `IOS-009`, `IOS-010`, `IOS-011` | iOS 전체 메뉴·계정·보안 네이티브화 완료 | 전체 탭의 레거시 WebView 진입을 제거하고 Apple inset grouped `List`와 `Form`으로 프로필 표시 방식, 알림, 시스템/라이트/다크, Face ID/Touch ID 앱 잠금, 비밀번호 변경, 계정 탈퇴·복원, 로그아웃을 구현했다. 앱이 비활성화되면 잠금 상태로 전환하고 복귀 시 `LocalAuthentication`의 기기 소유자 인증을 사용한다. 법적 원문만 사용자 이탈 없는 전용 인앱 `WKWebView`를 유지한다. 미구현 홈 레이아웃·EventKit 설정과 중복 핵심 탭 링크는 노출하지 않았다 | iPhone 17 Pro iOS 26.5 DEBUG fixture에서 라이트·다크·접근성 큰 글자 확인, 중복 disclosure 제거와 실명 빈 값 서버 초기화 계약 보정. generic iOS Simulator Debug·Release build와 `git diff --check` 통과. 다음은 `IOS-005` 가족·자녀 네이티브화 후 `IOS-002` EventKit·실기기 운영 회귀 |
| 2026-07-28 | `IOS-003`, `IOS-009`, `IOS-010`, `IOS-011` | iOS 알림 센터·권한·푸시 라우팅 네이티브화 | 홈 toolbar의 읽지 않은 알림 배지에서 SwiftUI 알림 센터를 열고 전체/읽지 않음 필터, 새/이전 알림 섹션, 개별·전체 읽음, 연결 일정 상세와 공간 탭 이동을 구현했다. `Form` 기반 설정에서 iOS 시스템 권한 상태·설정 앱 이동과 일정/루틴/가계부/공간 서버 설정을 함께 관리한다. APNs/FCM 토큰은 Cookie·Bearer 공통 인증 API로 `profiles.fcm_token`과 `fcm_tokens`를 동기화하고, 푸시 탭의 `url`·`link`·`deep_link`를 중앙 네이티브 라우터가 처리한다 | iPhone 17 Pro iOS 26.5 DEBUG fixture의 라이트·다크·접근성 최대 글자에서 대비·필터 적응·행 줄바꿈을 확인했다. generic iOS Simulator Debug·Release와 Next production build 55/55 통과. 실제 푸시 송수신은 유료 Apple Team의 APNs capability·Firebase 설정·실기기 토큰과 운영 API 배포가 필요한 `IOS-003`; 다음은 전체 메뉴 네이티브화 |
| 2026-07-28 | `IOS-009`, `IOS-010`, `IOS-011` | iOS 개인 가계부 핵심 흐름 네이티브화 | 가계부 탭 WebView를 제거하고 개인 가계부 전용 월간 요약·검색·수입/지출 필터·카테고리 비율·정기 예정 내역·최근 내역을 SwiftUI 시스템 목록으로 구현했다. `Form` 기반 수입/지출 생성·편집, 상세·상태 변경·삭제와 개인 공간 강제 저장을 공통 native API에 연결했다. 시작 snapshot 캐시를 우선 표시하고 pull-to-refresh 및 변경 뒤 현재 월+홈만 선택 갱신한다. 자녀 capability에서는 가계부 탭을 숨기며 공유 공간 데이터 경계를 노출하지 않는다 | iPhone 17 Pro iOS 26.5 DEBUG fixture의 라이트·다크·접근성 최대 글자에서 정보 계층과 대비를 확인하고 큰 글자 금액·월 선택 붕괴를 보정했다. generic iOS Simulator Debug·Release build 통과. 실제 계정 CRUD와 정기 항목 서버 생성 결과 회귀는 `IOS-001`; 다음 알림 네이티브화 |
| 2026-07-28 | `IOS-009`, `IOS-010`, `IOS-011` | iOS 공간 핵심 흐름 네이티브화 | 공간 탭 WebView를 제거하고 시작 snapshot의 공간 응답을 실제 store로 디코딩했다. 개인/공유/가족 공간 전환, 다가오는 일정 상세 연결, 공간 소식 작성, 멤버 권한·가족 관계 수정, 코드만 복사/초대장 공유/재발급, 공간 생성·참여·이름 변경·가족 승격·안전 삭제를 공통 API·capability 계약 그대로 SwiftUI 시스템 컴포넌트에 연결했다. 개인 공간은 일정만 제공하고 커뮤니티·초대·관리 액션을 차단한다 | iPhone 17 Pro iOS 26.5 DEBUG fixture에서 라이트·다크·접근성 최대 글자 화면 확인, 큰 글자 역할 영역 세로 전환 적용. Simulator Debug·Release generic build 통과. 실제 계정 admin/editor/viewer CRUD 회귀는 `IOS-001`에 남기고 다음 개인 가계부 네이티브화 |
| 2026-07-28 | `IOS-009`, `IOS-010`, `IOS-011` | iOS 일정 핵심 흐름 네이티브화 | 일정 탭 WebView를 제거하고 시스템 `NavigationStack`/`TabView`, `List` 섹션, 검색, 유형·기간 필터, 상세, `Form` 기반 생성·수정, 상태 변경, 삭제 확인을 연결했다. 시작 선조회 일정 snapshot을 실제 목록 캐시로 디코딩하고 mutation 응답 즉시 반영 후 home+schedules만 선택 갱신한다. 공유 일정 visibility는 공통 계약의 `space`로 교정했다 | iPhone 17 Pro iOS 26.5에서 라이트·다크·접근성 큰 글자·VoiceOver 요소를 DEBUG fixture로 확인. 큰 글자에서 4분할 picker를 메뉴로, 일정 행을 세로 정보 구조로 전환해 잘림을 보정했다. generic iOS Simulator Debug·Release build 통과. 실제 계정 CRUD·역할별 권한 회귀는 `IOS-001`에 남기고 다음은 공간 네이티브화 |
| 2026-07-28 | `IOS-008`, `IOS-009`, `IOS-010`, `IOS-011` | iOS 네이티브 온보딩 1차 | 인증 세션 확정 뒤 프로필의 `onboardingCompleted`를 판정해 신규 사용자를 별도 가입 화면이 아닌 SwiftUI 온보딩으로 분기한다. 이름/닉네임·표시 방식, 중심 기능, 홈 구성, 알림의 4단계와 하단 고정 액션을 구현했다. 공통 완료 API는 기존 개인 공간을 재사용하거나 신규 개인 공간·관리자 멤버십·`preferences.personalSpaceId`를 보장한 뒤에만 온보딩 완료 시각을 기록한다 | iPhone 17 Pro iOS 26.5 Debug 전용 미리보기에서 4단계 화면·이전/다음·VoiceOver 선택값을 검증. iOS Simulator build와 Next.js production build 55/55 통과. 실제 소셜 신규 계정 완료·개인 공간 생성 회귀와 운영 API 배포는 남음 |
| 2026-07-28 | `IOS-008`, `IOS-009`, `IOS-011` | iOS 인증 화면 기준 확정 | 별도 회원가입 UI와 이름·동의 입력을 인증 화면에서 제거하고 Apple·Google·기존 이메일 로그인만 남겼다. Apple은 공식 `ASAuthorizationAppleIDButton`, Google은 공식 G 자산과 가이드 규격을 적용했다. 정적 Launch Screen·앱 내부 브랜드 전환·로그인의 로고 `76×76pt`, BI `140×35pt`, 간격 `12pt`를 공통 토큰으로 통일했다. 브랜드는 중앙 축, 인증 액션은 하단 엄지 접근 영역에 배치했다 | iPhone 17 Pro iOS 26.5에서 provider/email 화면·VoiceOver 요소·잘못된 이메일 로그인 서버 응답을 확인하고 generic Simulator Debug build 통과. 다음은 신규 소셜 사용자의 네이티브 온보딩 분기 |
| 2026-07-28 | `IOS-008`, `IOS-009`, `IOS-011` | iOS 공식 BI·로그인·Debug 통신 보정 | `img/gleaum_bi.svg`를 vector asset으로 등록하고 Launch Screen·앱 내부 브랜드 전환·네이티브 로그인에서 수동 타이포 대신 공식 BI를 사용했다. 로그인은 소셜 우선 정보 계층, Dynamic Type, 브랜드 액션 색과 간결한 법적 링크 구조로 재정렬했다. iOS 번들의 잘못된 Supabase 공개 키와 운영 refresh 거절 문구 미분류를 수정해 오래된 세션이 네트워크 장애로 보이던 문제를 제거했다 | iPhone 17 Pro iOS 26.5 fresh Debug simulator build/install/launch 통과. 잘못된 테스트 계정 로그인에서 네트워크 오류가 아닌 정상 서버 응답 `이메일 또는 비밀번호가 올바르지 않아요.` 확인. Android Studio 동시 변경은 범위에서 제외 |
| 2026-07-27 | `IOS-009`, `IOS-010`, `IOS-011` | iPhone 우선 SwiftUI 앱 셸 1차 구현 | Capacitor가 앱 root를 소유하던 구조를 종료하고 SwiftUI 상태 머신을 실제 window root로 연결했다. 정적 Launch Screen 뒤 앱 내부 브랜드 전환 중 account/home/spaces/schedules/notifications와 허용 계정의 budget을 병렬 선조회하며, 5분 snapshot·부분 실패·pull-to-refresh를 제공한다. 시스템 `TabView` 5탭과 SwiftUI 홈을 추가하고 Capacitor는 미전환 화면에서만 지연 생성되는 폴백으로 축소했다. iPad와 Android 태블릿·폴더블은 명시적 후순위로 분리했다 | iPhone 17 Pro iOS 26.5 새 설치에서 브랜드→네이티브 로그인 확인, `gleaum://schedules` 폴백 지연 생성 확인, generic iOS Simulator Debug build 통과. 다음은 일정→공간→가계부→알림/전체 순서의 네이티브 전환과 실제 로그인 계정 회귀 |
| 2026-07-27 | `IOS-009`, `IOS-011` | iOS Apple 디자인·시작 아키텍처 전면 감사 | SwiftUI 사용 0건, UIKit 수동 스타일·카드 중심 화면, Capacitor root 위 modal 홈, `/home` 외 핵심 탭 WebView 전환, 제품 데이터 선조회·공유 캐시 부재를 확인했다. iPad에서는 휴대전화 폭 로그인 카드와 과도한 여백이 노출됐다. Android는 복잡한 로고 애니메이션이 아니라 브랜드 화면+fade 동안 account/home/space/schedule/budget/notification을 병렬 선조회하는 구조가 핵심 차이였다 | 기존 인증·Keychain·API 클라이언트는 보존. UIKit 화면 추가를 중단하고 SwiftUI root 상태 머신 → 앱 내부 브랜드 전환 → 선조회 actor/cache → 시스템 5탭 → 핵심 화면 순으로 재구축. `docs/28-ios-apple-design-realignment.md` |
| 2026-07-27 | `IOS-008` | 네이티브 인증·세션 통합 구현 | Apple은 `AuthenticationServices`의 nonce/ID token 교환, 이메일은 로그인·가입·필수 동의·인앱 약관 확인, Google은 `ASWebAuthenticationSession` 임시 세션의 계정 선택과 OAuth callback 자동 수신으로 통합했다. 세 인증 결과는 동일한 Supabase 세션 JSON으로 정규화하고 Keychain 저장 실패를 인증 성공으로 오인하지 않도록 브리지까지 보강했다. 법적 문서는 전용 `WKWebView`에서 열고 PWA 설치 배너를 억제한다 | diff/plist/pbx 검사, 세션 13/13·인증 6/6, Simulator Debug build·로그인/이메일/약관 시각 검증, Google 계정 선택 진입·취소 복귀 통과. iPhone arm64 Development 서명 빌드 성공. 실제 설치는 기기 `unavailable`, Apple 실인증은 유료 Team, GoogleSignIn SDK는 iOS OAuth Client ID/reversed scheme 확보 후 검증 |
| 2026-07-27 | `IOS-007`~`IOS-011`, `REPO-001` | Claude WIP 보존·iOS 안정 기준 재구축 시작 | SSD의 Claude 혼합 WIP 61개 파일은 `b12e0f2`와 `codex/archive-claude-wip-20260727`에 원형 보존하고, 안정 기준 `853c649`에서 `codex/ios-rebuild-20260727`을 생성. 세션을 UserDefaults에서 Keychain으로 이전하고 refresh 오류를 명시적 토큰 거절과 일시장애로 분리했으며, 401 단일 재시도·동시 refresh 병합·로그아웃 경합 차단·앱 시작 단일 상태 조정자를 적용. UIKit 홈·일정 생성의 고정 다크 색을 의미 기반 동적 색상으로 교체하고 시스템/라이트/다크 선택 관리자 추가. 시작 WebView flash를 가리는 네이티브 브랜드 shield와 세션 일시장애 복구 화면 추가 | 세션 시나리오 13/13, pbx/plist lint, diff check, Simulator Debug build·로그인 시각 검증 통과. Personal Team Debug 빌드 후 iPhone 16 Pro 설치·실행·PID 유지 확인. 다음은 실계정 세션 이전·홈 테마 검증과 SwiftUI 단일 root 구축 |
| 2026-07-23 | `AND-001`, `OPS-004` | Android 일정 등록 긴급 수정 완료 | 일정 생성 POST는 성공했지만 새 개인 일정은 `personalSpaceId`에 저장되고 목록·홈 API는 `activeSpaceId` 한 곳만 조회해 가족/공유 공간 사용자의 일정이 반영되지 않는 것처럼 보이는 원인을 실기기에서 재현. 홈·일정 조회를 개인 공간+활성 공유 공간으로 통합하고 Android 저장 응답 즉시 upsert, BFF ISO 시간 정규화, 생성 응답 권한 포함, 상세 서버 권한 재확인, API 오류 코드 Logcat 기록을 적용 | Next production build 55/55, Android debug assemble·`SM_F731N` 설치 통과. Production `dpl_EpauxB5tc4uQBKcUmp9XCj52yq8Z` READY·`www.gleaum.com` alias. 실기기에서 `QA_schedule_1746` 제목·날짜·시작·종료 입력→등록→목록·홈 노출→상세 `7월 23일 09:00~10:00`·수정 권한→삭제까지 통과하고 QA 데이터 제거 |
| 2026-07-23 | `IOS-007` | iOS 1단계 코드 완료·외부 계정 대기 | Xcode 누락 구성요소 설치와 stale CoreSimulator 교체로 iOS 26.4/26.5 런타임을 복구. `App.entitlements`를 타겟에 연결해 Push·Associated Domains·Sign in with Apple을 구성하고, 미사용 카메라·사진·마이크·현재 위치·ATT·background fetch 선언을 제거. 빌드에서 누락되던 `PrivacyInfo.xcprivacy`를 Resources에 포함하고 실제 서비스 수집 범위를 보강. 알림 delegate의 실패하는 조건부 캐스팅도 정식 프로토콜 채택으로 수정 | plist 3종 lint, iPhone 17 Pro iOS 26.5 simulator Debug build/install/launch, Release iphoneOS 무서명 build와 번들 Privacy Manifest 확인 통과. 실제 서명은 Personal Team이 3개 capability를 지원하지 않아 프로비저닝 생성 단계에서 차단. 유료 Apple Developer Team 연결·App ID capability 활성화 후 실제 iPhone 검증 |
| 2026-07-23 | `IOS-007`~`IOS-011` | iOS 재개 감사·실행 순서 확정 | iOS는 홈과 빠른 일정 등록만 네이티브이고 그 외 핵심 경로가 운영 WebView로 이동함을 확인. 기존 modal overlay 라우팅을 확장하지 않고 SwiftUI 단일 탭 셸·중앙 라우터를 먼저 구축한 뒤 Android 공통 API 계약으로 기능을 이식하기로 결정 | 최초 감사에서 CoreSimulator 버전 불일치를 발견했고, 같은 날 `IOS-007` 후속에서 Xcode 구성요소 설치와 stale service 교체로 해소했다. 상세 단계는 `docs/27-ios-resumption-readiness.md` |
| 2026-07-23 | `FAM-012`, `FAM-013`, `AND-003` | WebView 잘림 수정·네이티브 경계 확정 | `/space/children`에 전역 BottomNav가 겹치고 일부 Android WebView가 CSS safe-area를 0으로 반환해 상·하단 조작 영역이 가려지는 원인을 확인. 집중 흐름 nav/footer/sidebar를 제거하고 실제 WindowInsets를 CSS 변수로 전달하며 24px fallback을 적용. 자녀 계정 연결은 Android에서 Compose로 전환하고 WebView는 외부 OAuth·법적 원문 fallback에만 제한하기로 결정 | 대상 ESLint·TypeScript·자녀 테스트 3/3·Next production build·Android debug build 통과. 커밋 `996b891`, Production `dpl_Cy4qKA2ctT4TmuoJsYwZnPfyevXU`, 공개 경로 200, `SM_F731N` APK 설치 완료. 생체인증 해제 후 실기기 조작 회귀가 남음 |
| 2026-07-23 | `FAM-012`, `OPS-004` | GitHub·Production 반영 완료 | 기능·DB·Android 경로·문서 변경을 `b124305`로 커밋해 `codex/platform-parity-sync-20260723`에 push하고 Vercel Production `dpl_G4kCYuzC2Cjz79LAtbVUzXiKELJN`으로 배포 | 운영 자녀 초대 랜딩 200, 자녀 목록·claim·거절 API 미인증 401, 최근 runtime error 0 확인. 보호자·자녀 실계정 2개 회귀만 남음 |
| 2026-07-23 | `FAM-012`, `PAR-001`, `OPS-004` | 선택 이메일·토큰 바인딩 구현·운영 DB 적용 | 자녀 이메일 필수 입력을 제거하고 선택적인 계정 제한값으로 변경. 72시간 일회성 초대는 OS 공유·문자·QR로 전달하며 Google/이메일 검증 계정의 claim은 후보 스냅샷만 저장한다. 보호자 본인 claim을 차단하고 최종 승인/거절 전에는 `space_members`·`account_age_profiles`를 만들지 않는다. Android는 로그인 전후 pending route를 보존해 `/invite/child/[token]`으로 복귀한다. migration `20260723053050_child_invite_token_binding.sql` 운영 적용 | DB 열·부분 유니크 인덱스·함수 권한/정의 확인, TypeScript, 자녀 테스트 3/3, 데이터 경계 9/9, capability 4/4, Next production build, Android debug build 통과. Git push·Web Production 배포·보호자/자녀 2계정 회귀 후 완료 |
| 2026-07-23 | `FAM-011`, `OPS-004` | 운영 OTP 길이 정합화·배포 | 앱과 문서는 6자리로 제한했지만 운영 Supabase 실메일의 `{{ .Token }}`은 8자리로 발급되는 불일치를 확인. `GUARDIAN_EMAIL_OTP_LENGTH=8` 단일 상수로 UI 입력·버튼 상태·API 형식 검증을 통일하고 메일 템플릿 안내도 8자리로 변경. Dashboard 저장 후 Production `dpl_6tpDS5ay519BAZsTaVZo18JhJFKe` 배포 | 대상 ESLint·production build, 운영 API 미인증 401·runtime error 0 확인. 새 코드 요청→8자리 입력→동의 완료 실사용자 회귀 |
| 2026-07-23 | `FAM-011`, `WEB-002`, `OPS-004` | Auth OTP 목적 분리·운영 템플릿·Production 반영 | Supabase Auth에 사용자 정의 템플릿 종류를 추가할 수 없어 Magic Link/OTP 고정 슬롯을 조건 분기형으로 변경. 보호자 요청은 `https://www.gleaum.com/auth/email-purpose/guardian-verification`을 `emailRedirectTo`로 전달하고 템플릿은 `{{ .RedirectTo }}`로 보호자/일반 본문을 구분한다. 제목은 `[글리움] 이메일 확인 코드`, 파일은 `supabase/email-templates/magic-link-or-otp.html`이며 Dashboard 저장 완료. Production `dpl_3M2He5p9F3UfBs5H4tW3u7kRXZwy`로 승격 | 운영 Redirect allow list의 `https://www.gleaum.com/**`, 대상 ESLint·diff check·production build, Dashboard 저장 성공, 운영 API 미인증 401, 배포 runtime error 0 확인. 보호자 실메일 본문·OTP·동의 회귀만 남음 |
| 2026-07-23 | `FAM-011`, `OPS-004` | 코드·DB·배포·Auth 설정 완료, 실메일 회귀 대기 | 운영 Supabase가 `{{ .Token }}` OTP와 기본 제목 `Your Magic Link`를 보내는 반면 앱은 Magic Link 콜백만 기대하던 불일치 수정. 자녀 관리 화면에 코드 입력·재발송을 추가하고 OTP 성공 뒤 DB 확인 증적이 있어야 동의가 가능하도록 변경. migration `20260723035907_guardian_email_otp_verification.sql` 운영 적용, Production `dpl_Gc7Dmx7ahfUVTw7qvnEY7GYEzLfr` 배포, Magic Link/OTP 제목·보호자 HTML 적용 | 대상 ESLint·diff check·production build, 신규 함수 anon 불가/authenticated 가능, 운영 화면 307·신규 API 미인증 401, Dashboard 재접속 후 제목·보호자 단일 미리보기·`{{ .Token }}` 확인. 사용자 실메일→OTP→동의 회귀 후 완료 처리 |
| 2026-07-23 | `SEC-009`, `OPS-004` | 부분 완료·상위 패치 대기 | Vercel 배포 설치 로그의 high 경고를 재감사해 Next 16.2.10 자체 권고 4건과 sharp/libvips 권고를 확인. Next·eslint-config-next를 16.2.11로 올려 자체 권고를 제거하고 exact version으로 고정 | production build 재검증·재배포. Next가 현재 `sharp ^0.34.5`를 요구하므로 0.35.0 강제 override는 이미지 파이프라인 회귀 위험 때문에 적용하지 않음. 공식 호환 패치 출시 후 `npm audit --omit=dev` 0건까지 추적 |
| 2026-07-23 | `FAM-009`, `PAR-001`, `OPS-004` | Android 완료·플랫폼 후속 등록 | 가족 공간 멤버의 가족 관계 `family_role`을 공간 권한 `role`과 분리하고 공간 지기 전용 변경 API를 추가. 가족 초대는 멤버 탭에서 일반 가족/자녀를 먼저 고르고, 공간 설정은 공간 자체 수정만 담당하도록 분리. 운영 migration 2개 적용과 최종 Production `dpl_2j1WLB6oEb2zVbupH7J98XLaqUHy` 배포 완료 | root build 54/54, 대상 ESLint, Android unit/assemble/debug 설치 통과. `SM_F731N`에서 가족 관계 배지·권한 보조 표시·초대 유형·일반 가족 코드/공유·설정 분리 확인. Web/iOS 동등화는 플랫폼 후속 표에서 진행 |
| 2026-07-23 | `AND-006`, `FAM-002`, `OPS-004` | Kakao AdFit 운영 미노출 복구 | 기존 19개 프로필이 모두 연령 프로필 없이 `unknown`으로 분류되어 광고가 전부 차단된 정책을 제한 계정 4종만 차단하도록 정합화. migration `20260723021003` 운영 적용과 Production `dpl_7aJ2HWP9rZNoT1CTEGWcvc4rZcCM` 배포 완료. 시작 선조회 스레드의 AdMob App Open load가 UI thread 위반으로 앱을 종료시켜 AdFit 요청 전 중단되던 문제도 메인 Looper 강제로 수정 | capability 4/4, root production build 54/54, Android assemble 통과. `SM_F731N`에서 `unknown + canShowAds=true`, AdFit request/load, SDK 팝업 버튼·이미지·CTA, 홈 Activity 유지, 크래시 0건 확인. 닫기/오늘 그만 보기/네트워크 실패 레이아웃은 수동 QA 유지 |
| 2026-07-23 | `AND-001`, `AND-003`, `AND-005`, `AND-010`, `FAM-008` | 로그인 실기기 회귀·캘린더 네이티브화 | `SM_F731N`에서 콜드 스타트와 핵심 메뉴 왕복을 확인. WebView 캘린더 가져오기가 인증/라우팅으로 홈 복귀하던 결함을 재현하고 Compose 네이티브 Activity·Calendar Provider repository로 교체. 캘린더 목록 긴 이름·스크롤·접근성 역할과 폴더블 하단 인셋 보정. 운영 DB의 가족 전환/안전 삭제 RPC 존재와 authenticated 실행 권한 확인 | 캘린더 후보 3개 조회·선택 UI·Activity 유지, 크래시/ANR 0건, unit/assemble·debug 설치 통과. 실제 가져오기·중복/자동 CRUD와 가족 승격은 운영 데이터 변경을 피하기 위해 안전한 테스트 데이터에서 후속 확인 |
| 2026-07-23 | `FAM-008`, `AND-010`, `OPS-004` | Android 가족 전환 복구·시작 데이터 정책 구현 | 운영 가족 전환 경로가 404임을 재현하고 최신 API를 Production `dpl_9H8AaLttD7fsXuZUzzMdMycQNcHY`로 배포해 401 인증 계약으로 복구. Android에 스플래시 병렬 선조회, 프로세스 캐시, mutation 선택 무효화, 홈/공간/일정/가계부/알림 pull-to-refresh를 추가하고 일정·가계부·알림의 무조건 onResume fetch를 제거 | root production build 54/54, Android compile·unit·lint·assemble 통과. 다음은 로그인 실기기에서 일반→가족 전환, 화면 왕복 시 무재호출, 당겨서 새로고침, 일정/가계부 쓰기 후 갱신 확인. Web 라우트 fetch 감사와 iOS 동등 정책은 플랫폼 후속 표에 유지 |
| 2026-07-23 | `FAM-008`, `AND-010`, `PAR-001`, `IOS-005` | Android 우선순위 확정·작업 시작 | Android 기능을 먼저 완성한 뒤 Web, 마지막으로 iOS를 진행하기로 결정. 가족 공간 전환 실패 수정과 스플래시 선조회·공유 캐시·pull-to-refresh 정책을 Android 현재 범위로 시작하고 플랫폼 후속 영향 표를 추가 | Android 코드/API 원인 추적 → 자동 build/test → 로그인 실기기 검증 순서. 공통 계약 변화만 기록하고 Web/iOS 구현은 후속 큐로 유지 |
| 2026-07-23 | `REPO-003`, `PAR-001`, `FAM-008`, `OPS-004` | 맥북 작업·체크리스트 재대조 | 맥북에서 게시한 `codex/platform-parity-sync-20260723`을 맥미니 `/Volumes/WD_BLACK/Ai Works/gleaum`에 동기화하고 19개 기능/문서 커밋을 현재 트래커 완료 기준과 대조. 코드 존재만으로 운영 완료 처리하지 않고 배포·실기기·역할별 검증을 별도 유지 | 오래된 `node_modules`에서 `tsx` 누락을 발견해 lockfile 기준 복원. 데이터 경계 9/9·capability 4/4·알림 설정 2/2, root production build 54/54, backoffice build, Android 738 tasks compile/unit/lint/assemble 성공. 다음은 `FAM-008` 포함 Preview/Production 배포와 동일 계정 회귀 |
| 2026-07-23 | `AND-006` | Google Play 등록정보 애셋 준비 | Android 1.1.5 실기기 UI를 기준으로 한국어 앱 이름·설명·출시 노트와 휴대전화 스크린샷 6장을 제작하고 공개용 예시 데이터로 익명화. 개인정보가 포함될 수 있는 원본 캡처는 Git에서 제외 | 이미지 6장 모두 1080×1920 RGB·알파 없음, 앱 이름 15/30자·간단한 설명 37/80자·자세한 설명 1032/4000자·출시 노트 151/500자 확인. 다음은 1024×500 기능 그래픽 제작과 Play Console 업로드·최종 확인 |
| 2026-07-23 | `REPO-001`, `PAR-001`, `OPS-004` | GitHub 최신 작업 체크포인트 준비 | 원격 `main` 이후 누적된 보안·가족/자녀·Android 적응형/권한 변경 18개 로컬 커밋과 플랫폼 파리티·공간 수명주기·알림 설정·Web 세션 폴백 미커밋 작업을 `codex/platform-parity-sync-20260723` 브랜치로 통합 보존 | TypeScript, 데이터 경계 9/9, capability 4/4, 알림 설정 2/2, Next production build 54/54, Android SDK 36 `compileDebugKotlin`·unit test·lint·assemble(840 tasks) 통과. 로컬 IDE 기기 선택 파일은 체크포인트에서 제외하고 GitHub Draft PR로 게시 |
| 2026-07-17 | `PAR-001`, `WEB-006`, `OPS-004` | 인증 PC·Mobile Web 회귀 및 세션 폴백 보완 | Google 로그인 완료 세션으로 PC/Mobile 홈·일정·알림·마이페이지·공간을 검증. SSR Cookie 세션은 유효하지만 브라우저 Data API 프로필 복원이 늦거나 비는 경우 `/api/session/profile`로 본인 프로필을 복구하도록 보완하고, 무료 플랜 공간 수에서 개인 공간을 제외. Mobile 홈은 원장 로딩 중 임시 `0원` 카드 노출을 차단. 탈퇴 상태 조회는 불필요한 Service Role 의존성을 제거하고 본인 세션/RLS 조회로 전환 | 대상 ESLint 0 error(기존 `<img>` warning 1), TypeScript·diff check, Next production build 54/54 통과. PC/Mobile 실제 이름 `Edwin`, 공유 공간 `2/2`, 월간 개인 지출 `320,000원`, `/api/account/status` 200, 핵심 화면 새 console error 0 확인. 다음은 Android 동일 계정 홈 회귀와 역할별 일정 상세·알림 쓰기 검증 |
| 2026-07-16 | `PAR-001`, `WEB-006`, `OPS-004` | MacBook 로컬 Google OAuth 환경 복구 | `.env.local`의 Supabase URL·anon key가 `your-project`/`your-anon-key` 템플릿 값으로 남아 OAuth가 DNS 단계에서 중단된 원인 확인. Android·iOS·배포 문서의 운영 프로젝트 `tyvjdsescukaeorcuaga`와 Android 공개 anon key로 통일하고 `layout.tsx`의 과거 프로젝트 preconnect도 정리 | Auth settings 200·Google provider 활성 확인, production build 54/54, 실제 Google 계정 선택 화면 진입 및 redirect URI가 `https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback`인 것 확인. 사용자가 Google 계정 인증 완료 후 PC Web 인증 회귀 계속 |
| 2026-07-16 | `PAR-001`, `WEB-006`, `WEB-008` | PC·Mobile Web production 공개 화면 회귀·인증 대기 | PC 1280px 랜딩과 Mobile 390px 로그인·보호 라우트 리다이렉트를 production build로 검증. 공통 로고의 비정방형 PNG를 정사각형 `next/image`로 크롭하며 발생하던 비율 경고를 접근 가능한 배경 크롭 컴포넌트로 정리 | 대상 ESLint·TypeScript·diff check, production build 54/54, 양쪽 viewport 가로 overflow 없음·로고 경고 제거. App Check 키 미설정과 Remote Config 네트워크 실패는 로컬 기본값 폴백 확인. 인증 후 PC 일정 상세·알림·마이페이지 → Mobile Web 순으로 역할별 회귀 |
| 2026-07-16 | `PAR-001`, `AND-001`, `WEB-010` | MacBook Android CLI 환경 복구·빌드 통과 | 공식 Android command-line tools `14742923`을 체크섬 검증 후 `/Users/edwin/Library/Android/sdk`에 설치하고 Platform 36·Build-Tools 36.0.0·Platform-Tools와 SDK 라이선스를 구성 | Android Studio JBR 21로 `compileDebugKotlin`·`testDebugUnitTest`·`lintDebug`·`assembleDebug` 전체 성공(738 tasks, 3m 54s). debug APK 생성. 다음은 admin/editor/viewer/private 생성자와 알림 설정별 실기기 회귀 |
| 2026-07-16 | `PAR-001`, `AND-001`, `WEB-010` | Android 일정 상세·알림 1차 구현 완료·빌드 차단 | 일정 상세 응답에 서버 계산 쓰기 권한·장소·참여자 ID를 추가하고 Android의 수정·삭제·상태·재알림·지도 UX에 적용. viewer 직접 편집을 차단. Android 알림 설정은 로컬 저장에서 서버 프로필 저장·동기화로 전환하고 재알림에 Cookie/Bearer 공통 인증 적용 | 권한 단위 테스트 9/9, 알림 테스트 2/2, capability 4/4, 대상 ESLint·TypeScript, Next production build 54/54 통과. Android Studio JBR 21은 있으나 `/Users/edwin/Library/Android/sdk` 미존재로 compileSdk 36 빌드 차단. Android Studio를 열어 SDK 설치 후 재검증 |
| 2026-07-16 | `PAR-001`, `AND-001` | Android 우선 파리티 작업 시작 | 3플랫폼 싱크 보드의 Android 미완료 항목 중 일정 상세와 알림을 1차 범위로 선정. 공통 API·권한·딥링크 계약을 먼저 대조한 뒤 Android 구현·검증 진행 | 기존 `FAM-008` 공간 수명주기 미커밋 변경을 보존. 일정 상세 권한·참여자·장소·재알림, 알림 목록·읽음·일정 딥링크·설정 저장을 순서대로 감사 |
| 2026-07-16 | `PAR-001` | 플랫폼 실행 우선순위 확정 | 공통 코어 계약을 먼저 확정한 뒤 Android App을 기준 동작·최우선 구현으로 처리하고 PC Web, Mobile Web 순으로 후속 반영하기로 결정 | 싱크 보드 열과 다음 행동을 Android 우선 순서로 재배치. 보안·운영 오류·데이터 손실 위험만 예외로 우선 처리 |
| 2026-07-16 | `PAR-001` | 트래커 구조 개편 | 현재 지원 대상을 PC Web·Mobile Web·Android 3개로 고정하고, 기능별 공통 코어 계약 아래 플랫폼별 구현·검증·`N/A` 사유를 각각 관리하도록 싱크 보드와 영향 확인 체크리스트를 도입. iOS는 현재 완료 조건에서 제외 | 기존 마이페이지·일정 상세·공간·알림 완료/대기 상태를 플랫폼별로 이관. 이후 Android/Web 변경 시 공통 계약과 나머지 플랫폼 후속 작업을 동일 기능 아래 등록 |
| 2026-07-16 | `WEB-010`, `PAR-001` | 알림 설정 서버 강제 구현·운영 대기 | 일정 리마인더·일정/자녀 재알림·자녀 미완료·결제 기한 초과·주간 소비 요약이 `notification_settings`를 확인하도록 통합 helper를 적용. 명시적 false 사용자는 FCM과 인앱 알림 기록에서 제외하고 설정이 없는 기존 사용자는 호환 유지 | helper 단위 테스트 2/2, 대상 ESLint·TypeScript, 데이터 경계 8/8·capability 4/4, Next production build 54/54 통과. Preview/Production 배포 후 카테고리별 실제 수신/비수신 검증 필요 |
| 2026-07-16 | `PAR-001`, `WEB-009`, `WEB-010` | Web 전체 파리티 2차 수정·계속 진행 | 공간 지기 자기 이탈 노출을 차단하고, 알림 클릭의 일정 상세 이동, 일정 소속 공간 기준 수정 권한, viewer 직접 편집 차단, 상세 재알림 실제 API 발송, PC/Mobile 외부 지도 열기를 구현. 자녀 일정은 잘못된 editor/멤버십 ID 추정을 제거하고 `family_dependents.linked_user_id`로 탭·참여자·재알림 대상을 연결 | 대상 ESLint·TypeScript·diff check 통과. production build와 브라우저 역할별 회귀 후 일정 상세 체크를 닫고, 알림 설정 서버 강제(`WEB-010`)·첨부 저장 계약(`WEB-003`) 순으로 진행 |
| 2026-07-16 | `PAR-001`, `FAM-008`, `OPS-004` | 공간 파리티 오류 수정·운영 대기 | Web 공간 화면의 “공간 설정”이 이름 변경만 열고 Mobile Web에는 고급 설정 진입점이 없어 Android의 가족 전환·삭제 기능과 불일치한 원인 수정. PC/Mobile 모두 실제 설정 페이지로 연결하고 삭제 RPC fallback ID·사용자 컨텍스트를 갱신하며 오류 코드별 안내와 개인 공간 보호 조건을 일치시킴 | 대상 ESLint·TypeScript·diff check, 데이터 경계 8/8·capability 4/4, Next production build 54/54 통과. 실제 서비스 반영은 Preview/Production 배포 후 동일 계정 Web/Android 재검증 필요 |
| 2026-07-16 | `PAR-001`, `WEB-006`, `WEB-008` | 1차 구현 완료·계속 진행 | Web 마이페이지의 권한 무시 가계부 통계/빠른 메뉴를 계정 capability로 제한. Desktop에 Android 기준 빠른 실행·알림 목록/설정·약관 동선을 추가하고 허위 프리미엄 문구 제거. Mobile Web에서 미구현 Apple 로그인·포인트 확장과 Web에서 동작하지 않는 생체인증·기기 캘린더 진입점 제거 | 대상 ESLint 0 error/0 warning, TypeScript·diff check 통과, Next production build 54/54 route 성공. 다음은 일정 생성/수정·상세 파리티 비교 및 브라우저 시각 회귀 |
| 2026-07-16 | `PAR-001`, `WEB-006`, `WEB-008`, `WEB-007`, `AND-009` | 우선순위 변경·시작 | Remote Config를 후순위로 옮기고 Web ↔ Android 기능 파리티를 최우선으로 전환. 1차 매트릭스에서 핵심 내비게이션은 일치하지만 Web 마이페이지의 권한 무시 가계부 노출, 네이티브 전용/준비 중 진입점, Desktop 기능 누락과 허위 프리미엄 문구를 확인 | 마이페이지·설정 노출 정합화부터 수정 후 Web lint/type/build, 다음으로 일정 생성·상세와 공간 관리 기능 비교 |
| 2026-07-16 | `WEB-007`~`WEB-010`, `AND-002`, `AND-006`, `IOS-001`~`IOS-006` | 우선순위 재편 | iOS와 Google Play 출시 구간을 후순위로 분리하고 즉시 구현·production build·Web/API 반영 가능한 작업을 실행 큐 전면에 배치 | Remote Config 실제 소비, 알림 설정 발송 강제, 첨부 완성, 설정 노출, 지도 미완을 Web 누락 항목으로 추가. `FAM-008` 운영 마감 후 `WEB-007`부터 순차 진행 |
| 2026-07-16 | `AND-009`, `ARCH-001` | 작업 등록·의사결정 | 다음 Android 마켓 버전에 Remote Config 기반 기능별 긴급 차단과 최소 지원 버전 기반 필수 업데이트를 운영 안전장치로 탑재하기로 결정 | 12개 세부 체크를 등록. `FAM-008` 운영 검증 이후 Android 기준으로 구현하고 iOS는 Android 전체 안정화 뒤 동일 계약으로 적용 |
| 2026-07-16 | `ARCH-001` | 완료·의사결정 | CodePush형 OTA와 현재 `server.url`·Compose 구조 및 최신 마켓 정책을 비교 | Web/API는 Vercel 즉시 배포, 사전 탑재 기능은 Remote Config, Compose/네이티브는 Play 업데이트로 분리. 상세 전략 `docs/26-live-update-delivery-strategy.md` |
| 2026-07-16 | `FAM-008`, `AND-001` | 부분 완료·차단 | 사용자 실기기 삭제 테스트가 실패 후 전체 로드 오류로 전환되고 실제 공간도 유지되는 현상 확인. 운영 API 미배포가 삭제 실패 원인이며 Android가 mutation 오류를 전체 조회 오류로 표시한 UX 결함도 수정 | 운영 migration 적용·승격/삭제 transaction rollback 통과, Web build·대상 ESLint·테스트·Android assemble 및 수정 APK 설치. Vercel 소스 외부 업로드 명시 승인과 실기기 재로그인 후 운영 삭제 재검증 |
| 2026-07-16 | `FAM-008`, `AND-001` | 발견·시작 | 신규 가족 공간 생성 중심 구현으로 기존 사용자의 일반 공간 승격과 불필요 공유 공간 삭제 수명주기가 누락됨을 확인 | 운영 집계상 목적 미지정 일반 공간 7개 중 6개가 단독 멤버 공간. 기존 ID·데이터를 유지하는 가족 승격과 트랜잭션 삭제/활성 공간 복구를 우선 구현 |
| 2026-07-16 | `AND-001`, `OPS-004`, `FAM-001`, `FAM-002` | 실기기 오류 수정·운영 배포 | 최신 Android APK에서 운영 session context 404 때문에 `unknown + capability 전체 false`가 캐시되어 성인/일반 계정의 가계부 메뉴가 숨는 연동 오류 재현. 앱의 fail-closed를 완화하지 않고 최신 커밋 API를 Preview 빌드 후 Production 승격 | Preview `dpl_BtZJhDekxZQyfwWkRjJY8PSQnxZv` READY, Production `dpl_FrrVDVeUjCRWyPjbKvP6x8wqrEX3` READY. 실기기 캐시가 `canManageSpaces/canInviteMembers/canViewHouseholdBudget/canCompleteRoutine=true`로 갱신되고 하단 가계부 복구, 운영 context 200·최근 runtime error 0. ADB 승인 시스템 크레딧 해제 후 공간 전체 UI/기능 순회 계속 |
| 2026-07-16 | `AND-001` | 재개 | 연결된 Android 실기기에서 최신 소스 기준 공간 기능·UI 전체 회귀와 즉시 수정 시작 | 최신 debug APK 업데이트 설치 후 공간 선택·소식·일정·멤버·관리 흐름을 순회하고 발견 사항별 수정·재검증 |
| 2026-07-16 | `AND-001`, `WEB-001`, `FAM-001` | 부분 완료·계속 진행 | Android 실기기에서 운영 공간 summary와 개인/공유 선택기, 공유 공간 소식·일정·멤버 읽기, 관리자 진입점을 검증. 최초 로드 1회는 일반 오류로 끝났지만 정확한 재시도 후 정상 복구됐고 동일 시각 서버·Supabase 조회는 200 | Vercel `/api/native/spaces/summary` 200, Supabase 공간 관련 조회 200·핵심 5개 테이블 RLS/정책 존재, Android compile/test/lint/assemble, 데이터 경계 8/8·capability 4/4·production build 통과. 쓰기/파괴 경로는 운영 데이터에 실행하지 않았으며 격리 계정 준비 후 검증. Android 클라이언트에 상태 코드·오류 코드 관측성 추가 필요 |
| 2026-07-16 | `IOS-005`, `AND-001`, `AND-002`, `AND-006` | 순서 변경 | iOS 착수를 중단하고 Android 전체 정상화·출시 검증을 선행하기로 결정 | iOS 코드 변경 0건. Android 기능·실기기·릴리즈 AAB·Play Console 검증 완료 후 `IOS-005` 재개 |
| 2026-07-16 | `FAM-002` | 시작 | 자녀 전용 홈·메뉴 제한을 Web·Android에 적용 시작 | 현재 홈 요약·메뉴·딥링크·AdMob 진입점과 session context 소비 구조를 먼저 감사 |
| 2026-07-16 | `FAM-002` | 완료 | Web·Android가 동일 account capability를 소비하도록 홈 정보 구조, 메뉴, 딥링크, 공간 관리 액션, 가계부 액티비티와 네이티브 광고를 동기화 | capability 4/4·데이터 경계 8/8, 변경 대상 ESLint·tsc·production build, Android `compileDebugKotlin`·`testDebugUnitTest`·`lintDebug`·`assembleDebug` 통과. 전체 `npm run lint` 기존 산출물/소스 부채는 `SEC-004`; 다음은 Android 전체 QA·릴리즈 마감 |
| 2026-07-16 | `FAM-001` | 완료 | account mode를 단일 capability mapper로 통합하고 Web provider/UI, Cookie·Bearer API, 가계부·공간·초대·광고 서버 경계와 운영 RLS에 적용 | 운영 migration `20260716061100`·`20260716061330`, RLS 7개, helper anon 불가·Security Advisor 신규 경고 0. capability 4/4, 데이터 경계 8/8, 변경 대상 ESLint·tsc·production build 통과. 전체 lint 기존 오류는 `SEC-004`, 다음 `FAM-002` |
| 2026-07-16 | `FAM-001` | 시작 | 가족·자녀 공통 session capability를 Web 메뉴·광고·가계부·공간 API/UI와 네이티브 계약에 적용 시작 | 기존 `/api/session/context`·DB 권한·클라이언트 노출을 먼저 감사하고 서버 우회 요청 회귀 테스트 추가 |
| 2026-07-16 | `AND-003`, `AND-004`, `AND-006`, `AND-008` | 체크포인트 | 적응형 840dp 폭 수정·debug 전용 preview·로그인 XML 예외 결정을 `bf69e1e`, 미사용 권한 제거·개인정보/Data safety 정합화를 `5ad7ba0`으로 분리 보존 | Android debug/test/lint/release manifest, 웹 lint/build, compact·글꼴 1.3배·다크·expanded 실기기 QA 통과. 남은 수동/Console 항목은 각 차단 행 기준 재개 |
| 2026-07-16 | `AND-006`, `AND-008` | 부분 완료·차단 | 공식 Play/Firebase/AdMob 정책과 앱 권한·SDK·운영 URL을 대조해 미사용 CAMERA 제거 및 개인정보/Data safety 초안 정합화 | 운영 privacy·assetlinks·app-ads 200. Console 권한 확보 후 Data safety/IARC/App access/서명 인증서·스토어 자료 확인 |
| 2026-07-16 | `AND-003`, `AND-004` | 부분 완료·의사결정 | compact·1.3배 글꼴·다크·expanded 실기기 QA, 적응형 폭 버그 수정. 로그인 XML은 브랜드 예외 승인 | 실제 TalkBack 음성 탐색과 인증 이후 전체 화면만 수동 QA로 남김 |
| 2026-07-16 | `AND-003` | 시작 | 외부 자격정보 없이 가능한 폴더블·적응형 레이아웃·큰 글꼴·접근성 정적/실기기 QA 시작 | 단말 원래 화면 크기·밀도·글꼴 설정을 기록한 뒤 preview 화면 검증 후 복원 |
| 2026-07-16 | `REPO-001`, `AND-001`, `AND-002`, `AND-005`, `AND-007` | 체크포인트 | Android 네이티브 UI·캘린더/테마 브리지·release 하드닝과 결합 문서를 `da2384e`로 보존 | `.idea/deploymentTargetSelector.xml` 제외. debug/test/lint/release package·웹 lint/build·실기기 로그인 통과 |
| 2026-07-16 | `AND-001`, `AND-002`, `AND-005`, `AND-007` | 부분 완료·차단 | Android debug/test/lint와 release 서명 전 패키징, 실기기 설치·로그인 시각·무크래시 확인 및 즉시 보안 보완 완료 | 최종 서명은 비밀번호 환경, 인증 이후 핵심·캘린더 회귀는 계정 세션 확보 후 재개 |
| 2026-07-16 | `AND-001`, `AND-002`, `AND-005` | 재개 | 사용자 지시로 Android 파일·빌드·release·캘린더 검증 보류 해제 | 코드/설정 감사 후 debug/lint/release 산출물, 연결 단말 순서로 검증 |
| 2026-07-16 | `WEB-001` | 2차 차단 | 운영 DB 비변형 RLS 통합 테스트 환경을 확인했으나 Docker daemon 미실행, Supabase CLI/config 없음 | 운영 DB 테스트 데이터 생성은 하지 않음. Docker Desktop·로컬 Supabase 준비 후 재개하며 그동안 다음 큐 `FAM-001` 진행 가능 |
| 2026-07-16 | `WEB-001` | 1차 완료·계속 진행 | 운영 코드가 사용하는 데이터 경계 순수 함수와 접근 매트릭스 8개를 `3867550`으로 추가 | 8/8, 대상 ESLint, TypeScript, production build 통과. 다음은 운영 DB를 변형하지 않는 로컬 Supabase RLS 통합 테스트 |
| 2026-07-16 | `SEC-008` | 발견·완료 | npm 감사에서 루트 Next와 전이 의존성 high/critical 범위를 발견해 즉시 업데이트 | Next/eslint-config-next 16.2.10·PostCSS 8.5.12, `npm audit` 0건. Android 파일·검증 미포함 |
| 2026-07-16 | `WEB-001` | 시작 | 개인/공유 공간 데이터 경계 자동 회귀 테스트 기반 조사 시작 | 기존 테스트 러너 없음. DB 함수·RLS 중 어느 계층을 로컬에서 재현할지 확인 후 최소 의존성으로 구성 |
| 2026-07-16 | `REPO-001` | 완료 | Android 제외 범위의 기존 미커밋 작업을 기능·위험 단위 7개 체크포인트로 분리·보존 | build·lint·audit·diff check 및 운영 배포/DB 검증 근거 기록. 남은 변경은 Android·캘린더/테마 결합 범위로 보류. 다음은 `WEB-001` |
| 2026-07-16 | `REPO-001` | 문서 체크포인트 | DB/가족 제품 모델 `d8393d8`, 외장 복구 절차·문서 인덱스 `86ba9ed` 보존 | 완료/후속/보류 경계, 링크 존재, 비밀 패턴, diff check 확인 |
| 2026-07-16 | `REPO-001` | 세 번째 체크포인트 | 하우스 광고의 HTTP(S) URL 검증·테마 토큰과 Kakao 다중 슬롯 SDK 간섭 제거를 `a60d187`로 보존 | Android 파일 0개. 대상 ESLint·diff check·루트 production build/TypeScript 통과 |
| 2026-07-16 | `REPO-001`, `AND-005` | 범위 보류 | 캘린더 설정·테마 Web 브리지는 Android `updateEvent/deleteEvent`·자동 동기화·테마 bridge 구현과 결합됨 | Android 제외 원칙에 따라 분리 커밋하지 않음. Android 범위를 재개할 때 네이티브 코드와 함께 검증·커밋 |
| 2026-07-16 | `REPO-001`, `FAM-000` | 두 번째 체크포인트 | 가족·자녀 사전등록, 보호자 이메일 동의, 자녀 초대·승인, 공간 UI/API를 `ff43799`로 보존 | Android 파일 0개. 루트 build·대상 lint·diff check 통과, 운영 DB migration 020~022·RLS/권한·SECURITY DEFINER RPC 8종 재검증. 다음은 비Android 캘린더 브리지 검토 |
| 2026-07-16 | `REPO-001` | 첫 번째 체크포인트 | 운영 보안·DB 권한·백오피스 인증 경계 변경을 `8b15af7`로 보존 | Android 파일 0개. build·tsc·lint·audit와 운영 배포/DB 검증 완료 |
| 2026-07-16 | `REPO-001` | 범위 결정·시작 | Android 검증과 Android 파일은 이번 체크포인트에서 제외하고 비Android 변경만 분리 시작 | 운영 반영된 보안/DB/백오피스 변경을 첫 커밋으로 검증·보존 |
| 2026-07-16 | `OPS-003` | 부분 완료·차단 | 백오피스 보안 변경 운영 배포 READY 및 미인증 경계 검증 완료 | 로그인 200, 페이지 307, API 401. 비관리자/관리자 실제 로그인 세션 확보 후 403/2xx 확인 필요 |
| 2026-07-16 | `OPS-003` | 배포 메모 | 첫 임시본은 Root Directory 불일치, 두 번째는 루트 빌드 컨텍스트 누락으로 운영 승격 전 실패 | 기존 운영 영향 없음. Git 기준점 전체+백오피스 변경만 포함한 세 번째 배포 성공 |
| 2026-07-16 | `OPS-003` | 시작 | 로컬 백오피스 보안 변경의 운영 배포·인증 경계 스모크 테스트 시작 | 배포 범위를 재확인하고 인증 없음/API부터 운영 검증 |
| 2026-07-16 | `AUTH-001` | 차단 | 공식 문서상 Pro 이상 Dashboard/Management API 설정이며 현재 원격 Auth 설정 권한 수단 없음 | Dashboard 권한 또는 PAT 확보 후 `password_hibp_enabled=true`, Advisor 재검사 |
| 2026-07-16 | `SEC-007` | 완료 | 광고 이벤트 API를 검증된 service role 저장 경로로 선배포하고 Data API 직접 INSERT 제거 | 배포 READY·운영 404 경로 확인, migration `20260716025712`, anon/auth 권한 0·Advisor 제거 |
| 2026-07-16 | `SEC-007` | 시작 | `ad_events`의 항상 참인 INSERT 정책과 직접 Data API 쓰기 제거 시작 | 서버 수집 API를 먼저 배포·검증한 후 DB 직접 INSERT 차단 |
| 2026-07-16 | `SEC-006` | 완료 | public 광고 이미지 URL은 유지하고 버킷 전체 목록을 노출한 SELECT 정책 제거 | migration `20260716025042`, broad SELECT 0, 관리자 쓰기 정책 유지, 기존 URL 200·Advisor 제거 |
| 2026-07-16 | `SEC-006` | 시작 | Security Advisor의 public `ad-images` 버킷 전체 파일 목록 노출 경고 처리 시작 | 공개 URL 동작은 유지하고 broad SELECT 정책만 제거·재검사 |
| 2026-07-16 | `SEC-005` | 완료 | 유지보수 함수 공개 실행 차단 및 함수 3종 고정 search path 운영 적용 | migration `20260716024712`, anon/auth 실행 불가·service role 실행 가능, 관련 Advisor WARN 6건 제거 |
| 2026-07-16 | `SEC-005` | 시작 | DB-001 후 Security Advisor에서 기존 보안 경고 발견 | 유지보수 RPC 공개 실행과 mutable search path를 우선 하드닝하고 Advisor 재검사 |
| 2026-07-16 | `DB-001` | 완료 | 가족·자녀 6개 테이블 Data API 최소 권한 migration 운영 적용 | migration 이력, RLS 6/6, anon 0, authenticated SELECT 전용, service role 접근 확인 |
| 2026-07-16 | `DB-001` | 시작 | 가족·자녀 6개 테이블 Data API 최소 권한 migration 운영 적용 시작 | DDL 적용 후 실제 grants와 Security Advisor 검증 |
| 2026-07-16 | `OPS-002` | 완료 | Vercel CRON 키 회전, 메인 앱 기존 Production 재배포, Supabase Vault 기반 Cron 6종 전환 | 활성 6/6, Vault 참조 6/6, 평문 Bearer 0, canonical domain 6/6, 운영 자동화 endpoint 200 |
| 2026-07-16 | `OPS-002` | 운영 메모 | 대상 ID 오인으로 백오피스 기존 Production을 한 차례 동일 소스로 재빌드 | 로컬 변경 미포함, `admins.gleaum.com` READY 확인. 프로젝트·배포 이름 재검증 후 메인 앱 배포 완료 |
| 2026-07-16 | `OPS-002` | 중단 점검 | CRON 일시정지 요청 중 사용자 중단 후 운영 상태 재확인 | 6개 작업 모두 `active=true`, Vercel/Supabase 비밀값 변경 없음. 같은 작업을 안전 절차로 재개 |
| 2026-07-16 | `OPS-002` | 시작 | 노출된 운영 CRON 키의 원자적 회전 준비 시작 | Vercel 메인 앱 변수와 Supabase Cron 6종의 현재 구성·수정 경로 확인 |
| 2026-07-16 | `OPS-001` | 완료 | 백오피스 필수 서버 환경변수의 Production/Preview 적용 확인, 공개 `NEXT_PUBLIC_ADMIN_EMAILS` 제거 | 삭제 후 legacy 변수 0건 재조회. 새 인증 코드 배포·로그인은 `OPS-003` |
| 2026-07-16 | `OPS-001` | 시작 | 백오피스 Vercel 프로젝트와 서버 전용 관리자 환경변수 적용 범위 점검 시작 | 비밀값은 출력하지 않고 Production/Preview/Development 존재 여부만 확인 |
| 2026-07-16 | `SEC-001`~`SEC-003`, `DB-SEC-001` | 완료 | 백오피스 서버 권한 경계, 의존성 보안, 문서 비밀값 제거, DB 권한 migration 작성 | build·tsc·대상 lint·audit 통과. `OPS-001`~`OPS-003`, `DB-001` 운영 적용 필요 |
| 2026-07-16 | `DOC-001` | 완료·의사결정 | 이 문서를 프로젝트 전체 작업 상태의 단일 기준으로 채택 | 이후 모든 작업 시작·종료 시 해당 행과 일지 갱신 |
| 2026-07-16 | `REPO-000` | 완료 | 외장 SSD 경로에서 `.git`, tracked/untracked 작업 상태 확인 | 기존 미커밋 변경은 `REPO-001`에서 안전하게 분리 |
