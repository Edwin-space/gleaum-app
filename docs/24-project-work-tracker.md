# 24. 프로젝트 통합 작업 트래커

> **단일 기준 문서(SSOT)**: 현재 무엇을 해야 하는지, 무엇이 진행 중인지, 무엇이 언제 어떤 근거로 완료됐는지는 이 문서를 기준으로 판단한다.
>
> 최초 작성: 2026-07-16
> 최종 업데이트: 2026-07-23
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

위에서부터 순서대로 처리한다. 2026-07-23 사용자 결정으로 **Android 기능·성능·실기기 마감이 최우선**이다. Android 작업 중 공통 API 계약이나 Web·iOS 후속 영향은 즉시 기록하되 해당 플랫폼 구현은 Android 완료 뒤 진행한다. Google Play 등록정보 카피·공개 애셋 제작은 별도로 진행할 수 있다.

| 순서 | ID | 작업 | 상태 | 다음 행동 |
|---:|---|---|---|---|
| 1 | `FAM-011` | 보호자 이메일 OTP·동의 정합화 | `🟠 운영 설정 대기` | 운영 DB migration·Production 배포 완료. Supabase Auth 제목·HTML 템플릿 반영 후 실메일→코드→동의 회귀 |
| 2 | `FAM-008` | Android 가족 공간 전환 오류 수정 | `🟠 실기기 검증 대기` | 운영 API 404 원인 수정·Production 배포 완료. 로그인 공간 지기 계정으로 일반→가족 전환·개인 공간 차단 최종 확인 |
| 3 | `AND-010` | 앱 시작 선조회·화면 캐시·수동 새로고침 | `🟠 실기기 검증 중` | 콜드 시작·핵심 메뉴 왕복 통과. pull-to-refresh와 mutation 후 선택 갱신 체감 검증 |
| 4 | `AND-001` | Android 실기기 시각·핵심 회귀 | `🟠 진행 중` | 로그인 홈·핵심 메뉴 왕복·캘린더 화면 통과. 일정/가계부 쓰기와 가족 전환은 안전한 테스트 데이터로 확인 |
| 5 | `AND-005` | Android 기기 캘린더 회귀 | `🟠 진행 중` | 권한·캘린더 선택·네이티브 후보 3개 조회 통과. 격리 일정 실제 가져오기·중복·자동 CRUD 확인 |
| 6 | `AND-003` | Android TalkBack·적응형 최종 QA | `🟠 진행 중` | 폴더블 하단 인셋·UI 의미 확인. 실제 TalkBack 음성 순서 수동 QA |
| 7 | `AND-002` | Android Release AAB 검증 | `⏸ 보류` | Android 기능·실기기 마감 후 서명 AAB 검증 |
| 8 | `OPS-004` | 최신 공통 API Production 반영 | `⏸ 보류` | Android 수정에 필요한 공통 API가 확정되면 Preview → Production 배포·회귀 |
| 9 | `PAR-001` | PC Web·Mobile Web 후속 파리티 | `⏸ 보류` | Android 완료 후 기록된 플랫폼 후속 목록 순서대로 반영 |

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

- PC/Mobile Web: Android 기능 마감 뒤 `PAR-001`, `WEB-006`~`WEB-010`을 재개한다.
- Google Play 출시 절차: `AND-006`의 등록정보 제작은 진행 중이지만 Console 제출·정책·서명 확인과 `AND-002` 최종 AAB는 기능 안정화 뒤 재개한다.
- iOS: `IOS-001`~`IOS-006`은 Android/Web 기능과 정책이 확정된 뒤 Android 동작을 기준으로 재구현한다.
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
| [ ] | `SEC-009` | Next/Sharp 신규 보안 권고 대응 | `🟠 상위 패치 대기` | 2026-07-23 | — | Next·eslint-config-next `16.2.11`로 자체 high 권고 4건 제거. Next가 요구하는 `sharp ^0.34.5`의 신규 libvips high 권고 1건은 호환성 검증 없는 `0.35.0` 강제 override를 금지하고 공식 Next 패치가 나오면 즉시 갱신. 현재 `npm audit --omit=dev`는 Next 경유 표시 포함 high 2건 |
| [ ] | `AUTH-001` | Supabase 유출 비밀번호 차단 활성화 | `🔴 차단` | 2026-07-16 | — | Pro 이상 기능. Dashboard `Authentication → Providers → Email`의 leaked password protection 활성화 권한 또는 Management API PAT 필요. 활성화 뒤 Advisor 재검사 |
| [ ] | `OPS-003` | 백오피스 배포 및 인증 스모크 테스트 | `🔴 차단` | 2026-07-16 | — | 배포 `dpl_EN4cMqPT3ReXG7NduMcRv1vn3S4b` READY·`admins.gleaum.com` 연결. 로그인 200, 미인증 페이지 307→`/login`, API 401 확인. 완료에는 비관리자 403·관리자 페이지/API 2xx 실제 세션 검증 필요. 환경 미설정 503은 코드 fail-closed/build로 확인 |
| [ ] | `SEC-004` | 백오피스 전체 source lint 정상화 | `⬜ 대기` | — | — | `.next` 제외 설정 후 기존 React effect/타입 lint 오류 해결, `npm run lint` 0 error |

