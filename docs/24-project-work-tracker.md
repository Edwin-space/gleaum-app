# 24. 프로젝트 통합 작업 트래커

> **단일 기준 문서(SSOT)**: 현재 무엇을 해야 하는지, 무엇이 진행 중인지, 무엇이 언제 어떤 근거로 완료됐는지는 이 문서를 기준으로 판단한다.
>
> 최초 작성: 2026-07-16
> 최종 업데이트: 2026-07-24
> 현재 기능 기준점: `42b53b0` (플랫폼 파리티·공간 수명주기), 최신 문서/스토어 애셋 `564b923`, 작업 브랜치 `codex/platform-parity-sync-20260723`

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

위에서부터 순서대로 처리한다. 제품 플랫폼은 **Android App과 Apple App(iPhone/iPad/macOS)** 두 가지다. 구현·검증 우선순위는 **공통 코어 계약 → Android 완료 → Apple의 라이선스 비의존 구현·로컬 검증 → 유료 Apple Developer Program 획득 → Apple 실기기·출시**다. Web은 제품 기능 파리티 대상에서 제외하고 마케팅·랜딩·법적 문서·인증/초대 callback·백오피스·공통 API와 명시적인 시스템 fallback만 유지한다.

| 순서 | ID | 작업 | 상태 | 다음 행동 |
|---:|---|---|---|---|
| 1 | `FAM-013` | Android 자녀 계정 연결 전체 회귀 | `🟠 잔여 QA` | 보호자·자녀 실계정으로 등록→OTP→동의→초대→claim→승인/거절 전체 회귀 |
| 2 | `AND-001` | Android 핵심 기능 실기기 회귀 | `🟠 진행 중` | 로그인 직후 5개 탭 회귀는 통과. 가계부 쓰기·가족 공간 전환·안전 삭제를 격리 데이터로 검증 |
| 3 | `AND-005` | Android 기기 캘린더 회귀 | `🟠 진행 중` | 실제 가져오기·중복 방지·자동 생성/수정/삭제 검증 |
| 4 | `AND-010` | Android 시작·세션·선조회·캐시 마감 | `🟠 시작·세션·생체 회귀 통과` | pull-to-refresh·mutation 선택 무효화·오프라인/부분 실패 검증 |
| 5 | `AND-003` | Android TalkBack·적응형 최종 QA | `🟠 진행 중` | 실제 TalkBack 음성 탐색과 잔여 폴더블 회귀 |
| 6 | `AND-011` | Android Credential Manager Google 로그인 | `🟠 debug 실기기 통과` | 맥북 debug OAuth·재로그인 통과. 사용자 취소와 release·Play App Signing 인증서 조합을 최종 검증 |
| 7 | `AND-002`, `AND-006` | Android 릴리즈·Google Play 마감 | `⏸ 기능 안정화 대기` | 서명 AAB, 기능 그래픽, Console 정책·메타데이터·서명 확인 |
| 8 | `IOS-012` | iPhone SwiftUI·Liquid Glass 디자인 시스템 | `🟠 기반 구현·시각 검증 통과` | 검증된 semantic token·SF Symbols·표준 컴포넌트를 iPhone 인증·앱 셸 화면에 적용하며 계약 확장 |
| 9 | `IOS-008` | Apple 네이티브 인증·세션 마감 | `🟠 refresh·로그인·생체 로컬 완료` | refresh 상태 머신·재시도 UI·API 401 단일 재갱신 검증 완료. iPhone 16 Pro USB 재연결 후 Google OAuth·Face ID 실기기 회귀, 이어서 이메일·Apple 로그인 contract 구현 |
| 10 | `IOS-009` | iPhone 앱 셸·라우터·선조회 | `⬜ 인증 상태 머신 후` | iPhone 5탭, 중앙 Route, 선조회·캐시·pull-to-refresh 구현 |
| 11 | `IOS-010`, `IOS-005` | iPhone 핵심 기능·가족/자녀 네이티브화 | `⬜ 대기` | Android 공통 API 계약으로 일정·공간·가계부·알림·메뉴·가족/자녀 기능을 WebView 없이 구현 |
| 12 | `IOS-002`, `IOS-011` | iPhone OS 기능·라이선스 비의존 QA | `⬜ 대기` | EventKit·생체인증, iPhone simulator·테마·접근성·오프라인 회귀 |
| 13 | `IOS-013` | iPad 적응형·네이티브 macOS 확장 | `⏸ iPhone 완료 후` | iPhone 기능·로컬 QA 완료 뒤 iPad 다열/Stage Manager, 이후 native macOS window·sidebar·menu·keyboard 구현 |
| 14 | `IOS-007`, `IOS-003`, `IOS-004`, `IOS-006` | 유료 라이선스·실기기·Apple 출시 | `🟠 Personal Team Debug 실기기 통과` | `Edwin iPhone 16Pro` 자동 서명 build·install·launch 통과. 유료 capability·TestFlight/App Store 검증은 라이선스 비의존 구현 완료 뒤 진행 |

### 2026-07-23 맥북 작업 대조 결과

| 범위 | 판정 | 확인 근거 | 남은 완료 조건 |
|---|---|---|---|
| 보안·DB·백오피스 경계 | 구현·운영 기록 완료 | `8b15af7`, 운영 migration·Advisor·백오피스 build 기록 | 비관리자 403·관리자 2xx 실제 세션은 `OPS-003` |
| 가족/자녀 기반·account capability | 구현 완료 | `ff43799`, `a30cf60`, `2176a5d`; capability 4/4·데이터 경계 9/9 | assignee/observer, 연령 전환, 약관 운영은 `FAM-003`~`FAM-005` |
| Android Material 3·캘린더·권한 | 코드·로컬 빌드 완료 | `da2384e`, `bf69e1e`, `5ad7ba0`; 맥미니 debug compile/unit/lint/assemble 성공 | 인증 이후 실기기·TalkBack·캘린더 CRUD는 `AND-001`, `AND-003`, `AND-005` |
| 공간 수명주기·일정 상세·알림 공통 계약 | 코드·자동 검증 완료 | `42b53b0`; root production build 54/54, 데이터 경계 9/9, 알림 설정 2/2 | Android 실제 계정 회귀 후 Apple 네이티브 이식 |
| 기존 PC/Mobile Web 제품 기능 | 유지보수 모드 전환 | 2026-07-17까지의 구현·인증 회귀 기록 보존 | 신규 기능 파리티·시각 회귀 중단. 실제 진입·리다이렉트 정리는 `WEB-013` |
| Google Play 등록정보 | 카피·폰 이미지 제작 완료 | `564b923`; 1080×1920 RGB PNG 6장과 글자 수 검증 | 1024×500 기능 그래픽, Console 업로드·정책·서명 확인 |
| 작업 환경 동기화 | 완료 | 맥미니 HEAD와 원격 `564b923` 일치, 최신 lockfile 의존성 복원, root/backoffice/Android 빌드 성공 | 오래된 로컬 `stash@{0}`는 최신 코드에 자동 적용하지 않고 안전 백업으로만 유지 |