## 4. 저장소·배포 프로세스

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `REPO-000` | 프로젝트를 외장 SSD 작업 경로로 이전 | `✅ 완료` | 2026-07-14 | 2026-07-16 | 외부 작업 이동·복구 절차 검증 완료. 현재 기준 작업 경로는 `/Volumes/WD_BLACK/Ai Works/gleaum` |
| [x] | `DOC-001` | 프로젝트 통합 작업 트래커 도입 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 전체 도메인 작업에 ID·상태·날짜·완료 기준을 부여하고 `AGENTS.md` 시작/종료 규칙에 연결 |
| [x] | `REPO-001` | 기존 미커밋 변경 검토·안전한 커밋 분리 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 비Android 7개 체크포인트 후 Android·캘린더/테마·문서를 `da2384e`로 보존. Android debug/test/lint/release package, 웹 lint/build, 실기기 로그인 검증 근거 포함 |
| [ ] | `REPO-002` | 비밀·환경·릴리즈 키 백업 상태 확인 | `⬜ 대기` | — | — | `.env.local`, Android release keystore, 서명 비밀번호의 저장소 외 백업 확인 |
| [x] | `REPO-003` | 맥북 최신 작업을 맥미니 작업공간에 동기화 | `✅ 완료` | 2026-07-23 | 2026-07-23 | `codex/platform-parity-sync-20260723` 로컬·원격 `564b923` 일치, lockfile 기준 의존성 복원. root 테스트 9/9·4/4·2/2와 production build 54/54, backoffice build, Android debug compile/unit/lint/assemble 통과 |
| [ ] | `OPS-004` | 메인 웹 최신 변경 배포·운영 회귀 | `🟠 진행 중` | 2026-07-16 | — | 기존 Production은 `084676b` 계열까지 검증. 최신 기능 기준 `42b53b0`은 GitHub 브랜치와 로컬 build까지 완료됐으나 Production 반영 전. Preview → Production 승격 후 공간·가계부 쓰기와 알림 설정 회귀 필요 |
| [x] | `ARCH-001` | CodePush형 빠른 업데이트 전달 구조 검토 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 현재 `server.url`로 Web/API는 이미 즉시 반영되며 Compose는 OTA 대상이 아님을 확인. `docs/26-live-update-delivery-strategy.md`에 Remote Config·Web fallback·Play 업데이트 3단계 전략과 정책 경계 기록 |

상세 이동·복구 절차: `docs/23-external-work-checkpoint.md`