### 명시적 후순위

- PC/Mobile Web 제품 기능: 신규 구현과 Android/Apple 기능 파리티를 재개하지 않는다. 기존 인증 사용자 화면은 즉시 삭제하지 않되 신규 진입 홍보를 중단하고 안전한 전환 구현은 `WEB-013`에서 처리한다.
- Google Play 출시 절차: `AND-006`의 등록정보 제작은 진행 중이지만 Console 제출·정책·서명 확인과 `AND-002` 최종 AAB는 기능 안정화 뒤 재개한다.
- Apple: Android 마감 뒤 **iPhone을 먼저 완성**한다. `IOS-012` → `IOS-008` → `IOS-009` → iPhone 핵심 기능·로컬 QA 순이며, 그 뒤 `IOS-013`에서 iPad → macOS 순으로 진행한다. 유료 계정·서명·실제 capability 검증은 모든 라이선스 비의존 구현과 로컬 QA가 끝난 뒤 재개한다.
- Remote Config: Web 기능이 아니라 Android/Apple 네이티브 안전장치로만 재분류하며 기능 안정화 뒤 `AND-009`에서 재개한다.
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
| [ ] | `SEC-009` | Next/Sharp 신규 보안 권고 대응 | `🟠 상위 패치 대기` | 2026-07-23 | — | Next·eslint-config-next `16.2.11`로 자체 high 권고 4건 제거. Next가 요구하는 `sharp ^0.34.5`의 신규 libvips high 권고 1건은 호환성 검증 없는 `0.35.0` 강제 override를 금지하고 공식 Next 패치가 나오면 즉시 갱신. 현재 `npm audit --omit=dev`는 Next 경유 표시 포함 high 2건 |
| [ ] | `AUTH-001` | Supabase 유출 비밀번호 차단 활성화 | `🔴 차단` | 2026-07-16 | — | Pro 이상 기능. Dashboard `Authentication → Providers → Email`의 leaked password protection 활성화 권한 또는 Management API PAT 필요. 활성화 뒤 Advisor 재검사 |
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
| [ ] | `AND-001` | 실기기 시각·핵심 회귀 QA | `🟠 로그인 메뉴 회귀 통과·핵심 쓰기 QA 진행` | 2026-07-16 | — | 일정 등록 회귀 통과. 로그인 완료 전 account context를 준비하고, Compose NavigationSuite가 최초 fail-closed 슬롯을 유지하지 않도록 capability 변경 시 하단 탐색 subtree를 재생성. 맥북 debug OAuth 클라이언트와 최신 `google-services.json`을 반영한 APK를 `SM_F731N`에 설치해 실제 로그아웃→Google 재로그인→다른 메뉴 이동 전 최초 홈 5개 탭, 일정·공간·가계부·전체·홈 왕복 각 5개, 강제 종료·재시작 후 5개와 crash 0건을 확인. 남은 완료 조건은 가계부 쓰기·가족 공간 전환·안전 삭제의 격리 데이터 회귀 |
| [ ] | `AND-002` | Release AAB 검증 | `⏸ 보류` | 2026-07-16 | — | 사용자 결정으로 Google Play 출시 구간 후순위. 기능 production build와 핵심 회귀가 끝난 뒤 서명 비밀번호를 확보해 최종 AAB 검증 |
| [ ] | `AND-003` | 태블릿·폴더블·접근성 QA | `🟠 진행 중` | 2026-07-16 | — | compact·글꼴 1.3배·다크·expanded NavigationRail/840dp 폭·UI 의미/터치 영역 통과. `SM_F731N` 캘린더 목록 말줄임·단일 선택 역할·하단 시스템 인셋 통과, 실제 TalkBack 음성 탐색 필요 |
| [x] | `AND-004` | 로그인/가입 Compose 전환 여부 결정 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 브랜드 고정 다크 XML 예외 승인. 1080×2640·글꼴 1.3배에서 잘림/겹침 없음. 기능·정보 구조 대폭 변경 시 Compose 재평가 |
| [ ] | `AND-005` | 기기 캘린더 2·3차/가져오기 QA | `🟠 진행 중` | 2026-07-14 | — | WebView 가져오기 경로를 Compose 네이티브 Activity로 교체. `SM_F731N` 권한·캘린더 선택·후보 3개 조회·선택 UI 통과. 격리 일정으로 실제 가져오기→재조회 중복, 자동 생성·수정·삭제 확인 필요 |
| [ ] | `AND-006` | Play Console 출시 자료·정책 점검 | `🟠 진행 중` | 2026-07-16 | — | Android 1.1.5 기준 한국어 등록정보 카피와 익명화된 휴대전화 스크린샷 6장 준비 완료. `docs/25-google-play-release-readiness.md` 기준 1024×500 기능 그래픽 제작, Console 업로드·최신 versionCode·IARC·App access·서명 확인 필요 |
| [x] | `AND-007` | Android 백업·컴포넌트·R8·캘린더 변경 경계 하드닝 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `allowBackup=false`, preview Activity 비공개, 광범위 ProGuard keep 제거, 캘린더 표식/대상 검증. debug/test/lint/release package 재통과 |
| [x] | `AND-008` | Android 권한·개인정보·Data safety 정합성 보완 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 미사용 CAMERA/feature 제거, 캘린더·Firebase·AdMob/AdFit 개인정보처리방침 반영, Play 입력 초안 문서화. release package manifest의 카메라·미디어·외부 저장소 권한 0건·Android debug/test/lint·웹 lint/build 통과 |
| [ ] | `AND-009` | Remote Config 긴급 차단·필수 업데이트 기반 | `⏸ 보류` | — | — | Android 기능 안정화 이후 재개. 주요 기능 차단·필수 업데이트·API 버전 계약을 Android에 먼저 적용하고 Apple 후속 계약을 기록 |
| [ ] | `AND-010` | 앱 시작·세션 연속성·선조회·공유 캐시 | `🟠 시작·세션·생체 회귀 통과` | 2026-07-23 | — | Android 12 시스템 로고 위치를 이어받는 로고→BI·태그라인 브랜드 모션과 시작 상태 화면 구현. 저장 세션은 access token 만료 시 refresh token으로 먼저 갱신하며 네트워크/5xx는 세션을 지우지 않고 재시도 화면, 명시적 인증 실패만 로그인으로 분기한다. 앱 잠금 사용자는 네이티브 생체인증/기기 PIN을 통과하고 15초 유예로 WebView 이중 인증을 방지한다. Adaptive/legacy 설치 아이콘과 시스템 스플래시 전용 안전영역을 분리해 네이비 배경 중앙에 로고가 잘림 없이 표시되도록 보정. `SM_F731N`에서 Play Console 아이콘과 나란히 비율·마스크, 시작 프레임, 3단계 모션, 로그아웃→로그인, 복원 세션→생체인증, 강제 만료→자동 갱신, 인증 취소→재시도 화면과 최종 APK 재설치·프롬프트를 확인. Kotlin compile·unit·lint·assemble 성공. 남은 완료 조건은 pull-to-refresh·mutation 선택 무효화·오프라인/부분 실패와 딥링크 회귀 |
| [ ] | `AND-011` | Credential Manager 네이티브 Google 로그인 | `🟠 맥북 debug 실기기 통과` | 2026-07-23 | — | Credential Manager 계정 선택 → Google ID token → Supabase `/auth/v1/token?grant_type=id_token` 교환과 SessionManager 저장 확인. Firebase SHA-1/SHA-256와 Google Cloud Android OAuth 클라이언트 `글리움-안드로이드-맥북-디버그`를 추가하고 최신 `google-services.json` 반영. `SM_F731N`에서 실제 계정 선택·로그아웃·재로그인 성공 및 인증 오류 0건. 사용자 취소 UX와 release·Play App Signing 인증서 조합을 최종 검증한 뒤 완료 |

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

| Android 기준 기능 | 공통 계약 영향 | Web 지원 표면 영향 | Apple 후속 |
|---|---|---|---|
| 가족 공간 전환 (`FAM-008`) | 기존 공간 ID·데이터 유지, admin 권한, 개인 공간 차단, 오류 코드 계약 유지 | Native Bearer API와 오류 관측성만 유지 | Apple 공간 관리 구현 시 같은 API·오류 계약 적용 |
| 가족 관계·초대/설정 분리 (`FAM-009`) | `space_members.role`은 권한, `family_role`은 표시 관계. 일반 가족 코드 초대와 자녀 검증 초대 분리 | 초대 랜딩·토큰 검증만 유지 | Android 확정 정보 구조와 동일 의미로 네이티브 구현 |
| 자녀 초대 경로 (`FAM-010`, `FAM-012`) | 세션 재적용은 pending route를 보존하고 승인 전 멤버십·연령 권한 생성 금지 | 앱 미설치·구버전 초대 랜딩과 인증 callback만 유지 | Universal Link·pending route·후보 승인 계약 적용 |
| 자녀 연결 Compose 전환 (`FAM-013`) | 기존 DB/RLS/RPC는 유지하고 자녀 API 8개가 Bearer 인증을 지원 | 법적 원문·초대 fallback 외 자녀 관리 UI 신규 개발 없음 | 보호자 관리·OTP·동의·claim을 같은 API 계약으로 SwiftUI 구현 |
| 네이티브 Google 로그인 (`AND-011`) | Supabase 세션 토큰 형식은 기존과 동일 | OAuth/email callback과 복구 경로만 유지 | Google 네이티브 로그인과 Sign in with Apple 구현 |
| 앱 시작·세션·선조회 (`AND-010`) | Supabase 세션 형식과 API 응답은 유지. 만료 access token은 refresh 우선, 일시적 네트워크 실패는 로컬 세션 보존, 명시적 refresh 거부만 로그인 전환 | 인증 callback·딥링크 fallback만 유지하며 Web 제품 화면 캐시·시작 모션 파리티 없음 | 시스템 Launch Screen→브랜드 모션, refresh 우선 상태 머신, 선택적 Face ID/Touch ID·기기 암호 앱 잠금, 일시 실패 재시도, 선조회·pull-to-refresh를 같은 의미로 구현 |

Android 구현 중 새 공통 API·DB·권한 변경이 발생하면 이 표와 `PAR-002` 싱크 보드에 먼저 기록한다. Web 제품 UI를 후속 구현하지 않고 Apple 영향만 등록한다.

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
| [ ] | `FAM-011` | 보호자 이메일 OTP·필수 동의 정합화 | `🟠 실메일 회귀 대기` | 2026-07-23 | — | 실메일 8자리에 맞춰 OTP UI/API/공용 템플릿을 통일하고 확인 증적 DB 강제, `email_otp` 이력 완료. 운영 Dashboard 저장과 Production `dpl_6tpDS5ay519BAZsTaVZo18JhJFKe` 배포·인증 경계 401·runtime error 0 확인. 보호자 본문·코드·필수 동의 실사용자 완료 확인 필요 |
| [ ] | `FAM-012` | 자녀 선택 이메일·일회성 토큰·최종 승인/거절 | `🟠 실계정 회귀 대기` | 2026-07-23 | — | 이름·생년월일 중심 등록, 선택 이메일 제한, Google/이메일 claim 후보 스냅샷, 보호자 본인 claim 차단, 승인 전 멤버십·연령 권한 보류, 거절·재초대, OS 공유·문자·QR 구현. 운영 migration·Production `dpl_G4kCYuzC2Cjz79LAtbVUzXiKELJN`, TypeScript·3/3·9/9·4/4·Next/Android build, 공개 랜딩 200·신규 API 401·runtime error 0 확인. 보호자·자녀 실계정 회귀 필요 |
| [ ] | `FAM-013` | Android 자녀 계정 연결 Compose 전환 | `🟠 코드 완료·실기기 대기` | 2026-07-23 | — | Compose Material 3 보호자 목록/등록/8자리 OTP/필수 동의/초대 공유/후보 승인·거절과 자녀 token claim 구현. 자녀 API 8개 Cookie·Bearer 공통 인증, `/space/children`, `/family/guardian/verify`, `/invite/child/{token}` 네이티브 라우팅, Kotlin compile 통과. Production API 배포 후 보호자·자녀 실계정 회귀 필요 |