## 5. Android

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `AND-000` | 주요 화면 Compose Material 3 기반 전환 | `✅ 완료` | 2026-06-24 | 2026-07-14 | 코드 감사 평균 90.8/A, `assembleDebug`·`lintDebug` 통과 기록 |
| [ ] | `AND-001` | 실기기 시각·핵심 회귀 QA | `🟠 진행 중` | 2026-07-16 | — | `SM_F731N` 로그인 홈과 홈/일정/공간/가계부/전체 메뉴 왕복, 네이티브 캘린더 후보 조회 통과. 실제 일정/가계부 쓰기·가족 전환·삭제는 안전한 테스트 데이터에서 최종 확인 |
| [ ] | `AND-002` | Release AAB 검증 | `⏸ 보류` | 2026-07-16 | — | 사용자 결정으로 Google Play 출시 구간 후순위. 기능 production build와 핵심 회귀가 끝난 뒤 서명 비밀번호를 확보해 최종 AAB 검증 |
| [ ] | `AND-003` | 태블릿·폴더블·접근성 QA | `🟠 진행 중` | 2026-07-16 | — | compact·글꼴 1.3배·다크·expanded NavigationRail/840dp 폭·UI 의미/터치 영역 통과. `SM_F731N` 캘린더 목록 말줄임·단일 선택 역할·하단 시스템 인셋 통과, 실제 TalkBack 음성 탐색 필요 |
| [x] | `AND-004` | 로그인/가입 Compose 전환 여부 결정 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 브랜드 고정 다크 XML 예외 승인. 1080×2640·글꼴 1.3배에서 잘림/겹침 없음. 기능·정보 구조 대폭 변경 시 Compose 재평가 |
| [ ] | `AND-005` | 기기 캘린더 2·3차/가져오기 QA | `🟠 진행 중` | 2026-07-14 | — | WebView 가져오기 경로를 Compose 네이티브 Activity로 교체. `SM_F731N` 권한·캘린더 선택·후보 3개 조회·선택 UI 통과. 격리 일정으로 실제 가져오기→재조회 중복, 자동 생성·수정·삭제 확인 필요 |
| [ ] | `AND-006` | Play Console 출시 자료·정책 점검 | `🟠 진행 중` | 2026-07-16 | — | Android 1.1.5 기준 한국어 등록정보 카피와 익명화된 휴대전화 스크린샷 6장 준비 완료. `docs/25-google-play-release-readiness.md` 기준 1024×500 기능 그래픽 제작, Console 업로드·최신 versionCode·IARC·App access·서명 확인 필요 |
| [x] | `AND-007` | Android 백업·컴포넌트·R8·캘린더 변경 경계 하드닝 | `✅ 완료` | 2026-07-16 | 2026-07-16 | `allowBackup=false`, preview Activity 비공개, 광범위 ProGuard keep 제거, 캘린더 표식/대상 검증. debug/test/lint/release package 재통과 |
| [x] | `AND-008` | Android 권한·개인정보·Data safety 정합성 보완 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 미사용 CAMERA/feature 제거, 캘린더·Firebase·AdMob/AdFit 개인정보처리방침 반영, Play 입력 초안 문서화. release package manifest의 카메라·미디어·외부 저장소 권한 0건·Android debug/test/lint·웹 lint/build 통과 |
| [ ] | `AND-009` | Remote Config 긴급 차단·필수 업데이트 기반 | `⏸ 보류` | — | — | 사용자 결정으로 3플랫폼 핵심 기능 파리티 이후 재개. 주요 기능 차단·필수 업데이트·API 버전 계약 범위 유지 |
| [ ] | `AND-010` | 앱 시작 선조회·공유 캐시·새로고침 정책 | `🟠 실기기 검증 중` | 2026-07-23 | — | 스플래시 병렬 선조회 후 `SM_F731N` 홈 즉시 데이터 표시, 핵심 메뉴 왕복과 크래시/ANR 0건 확인. pull-to-refresh·mutation 선택 무효화·오프라인/부분 실패 체감 검증 후 완료 |

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
| [ ] | `FAM-011` | 보호자 이메일 OTP·필수 동의 정합화 | `🟠 운영 설정 대기` | 2026-07-23 | — | 6자리 OTP UI/API, 확인 증적 DB 강제, `email_otp` 이력과 migration 운영 적용, Production `dpl_Gc7Dmx7ahfUVTw7qvnEY7GYEzLfr` 완료. Supabase Auth 제목·HTML 적용 후 실메일 회귀 필요 |

상세 기준: `docs/21-family-child-account-foundation.md`