상세 기준: `docs/21-family-child-account-foundation.md`

## 7. Web·API·데이터

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [ ] | `WEB-001` | 공통 데이터 경계 자동 회귀 테스트 | `🔴 차단` | 2026-07-16 | — | Web 제품 QA가 아니라 Android/Apple 공통 API·RLS 보증 항목. Node/tsx 접근 매트릭스 8개 통과. Docker Desktop·로컬 Supabase 구성 후 역할별 CRUD 통합 테스트 추가 필요 |
| [ ] | `WEB-002` | 이메일 인증 지원 표면 운영 검증 | `⬜ 대기` | — | — | Android/Apple 이메일 가입을 지원하는 Custom SMTP, 확인 템플릿, Redirect URL, 만료/재발송 실제 계정 테스트 |
| [ ] | `WEB-003` | 공통 이미지 첨부 저장 계약 | `⬜ 대기` | — | — | Native API·Storage/RLS·용량·확장자·삭제 계약을 먼저 확정하고 Android, Apple 순으로 UI 구현. 브라우저용 첨부 UI 완성은 범위 제외 |
| [ ] | `WEB-004` | 운영 통계·분석 확장 | `⬜ 대기` | — | — | 앱 지표 정의 후 공통 수집과 백오피스 소유 경계를 확정. 사용자 Web 제품 화면은 추가하지 않음 |
| [ ] | `WEB-005` | 일정 단건 외부 공유 지원 표면 | `⬜ 대기` | — | — | Android/Apple에서 공유가 필요할 때만 만료·취소 가능한 읽기 전용 Web 랜딩과 개인정보 노출 정책 구현 |
| [x] | `WEB-006` | 마이페이지 Desktop/Mobile 기능 일치 | `⏹ 정책 종료` | 2026-07-16 | 2026-07-23 | 1차 구현·인증 회귀 기록은 보존한다. Web이 제품 플랫폼에서 제외되어 추가 기능 동등화·테마·키보드/터치 회귀는 진행하지 않는다 |
| [x] | `WEB-007` | Web Remote Config 소비 | `⏹ 정책 종료` | — | 2026-07-23 | Web 제품 기능 gate는 구현하지 않는다. 네이티브 긴급 차단·최소 버전·점진 배포는 `AND-009`와 Apple 후속 항목이 소유한다 |
| [x] | `WEB-008` | Web 설정·준비 중 기능 노출 정합화 | `⏹ 정책 종료` | 2026-07-16 | 2026-07-23 | 기존 죽은 진입점 정리까지만 보존하고 Android/Apple 설정과 Web 기능을 맞추는 후속 작업은 중단한다 |
| [x] | `WEB-009` | Web 일정 장소·지도 기능 완성 | `⏹ 정책 종료` | 2026-07-16 | 2026-07-23 | PC/Mobile Web 사용자 기능을 완성하지 않는다. 지도 UX가 필요하면 Android와 Apple 네이티브 항목에서 각각 구현한다 |
| [ ] | `WEB-010` | 알림 설정 서버 발송 경계 적용 | `🟠 공통 코어로 유지` | 2026-07-16 | — | Web UI 파리티가 아니라 Android/Apple이 공통으로 사용하는 서버 Cron·FCM·인앱 기록의 opt-in 강제 항목이다. 운영에서 실제 수신/비수신 회귀 후 완료 |
| [x] | `WEB-011` | 공개 첫 접근 마케팅 랜딩 개편 | `✅ 완료` | 2026-07-23 | 2026-07-23 | 모든 Web 뷰포트에 서비스 소개, 핵심 기능, 플랫폼 상태와 스토어 안내를 제공. 실제 Android 화면의 정보 구조를 개인정보 없이 재구성. PC 1440×900·Mobile 390×844 시각 회귀, SSR 소개 문구, production build·링크 검증 완료. 로그인형 Web 제품 홍보 제거는 `WEB-013`에서 처리 |
| [x] | `WEB-012` | Web 지원 표면 경계 확정 | `✅ 완료` | 2026-07-23 | 2026-07-23 | Web 유지 범위를 마케팅·랜딩·다운로드 안내·법적 문서·인증/이메일/초대 callback·앱 미설치/구버전 fallback·공통 API·Cron·백오피스로 고정. 로그인 후 홈·일정·가계부·공간·알림·마이페이지는 신규 구현·기능 파리티·QA 대상에서 제외 |
| [ ] | `WEB-013` | Web 지원 표면 전환 구현 | `🟠 공개 랜딩 정리 완료·전환 설계 중` | 2026-07-23 | — | 공개 랜딩의 `웹에서 시작`·`웹 서비스 이용` CTA와 Web 플랫폼 제공 문구를 제거하고 Android·Apple 2개 플랫폼 안내로 전환. 대상 ESLint·production build 55/55와 생성된 루트 HTML 문구 검증 통과. 기존 인증 Web 진입 사용량 확인, 사용자 공지·리다이렉트·데이터 접근 정책 수립 후 안전하게 지원 표면만 남긴다. 인증/초대 callback·법적 문서·API·Cron·백오피스는 제거 금지 |
| [x] | `PAR-001` | PC Web·Mobile Web·Android 3플랫폼 파리티 | `⏹ 정책 종료` | 2026-07-16 | 2026-07-23 | 2026-07-23 제품 플랫폼을 Android/Apple 두 가지로 재정의하면서 종료. 기존 구현·검증 기록은 작업 일지와 Git 이력에 보존 |
| [ ] | `PAR-002` | Android·Apple 네이티브 기능 동등화 | `🟠 진행 중` | 2026-07-23 | — | 공통 API·DB·RLS·capability·오류 계약을 기준으로 Android를 먼저 마감하고 Apple에 후속 구현. Web은 기능 동등화 완료 조건에 포함하지 않는다 |

### `PAR-002` Android·Apple 운영 규칙

- 정식 제품 플랫폼은 `Android App`과 `Apple App(iPhone/iPad/macOS)` 두 가지다.
- 구현·검증 순서는 **공통 코어 영향 확인·계약 확정 → Android App 구현·실기기·출시 마감 → Apple App 구현·실기기·출시 마감**으로 고정한다.
- Android를 기준 동작과 최우선 구현 대상으로 삼되 Android 전용 UI/OS 제약을 공통 계약으로 확대하지 않는다.
- Apple은 같은 데이터·권한·오류 의미를 유지하되 SwiftUI·Apple 플랫폼 UX로 구현한다.
- Web은 제품 기능 파리티 대상이 아니다. 기존 인증 사용자 화면을 신규 개발하지 않고, 유지가 필요한 지원 표면만 보안·접근성·링크 정상 동작을 보수한다.
- 긴급한 운영 오류·보안·데이터 손실 위험은 플랫폼 순서보다 우선하며 사유를 작업 일지에 남긴다.

#### Web 지원 표면

| 유지 | 범위 | 완료 기준 |
|---|---|---|
| 마케팅 | 루트 랜딩, 기능 소개, 스토어/다운로드 안내 | 공개 접근·반응형·SEO·스토어 링크 정상 |
| 법적 문서 | 이용약관, 개인정보처리방침, 계정 삭제 안내 | 앱 인앱 문서 뷰와 외부 브라우저에서 열림 |
| 인증·링크 | OAuth/email callback, 비밀번호 재설정, 일반/자녀 초대 랜딩, 앱 미설치·구버전 fallback | 토큰 검증·만료·복귀 경로·개인정보 최소 노출 |
| 공통 서버 | Native Bearer API, 필요한 Cookie callback, Cron, 알림 발송, DB/RLS 경계 | Android/Apple 공통 계약과 운영 관측성 유지 |
| 운영 도구 | `admins.gleaum.com` 백오피스 | 관리자 인증·권한·감사 경계 유지 |

다음은 Web 신규 구현 대상이 아니다: 브라우저용 홈·일정·가계부·공간·알림·마이페이지의 기능 추가, Android/Apple UI 동등화, Desktop/Mobile Web 별도 시각 회귀, Web 전용 네이티브 기능 대체 구현.

#### 변경 작업 영향 확인 체크리스트

- [ ] 공통 API 요청·응답·오류 코드가 변경되는가?
- [ ] DB·RLS·capability·개인/공간 데이터 경계가 변경되는가?
- [ ] Android 구현·실기기·출시 영향은 무엇인가?
- [ ] Apple 구현·실기기·출시 후속은 무엇인가?
- [ ] Web 지원 표면의 인증·초대·법적 문서·API·백오피스에 영향이 있는가?
- [ ] Web 제품 기능 구현을 실수로 추가하거나 파리티 완료 조건에 포함하지 않았는가?
- [ ] 알림·딥링크·오류 메시지가 Android와 Apple에서 같은 의미를 갖는가?

#### 네이티브 2플랫폼 싱크 보드

| 기능 | 공통 코어 계약 | Android App | Apple App | 다음 행동 |
|---|---|---|---|---|
| 로그인·세션 | Bearer token·capability·refresh 우선·명시적 만료/로그아웃 | `🟠 시작·갱신·생체 통과` | `⬜ 기존 browser OAuth·브리지 존재` | 기존 Google OAuth·이메일을 SwiftUI 상태 머신에 연결하고 Apple 로그인은 mock 가능한 contract부터 구현 |
| 홈·캐시 | 계정 모드·개인 원장·빈/오류·새로고침 | `🟠` | `⬜` | Android 캐시/오프라인 회귀 후 SwiftUI 셸 선조회 |
| 일정 | 개인/공간 경계·역할·참여자·알림 | `🟠` | `⬜` | Android 역할별 회귀 후 Apple 목록/상세/폼 |
| 공간·가족·자녀 | 선택·초대·관계·권한·승인·안전 삭제 | `🟠` | `⬜` | Android 보호자/자녀·전환/삭제 회귀 후 Apple 이식 |
| 가계부 | 개인/공간 원장·반복 항목·권한 | `🟠` | `⬜` | Android 쓰기 회귀 후 Apple 이식 |
| 알림 | 서버 opt-in·목록·읽음·딥링크 | `🟠` | `⬜` | Android FCM 회귀와 서버 경계 완료 후 APNs 구현 |
| OS 연동 | 캘린더·생체인증·딥링크·접근성 | `🟠` | `🟡 EventKit·LocalAuthentication·FCM·AASA 기반 존재` | 로컬 기능을 먼저 완성하고 실제 APNs/Universal Links만 유료 계정 이후 검증 |
| 디자인 시스템 | 플랫폼별 네이티브 정보 구조·브랜드 의미만 공유 | `✅ Material 3` | `🟡 Liquid Glass·적응형 기준 확정` | semantic token·SF Symbols·iPhone 5탭·iPad split view·macOS sidebar/window 구현 |