## 7. Web·API·데이터

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [ ] | `WEB-001` | 개인/공유 공간 데이터 경계 자동 회귀 테스트 | `🔴 차단` | 2026-07-16 | — | `3867550`: Node/tsx 접근 매트릭스 8개 통과. 개인 일정·개인 원장 비노출, 공간 데이터 멤버십, admin/editor 쓰기, 개인 일정의 공유 공간 폴백 차단을 운영 코드와 함께 검증. 2차는 Docker CLI만 있고 daemon·Supabase CLI·`config.toml`이 없어 차단. Docker Desktop 실행 후 로컬 Supabase 구성·RLS 역할별 CRUD 테스트 추가 필요 |
| [ ] | `WEB-002` | 이메일 가입 운영 설정 검증 | `⬜ 대기` | — | — | Custom SMTP, 확인 템플릿, Redirect URL, 만료/재발송 실제 계정 테스트 |
| [ ] | `WEB-003` | 이미지 첨부 실제 업로드 | `⬜ 대기` | — | — | Storage/RLS/용량·확장자 제한/삭제·실패 UX 구현 |
| [ ] | `WEB-004` | 통계·분석 확장 | `⬜ 대기` | — | — | 지표 정의 후 웹/백오피스 소유 경계를 확정하고 구현 |
| [ ] | `WEB-005` | 일정 단건 외부 공유 | `⬜ 대기` | — | — | 만료·취소 가능한 읽기 전용 링크와 개인정보 노출 검토 |
| [ ] | `WEB-006` | 마이페이지 Desktop/Mobile 기능 일치 | `🟠 진행 중` | 2026-07-16 | — | Android 전체 메뉴를 기준으로 빠른 동작·알림 목록/설정·프로필·계정·약관을 양쪽 Web 레이아웃에서 제공하고 권한별 가계부 노출·다크모드 회귀 검증 |
| [ ] | `WEB-007` | Remote Config 운영 안전장치·버전 gate | `⏸ 보류` | — | — | 사용자 결정으로 플랫폼 기능 파리티 이후 재개. 현재 `initRemoteConfig()`와 백오피스 편집기는 존재하지만 실제 소비처가 없음 |
| [ ] | `WEB-008` | Web 설정·준비 중 기능 노출 정합화 | `🟠 진행 중` | 2026-07-16 | — | PC/Mobile Web에서 네이티브 전용 캘린더·생체인증과 보류된 Apple 로그인·포인트/프리미엄 문구를 제거하거나 실제 지원 플랫폼에만 노출하고 죽은 진입점 제거 |
| [ ] | `WEB-009` | 일정 장소·지도 기능 완성 | `🟠 진행 중` | 2026-07-16 | — | PC/Mobile의 가짜 지도 준비 영역을 실제 외부 지도 검색 동작으로 교체. 주소 검색·좌표 저장·내장 지도 범위는 아직 미구현 |
| [ ] | `WEB-010` | 알림 설정 서버 발송 경계 적용 | `🟠 진행 중` | 2026-07-16 | — | 일정 리마인더·재알림·자녀 미완료·결제 초과·주간 소비 요약에서 opt-in을 강제하고 명시적 false 사용자의 FCM/인앱 기록을 차단. 운영 배포 후 실제 수신/비수신 회귀 필요 |
| [ ] | `PAR-001` | PC Web·Mobile Web·Android 3플랫폼 핵심 기능 파리티 회귀 | `🟠 진행 중` | 2026-07-16 | — | 기능별 공통 API·DB·권한 계약 아래 PC Web·Mobile Web·Android 구현과 검증을 각각 관리. 세 플랫폼이 모두 완료되거나 명시적 `N/A` 사유가 있어야 상위 기능을 완료한다. iOS는 현재 완료 조건에서 제외 |

### `PAR-001` 3플랫폼 운영 규칙

- 현재 지원 플랫폼은 `PC Web`, `Mobile Web`, `Android App` 3개로 고정한다.
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
| [ ] | `IOS-001` | 운영 API 배포 후 실제 계정 회귀 | `⏸ 보류` | — | — | Android/Web 기능 안정화 뒤 홈 요약·일정 등록·WebView 왕복·세션 유지 검증 |
| [ ] | `IOS-002` | EventKit 캘린더 UX | `⏸ 보류` | — | — | Android/Web 기능 안정화 뒤 캘린더 선택·내보내기·가져오기·중복 정책 구현 |
| [ ] | `IOS-003` | APNs·알림 운영 설정 | `⏸ 보류` | — | — | iOS 재개 결정과 유료 Apple Developer·APNs Auth Key·Firebase·Xcode Capabilities 확보 후 진행 |
| [ ] | `IOS-004` | Universal Links 재활성화 | `⏸ 보류` | — | — | iOS 재개 결정과 유료 Apple Developer 전환 후 Associated Domains·운영 링크 검증 |
| [ ] | `IOS-005` | 가족·자녀 capability 동등화 | `⏸ 보류` | — | — | Android 관련 기능·실기기·릴리즈·Play Console 검증이 모두 정상 완료된 뒤 확정된 Android 동작을 기준으로 iOS에 재구현 |
| [ ] | `IOS-006` | TestFlight/App Store 출시 | `⏸ 보류` | — | — | iOS 기능 재구현·실기기 QA 완료 뒤 유료 계정·스크린샷·메타데이터·정책을 준비해 진행 |

상세 계획: `docs/16-ios-native-roadmap.md`

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
| 2026-07-23 | `FAM-011`, `OPS-004` | 코드·DB·배포 완료, 운영 설정 대기 | 운영 Supabase가 `{{ .Token }}` OTP와 기본 제목 `Your Magic Link`를 보내는 반면 앱은 Magic Link 콜백만 기대하던 불일치 수정. 자녀 관리 화면에 코드 입력·재발송을 추가하고 OTP 성공 뒤 DB 확인 증적이 있어야 동의가 가능하도록 변경. migration `20260723035907_guardian_email_otp_verification.sql` 운영 적용, Production `dpl_Gc7Dmx7ahfUVTw7qvnEY7GYEzLfr` 배포 | 대상 ESLint·diff check·production build, 신규 함수 anon 불가/authenticated 가능, 운영 화면 307·신규 API 미인증 401 확인. Dashboard Magic Link 템플릿을 `[글리움] 보호자 확인 코드`와 저장소 HTML로 변경하고 실메일 전체 흐름 확인 |
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