## 8. iOS·Apple 플랫폼

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `IOS-000` | iOS 네이티브 셸·홈·일정 등록 1차 기반 | `✅ 완료` | 2026-06-18 | 2026-06-18 | Swift 네이티브 API client, 홈, 일정 Sheet, 라우팅 기반 |
| [ ] | `IOS-001` | 운영 API 실제 계정 회귀 | `⬜ 대기` | — | — | 네이티브 셸 전환 뒤 홈 요약·일정 등록·세션 유지와 공통 API 오류 계약 검증 |
| [ ] | `IOS-002` | EventKit 캘린더 UX | `⬜ 대기` | — | — | 캘린더 선택·내보내기·가져오기·중복 정책 구현 |
| [ ] | `IOS-003` | APNs·알림 운영 설정 | `⏸ 유료 라이선스 단계` | — | — | Firebase Messaging SDK·plist·APNs/FCM callback은 존재. 로컬 token 등록·딥링크 코드 완료 뒤 APNs Auth Key·capability·실기기 수신 검증 |
| [ ] | `IOS-004` | Universal Links 운영 검증 | `⏸ 유료 라이선스 단계` | — | — | Associated Domains entitlement·AASA·URL 처리 기반은 존재. 중앙 Route 구현 뒤 운영 Team capability·초대/알림 링크 실기기 검증 |
| [ ] | `IOS-005` | 가족·자녀 capability 동등화 | `⬜ 대기` | — | — | Android 확정 동작과 공통 API를 기준으로 가족 관계·초대 분리·자녀 연결을 iOS에 구현 |
| [ ] | `IOS-006` | TestFlight/App Store·macOS 출시 | `⏸ 유료 라이선스 단계` | — | — | 라이선스 비의존 구현·로컬 QA 완료 뒤 스크린샷·메타데이터·개인정보·심사 계정·macOS 서명/공증 준비 |
| [ ] | `IOS-007` | Xcode·서명·capability·권한 기준선 | `🟠 Personal Team Debug 실기기 통과` | 2026-07-23 | — | 대상 `Edwin iPhone 16Pro`(iPhone 16 Pro, iOS 26.5.2)의 USB/Xcode 연결을 복구. Debug는 빈 entitlement, Release는 Push·Associated Domains·Sign in with Apple 운영 entitlement를 유지하도록 분리하고 Personal Team 자동 서명 build·install·launch 통과. 유료 Team capability·운영 서명 검증은 라이선스 단계에 유지 |
| [ ] | `IOS-008` | 네이티브 인증·세션 마감 | `🟠 refresh·로그인·생체 로컬 완료` | 2026-07-24 | — | UIKit 고정 로그인 화면을 SwiftUI·Apple semantic color·Dynamic Type·SF Symbols·시스템 prominent button으로 교체. Capacitor Preferences와 동일 키를 읽는 앱 시작/포그라운드 복귀 Face ID·Touch ID·기기 암호 gate, 재잠금 간격, OAuth 직후 15초 중복 방지, 다른 계정 확인 dialog를 연결했다. Android와 같은 refresh 우선 상태 머신을 앱 시작·복귀·Native API에 적용해 동시 갱신 합치기, 회전 token 저장, 네트워크·5xx 세션 보존, refresh 4xx만 무효화, API 401 단일 재갱신, 갱신 중 로그아웃 세션 부활 방지를 구현. Swift 6 시나리오 13/13, simulator light/dark/최대 접근성 글꼴, simulator Debug·generic iPhone arm64 무서명 build 통과. 실제 iPhone Face ID·Google OAuth 회귀와 이메일·Apple 로그인 contract 구현 필요 |
| [ ] | `IOS-009` | SwiftUI iPhone 앱 셸·라우터·선조회 | `⬜ Android 후속 등록` | — | — | Launch Screen→SwiftUI 모션, iPhone 5탭/탭별 `NavigationStack`, 중앙 Route, 시작 선조회·캐시·수동 새로고침 구현. iPad shell은 `IOS-013`에서 후속 |
| [ ] | `IOS-010` | 핵심 기능 네이티브화 | `⬜ 대기` | — | — | 홈·일정·공간·가계부·알림·전체 메뉴를 WebView 없이 구현 |
| [ ] | `IOS-011` | iPhone 우선·후속 iPad/macOS 테마·접근성 QA | `⬜ 대기` | — | — | 1차로 iPhone 크기·테마·Dynamic Type·VoiceOver·오프라인/세션 회귀 완료. 이후 `IOS-013`과 함께 iPad Split View/Stage Manager·macOS 창/키보드 QA |
| [ ] | `IOS-012` | iPhone SwiftUI·Liquid Glass 디자인 시스템 전환 | `🟠 기반 구현·시각 검증 통과` | 2026-07-23 | — | `GleaumColors` semantic token, spacing/radius/layout, card·status badge·section header, 5개 섹션 SF Symbols, DEBUG 전용 카탈로그를 Xcode target에 연결. iPhone 17 Pro iOS 26.4.1에서 무서명 Debug build, 라이트·다크 렌더링, 카탈로그 종료 후 기존 로그인 흐름 복원을 확인. 다음은 `IOS-008` 인증 상태 화면부터 실제 제품 화면에 계약 적용 |
| [ ] | `IOS-013` | iPad 적응형·네이티브 macOS 확장 | `⏸ iPhone 완료 후` | 2026-07-24 | — | 사용자 결정으로 iPhone 기능·로컬 QA 완료 후 재개. 그다음 iPad regular width sidebar·list-detail·inspector·다열 dashboard를 구현하고, iPad 완료 후 native macOS window·sidebar·toolbar·menu·keyboard·Settings 구현 |

상세 계획: `docs/16-ios-native-roadmap.md`, 재개 감사: `docs/27-ios-resumption-readiness.md`, 디자인 교체: `docs/28-apple-liquid-glass-design-plan.md`

## 9. 백오피스·CRM·광고

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `BO-000` | KPI·회원/공간 상세·FCM 캠페인·광고 CRUD 기반 | `✅ 완료` | 2026-05-12 | 2026-07-16 | 현재 라우트와 데이터 연동 코드 존재. 운영 배포 검증은 `OPS-003`에서 수행 |
| [ ] | `BO-001` | 대시보드 추세·구성비 차트 | `⬜ 대기` | — | — | WAU와 가계부/캘린더 지표 정의·기간 필터·빈 상태 구현 |
| [ ] | `BO-002` | CRM SMS 채널 | `⏸ 보류` | — | — | 제공사·비용·수신 동의/거부 정책 결정 후 재개 |
| [ ] | `BO-003` | CRM 이메일 채널 | `⏸ 보류` | — | — | 제공사·도메인 인증·수신 동의/거부 정책 결정 후 재개 |
| [ ] | `BO-004` | 광고 성과 차트·상세 통계 | `⬜ 대기` | — | — | 노출/클릭 이벤트 신뢰성 검증 후 기간·플랫폼·슬롯 분석 구현 |
| [ ] | `BO-005` | 인앱 팝업 광고 서비스 컴포넌트 | `⏸ 보류` | — | — | 노출 빈도·닫기·아동 계정 광고 정책 확정 후 재개 |

상세 문서: `backoffice/docs/03-current-status.md`

## 10. 장기 후보

| 체크 | ID | 작업 | 상태 | 재개 조건 |
|---|---|---|---|---|
| [ ] | `LONG-001` | Apple/Kakao 소셜 로그인 | `⏸ 보류` | 사용자 요구·전환율 근거와 운영 계정 준비 |
| [x] | `LONG-002` | macOS/Catalyst 앱 후보 | `✅ 정식 Apple 범위로 승격` | 2026-07-24 사용자 결정으로 `IOS-013` 네이티브 macOS 작업에 이관. Catalyst/Designed for iPad는 최종 제품 경로로 사용하지 않음 |
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
| 2026-07-24 | `IOS-008` | refresh 우선 세션 상태 머신 완료 | Android 기준 계약을 iPhone 앱 시작·포그라운드·Native API에 적용. access token 만료 시 refresh token을 먼저 교환하고 동시 갱신 요청을 하나로 합치며, 회전 refresh token을 저장한다. 네트워크·5xx·정상 응답 파싱 실패는 로컬 세션을 보존한 SwiftUI 재시도 상태로 처리하고, refresh 4xx 또는 복구 불가능한 저장값에서만 로그인으로 전환한다. API 401은 강제 refresh 후 한 번만 재요청하며 갱신 중 로그아웃·계정 변경 시 늦은 응답이 세션을 되살리지 못한다 | Swift 6 독립 시나리오 13/13(유효·만료 성공·일시 실패 보존·4xx 무효화·5xx/네트워크·동시 갱신·로그아웃 race·응답 정규화), iPhone 17 Pro simulator Debug build/install/launch, 복구 화면 light/dark·최대 접근성 글꼴 스크롤, generic iPhone arm64 Debug 무서명 build, plist·pbxproj lint·`git diff --check` 통과. 실제 iPhone 16 Pro OAuth·Face ID는 USB 재연결 후 회귀 |
| 2026-07-24 | `IOS-008`, `IOS-012` | SwiftUI 로그인·생체인증 1차 교체 완료 | 기존 UIKit/WebView 화면을 부분 보정하지 않고 iPhone 핵심 경로 전체를 SwiftUI·Apple 표준 탐색/입력/피드백으로 교체하기로 확정. 첫 범위의 UIKit 로그인 UI를 SwiftUI 브랜드 hero·system material·prominent button·법적 링크로 교체하고, WebView 이후가 아닌 앱 시작/복귀 단계에서 동작하는 Face ID·Touch ID·기기 암호 gate를 구현. Capacitor Preferences 앱 잠금/범위/재잠금 설정과 기존 Google browser OAuth·세션 계약은 유지 | iPhone 17 Pro simulator Debug build/install/launch, 로그인 light/dark·접근성 대형 글꼴, 생체 gate light/dark Debug preview, 실제 LocalAuthentication 기기 암호 fallback 호출, generic iPhone arm64 Debug 무서명 build, plist·pbxproj lint·`git diff --check` 통과. iPhone 16 Pro는 현재 USB bus에서 사라져 CoreDevice `unavailable`; 케이블 재연결 뒤 자동 서명 install·Face ID·Google OAuth 복귀를 검증하고 `IOS-008` refresh 우선 세션으로 계속 |
| 2026-07-24 | `IOS-007` | iPhone 16 Pro Personal Team Debug 설치·실행 통과 | 최초 잘못 선택한 `SJ iPhone`(iPhone 13 mini)은 빌드를 중단해 설치하지 않았고 실제 대상 `Edwin iPhone 16Pro`의 USB/Xcode 연결을 복구. 유료 Team이 필요한 Push·Associated Domains·Sign in with Apple 때문에 Personal Team 서명이 막히지 않도록 Debug/Release entitlement를 구성별로 분리 | iPhone 16 Pro(iOS 26.5.2) 고정 대상으로 `xcodebuild` 자동 서명 성공, `com.gleaum.app` 설치·launch 성공. Debug 서명에는 application/team identifier와 `get-task-allow`만 포함되고 유료 capability는 제외됨. Release 운영 entitlement는 보존했으며 유료 Team 검증은 최종 라이선스 단계 |
| 2026-07-24 | `IOS-012`, `IOS-013` | Apple 장치 구현 순서 확정·iPhone 디자인 기반 검증 | Apple 구현 순서를 iPhone 완성 → iPad → macOS로 고정하고 iPad/macOS를 `IOS-013` 후순위로 전환. iPhone semantic color·spacing/radius·card·status badge·section header·5개 섹션 SF Symbols와 DEBUG 카탈로그를 구현 | iPhone 17 Pro iOS 26.4.1 무서명 Debug build 성공. 라이트·다크 카탈로그를 실제 시뮬레이터에서 확인하고 검증 환경변수 제거 후 기존 로그인 화면 복원 확인. 다음은 `IOS-008` refresh 우선 세션·인증 AppState |
| 2026-07-24 | `IOS-003`, `IOS-004`, `IOS-006`~`IOS-013`, `LONG-002` | Apple 라이선스 순서·iPad/macOS 범위 재정의 | 유료 Apple Developer Program은 SwiftUI 화면·세션·공통 API·iPad/macOS 적응형 UI·시뮬레이터/로컬 Mac 검증을 모두 완료한 뒤 획득하기로 결정. iPad는 확대형 iPhone이 아니라 sidebar·list-detail·inspector·다열 dashboard를 사용하고, macOS는 공통 Swift Package를 공유하는 native SwiftUI target으로 정식 범위에 포함 | 저장소 감사에서 Firebase Messaging SDK/plist, APNs/FCM callback, Supabase Google browser OAuth, custom scheme, LocalAuthentication, EventKit, Associated Domains/AASA가 이미 존재함을 확인해 외부 준비에서 제외. Google native Sign-In SDK와 Apple 로그인 실행 코드는 없으며 macOS target은 비활성 상태. 다음 Apple 작업은 `IOS-012` shared package·디자인 시스템 골격이며 운영 Team·APNs·실기기·TestFlight/공증은 최종 라이선스 단계 |
| 2026-07-23 | `IOS-008`~`IOS-012`, `PAR-002` | Android 기준 Apple 준비·Liquid Glass 디자인 교체 결정 | Android에서 확정한 시작 모션·refresh 우선 세션·생체 잠금·5탭·캐시·기능/권한/오류 계약을 Apple 이식 체크리스트로 정리. 기존 iOS 세션/API/OS 브리지 기반은 재사용하되 UIKit 고정 색상·수동 하단 바·커스텀 카드 디자인은 확장하지 않고 SwiftUI·Apple HIG로 교체한다. Liquid Glass는 앱 전체 장식이 아니라 탭·내비게이션·toolbar 등 기능 계층에만 적용 | 공식 Apple HIG·Materials·Liquid Glass·SwiftUI·Icon Composer 기준과 현재 iOS 15 타겟/Swift 5/AppDelegate modal 구조를 대조. `docs/28-apple-liquid-glass-design-plan.md`에 외부 준비, iOS 17+ 권장 baseline/iOS 26 enhancement, Figma semantic token↔SwiftUI 계약, 단계별 완료 기준을 등록. Android 마감 후 `IOS-012` 디자인 골격부터 구현 |
| 2026-07-23 | `AND-010` | Android 설치 아이콘·시스템 스플래시 로고 안전영역 보정 | 기존 adaptive icon 전경 PNG가 108dp 캔버스 끝까지 차 있어 Samsung 스쿼클 마스크에서 상단·좌우가 잘리는 현상을 실기기 앱 서랍에서 확인. 설치 아이콘은 48dp 중앙 전경+네이비 배경, Android 12 시스템 스플래시는 288dp 캔버스 안 132dp 중앙 심볼로 분리하고 API 24~25 legacy 아이콘에도 동일 정책 적용 | `SM_F731N`에 최종 APK를 덮어 설치해 Play Console 아이콘과 나란히 비교. 로고 전체 외곽 노출·중앙 정렬·배경색 일치와 앱 시작 첫 프레임→BI 애니메이션 연결 확인. `testDebugUnitTest`·`lintDebug`·`assembleDebug`, `git diff --check` 통과 |
| 2026-07-23 | `AND-010`, `IOS-008`, `IOS-009` | Android 브랜드 시작·세션 연속성·생체인증 앱 잠금 구현 | Android 12 시스템 로고와 같은 중심에서 로고가 확장되고 BI·태그라인·시작 상태가 순차 노출되는 네이티브 모션을 구현. Router를 저장 세션 확인→만료 token refresh→선택적 생체인증/기기 PIN→홈 또는 로그인 상태 머신으로 정리하고, 네트워크·5xx에서는 세션을 지우지 않는 재시도 화면을 제공. 네이티브 잠금 직후 WebView 이중 프롬프트는 15초 유예로 방지 | `SM_F731N`에서 0.35/0.9/1.55초 모션 단계, 로그아웃 로그인 화면, 복원 세션 생체 프롬프트, 강제 만료 access token 자동 갱신, 인증 취소 재시도 화면, 최종 APK 재설치 후 `RouterActivity`·생체인증/`PIN 사용`을 확인. `compileDebugKotlin`·`testDebugUnitTest`·`lintDebug`·`assembleDebug` 성공. Apple은 같은 세션 의미와 Face ID/Touch ID 후속을 등록했고 Android에는 오프라인·딥링크·캐시 무효화 회귀가 남음 |
| 2026-07-23 | `AND-001`, `AND-011` | 맥북 debug Google 로그인·최초 홈 5개 탭 실기기 회귀 | 맥북 debug SHA-1/SHA-256를 Firebase에 등록하고 같은 SHA-1의 Android OAuth 클라이언트를 Google Cloud에 생성해 최신 `google-services.json`에 반영. 로그인 완료 전 account context 준비에 더해 Compose `NavigationSuiteScaffold`가 최초 4개 destination 슬롯을 유지하던 문제를 capability key 기반 subtree 재생성으로 수정 | Android debug assemble 성공. `SM_F731N`에서 실제 앱 로그아웃→Credential Manager 계정 선택→Google/Supabase 로그인→다른 메뉴 이동 전 최초 홈의 `홈·일정·공간·가계부·전체` 5개 확인. 5개 메뉴 왕복마다 5개 유지, 강제 종료·재시작 후 5개 유지, 인증 오류·FATAL EXCEPTION 0건. 사용자 취소와 release·Play App Signing 조합은 `AND-011` 잔여 |
| 2026-07-23 | `AND-001`, `WEB-013` | 로그인 직후 가계부 탭 복구·공개 랜딩 Web 제품 홍보 제거 | 새 로그인 시 `SessionManager`가 이전 capability를 비운 직후 홈 셸이 fail-closed 4개 탭으로 먼저 렌더링되는 레이스를 확인. 로그인 성공 후 account context 준비를 기다린 뒤 메인으로 이동하도록 공통 선조회 진입점을 추가하고 cold start 라우터도 같은 경로로 통합. 공개 홈페이지에서는 `/login` CTA 3개와 Web 플랫폼 카드를 제거하고 Android 우선·Apple 후속 2플랫폼 안내로 전환 | Android `compileDebugKotlin`·unit test·lint·assemble 성공, debug APK 29MB 생성. `SM_F731N` 설치 앱과 MacBook APK 모두 debug 빌드지만 Mac별 자동 생성 debug 인증서가 달라 데이터 보존 설치가 차단됨. 사무실 debug keystore 복사 또는 테스트 앱 초기화 후 재로그인 회귀 필요. 랜딩 대상 ESLint·Next production build 55/55·루트 생성 HTML의 제거/대체 문구 검증 통과 |
| 2026-07-23 | `PAR-001`, `PAR-002`, `WEB-006`~`WEB-012` | 제품 플랫폼 정책 전환 | PC Web·Mobile Web·Android 3플랫폼 기능 파리티를 종료하고 정식 제품 플랫폼을 Android와 Apple 두 가지로 재정의. Android를 최우선으로 마감한 뒤 Apple 네이티브 구현을 진행하며, Web은 마케팅·랜딩·법적 문서·인증/초대 callback·앱 미설치/구버전 fallback·공통 API/Cron·백오피스만 유지 | `PAR-001`과 Web 제품 기능 후속을 정책 종료 처리하고 `PAR-002` 네이티브 2플랫폼 싱크 보드 및 `WEB-012` 지원 표면 경계를 추가. 다음 구현은 `FAM-013`부터 Android 잔여 회귀 순서로 진행 |
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
