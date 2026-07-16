# 24. 프로젝트 통합 작업 트래커

> **단일 기준 문서(SSOT)**: 현재 무엇을 해야 하는지, 무엇이 진행 중인지, 무엇이 언제 어떤 근거로 완료됐는지는 이 문서를 기준으로 판단한다.
>
> 최초 작성: 2026-07-16
> 최종 업데이트: 2026-07-16
> 현재 Git 기준점: `a60d187` (`main`) + Android·캘린더/테마 브리지·문서 미커밋 작업 트리

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

위에서부터 순서대로 처리한다. P0 운영 보안이 끝나기 전에는 기능 개발을 먼저 배포하지 않는다.

| 순서 | ID | 작업 | 상태 | 다음 행동 |
|---:|---|---|---|---|
| 1 | `OPS-001` | 백오피스 운영 관리자 환경변수 확인 | `✅ 완료` | 2026-07-16 필수 변수 범위 확인 및 공개 legacy 변수 제거 |
| 2 | `OPS-002` | 노출된 운영 CRON 키 원자적 회전 | `✅ 완료` | 2026-07-16 Vercel 교체·메인 앱 재배포·Vault 전환·운영 200 검증 |
| 3 | `DB-001` | 가족·자녀 Data API 최소 권한 운영 적용 | `✅ 완료` | 2026-07-16 migration·grants·RLS 검증 |
| 4 | `SEC-005` | Supabase 함수 권한·실행 환경 하드닝 | `✅ 완료` | 2026-07-16 migration 적용·Advisor 제거 확인 |
| 5 | `SEC-006` | 공개 광고 이미지 버킷 목록 노출 차단 | `✅ 완료` | 2026-07-16 broad SELECT 제거·public URL 200 확인 |
| 6 | `SEC-007` | 광고 이벤트 무제한 Data API INSERT 차단 | `✅ 완료` | 2026-07-16 API 선배포·DB 직접 INSERT 차단·Advisor 확인 |
| 7 | `AUTH-001` | Supabase 유출 비밀번호 차단 활성화 | `🔴 차단` | Pro 이상 확인 및 Dashboard Auth 설정 권한 필요 |
| 8 | `OPS-003` | 백오피스 보안 변경 배포·스모크 테스트 | `🔴 차단` | 배포·미인증 검증 완료, 관리자/비관리자 로그인 세션 필요 |
| 9 | `REPO-001` | 현재 대규모 미커밋 작업 안전한 체크포인트 | `🟠 진행 중` | `8b15af7` 보안/운영, `ff43799` 가족·자녀·공간, `a60d187` 웹 광고 완료. Android 결합 캘린더/테마는 제외 유지, 문서 일관성 정리 |
| 10 | `AND-001` | Android 실기기 핵심·시각 QA | `🔴 차단` | 잠금 해제 단말 확보 후 light/dark/system 및 핵심 회귀 수행 |
| 11 | `AND-002` | Android Release AAB 출시 검증 | `⬜ 대기` | `bundleRelease`, mapping, native symbols, Firebase/AdFit 확인 |
| 12 | `FAM-001` | 가족·자녀 공통 capability 적용 | `⬜ 대기` | `/api/session/context`를 Web/Android/iOS 권한 분기에 연결 |

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
| [ ] | `AUTH-001` | Supabase 유출 비밀번호 차단 활성화 | `🔴 차단` | 2026-07-16 | — | Pro 이상 기능. Dashboard `Authentication → Providers → Email`의 leaked password protection 활성화 권한 또는 Management API PAT 필요. 활성화 뒤 Advisor 재검사 |
| [ ] | `OPS-003` | 백오피스 배포 및 인증 스모크 테스트 | `🔴 차단` | 2026-07-16 | — | 배포 `dpl_EN4cMqPT3ReXG7NduMcRv1vn3S4b` READY·`admins.gleaum.com` 연결. 로그인 200, 미인증 페이지 307→`/login`, API 401 확인. 완료에는 비관리자 403·관리자 페이지/API 2xx 실제 세션 검증 필요. 환경 미설정 503은 코드 fail-closed/build로 확인 |
| [ ] | `SEC-004` | 백오피스 전체 source lint 정상화 | `⬜ 대기` | — | — | `.next` 제외 설정 후 기존 React effect/타입 lint 오류 해결, `npm run lint` 0 error |

## 4. 저장소·배포 프로세스

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `REPO-000` | 프로젝트를 외장 SSD 작업 경로로 이전 | `✅ 완료` | 2026-07-14 | 2026-07-16 | 현재 경로 `/Volumes/Portable SSD/AI/gleaum`, `.git`과 untracked 파일 확인 |
| [x] | `DOC-001` | 프로젝트 통합 작업 트래커 도입 | `✅ 완료` | 2026-07-16 | 2026-07-16 | 전체 도메인 작업에 ID·상태·날짜·완료 기준을 부여하고 `AGENTS.md` 시작/종료 규칙에 연결 |
| [ ] | `REPO-001` | 기존 미커밋 변경 검토·안전한 커밋 분리 | `🟠 진행 중` | 2026-07-16 | — | Android 파일·검증 제외. `8b15af7` 보안/운영, `ff43799` 가족·자녀·공간, `a60d187` 웹 광고 체크포인트 완료. 루트 build·대상 lint·diff check와 운영 DB 권한 재검증 통과. 캘린더/테마 Web 브리지는 제외 중인 Android 구현과 결합되어 함께 보류. 남은 범위는 문서의 Git 기준점·완료 주장 일관성 정리 |
| [ ] | `REPO-002` | 비밀·환경·릴리즈 키 백업 상태 확인 | `⬜ 대기` | — | — | `.env.local`, Android release keystore, 서명 비밀번호의 저장소 외 백업 확인 |
| [ ] | `OPS-004` | 메인 웹 최신 변경 배포·운영 회귀 | `⬜ 대기` | — | — | 루트 build 통과, Vercel 배포 성공, 로그인/홈/공간/가계부 핵심 흐름 확인 |

상세 이동·복구 절차: `docs/23-external-work-checkpoint.md`

## 5. Android

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `AND-000` | 주요 화면 Compose Material 3 기반 전환 | `✅ 완료` | 2026-06-24 | 2026-07-14 | 코드 감사 평균 90.8/A, `assembleDebug`·`lintDebug` 통과 기록 |
| [ ] | `AND-001` | 실기기 시각·핵심 회귀 QA | `🔴 차단` | — | — | 잠금 해제 단말 필요. 로그인, CRUD, 공간, 알림, 생체인증, 캘린더와 light/dark/system 캡처 |
| [ ] | `AND-002` | Release AAB 검증 | `⬜ 대기` | — | — | 서명 AAB, R8 `mapping.txt`, native symbols, Crashlytics/Analytics/FCM, AdFit fallback 확인 |
| [ ] | `AND-003` | 태블릿·폴더블·접근성 QA | `⬜ 대기` | — | — | NavigationRail, 폰 가로, expanded 폭, 글꼴 1.3배, TalkBack 통과 |
| [ ] | `AND-004` | 로그인/가입 Compose 전환 여부 결정 | `⬜ 대기` | — | — | 현 XML 86/B를 Compose 전환하거나 브랜드 예외로 승인하고 결정일 기록 |
| [ ] | `AND-005` | 기기 캘린더 2·3차/가져오기 QA | `🟠 진행 중` | 2026-07-14 | — | 현재 미커밋 자동 동기화 변경 검토 후 export/import/중복/권한 거부 실기기 확인 |
| [ ] | `AND-006` | Play Console 출시 자료·정책 점검 | `⬜ 대기` | — | — | 스토어 정보, 데이터 안전, 콘텐츠 등급, 개인정보 URL, 릴리즈 SHA-1 확인 |

상세 QA: `docs/20-android-native-release-qa.md`, `docs/22-android-material3-ui-audit.md`

## 6. 가족·자녀·공간 권한

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `FAM-000` | 자녀 사전등록·보호자 이메일 확인·초대·승인 기반 | `✅ 완료` | 2026-07-13 | 2026-07-14 | migration 020~022 운영 적용 기록과 Web/API 기반 구현 |
| [ ] | `FAM-001` | 공통 session context capability 적용 | `⬜ 대기` | — | — | Web/Android/iOS 메뉴·광고·가계부·공간 API/UI가 같은 capability를 검증 |
| [ ] | `FAM-002` | 자녀 전용 홈·메뉴 제한 | `⬜ 대기` | — | — | 승인 상태와 연령에 따라 노출/행동/API가 모두 제한됨 |
| [ ] | `FAM-003` | 일정 assignee/observer 모델·RLS | `⬜ 대기` | — | — | 자녀/보호자 역할별 조회·수정 테스트 포함 |
| [ ] | `FAM-004` | 만 14세 재동의·만 19세 전환 | `⬜ 대기` | — | — | UI, 알림, 일괄 Cron, 과거 동의 이력 보존 검증 |
| [ ] | `FAM-005` | 약관·개인정보처리방침 개정 운영 | `⬜ 대기` | — | — | 사전 고지일·시행일·버전 기록과 법률 검토 완료 |
| [ ] | `FAM-006` | 외부 본인확인 전환 | `⏸ 보류` | — | — | 자녀 1,000명/월 500건/분쟁 1건/위치·결제 도입/정책 요구 중 하나 발생 시 재개 |
| [ ] | `FAM-007` | 수동 위치 체크인 MVP | `⏸ 보류` | — | — | 별도 법률 검토·본인확인·위치 동의 완료 후에만 재개 |

상세 기준: `docs/21-family-child-account-foundation.md`

## 7. Web·API·데이터

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [ ] | `WEB-001` | 개인/공유 공간 데이터 경계 자동 회귀 테스트 | `⬜ 대기` | — | — | 개인 일정·지출 비노출, 공간 지출 분리, 멤버 역할을 테스트 데이터로 자동 검증 |
| [ ] | `WEB-002` | 이메일 가입 운영 설정 검증 | `⬜ 대기` | — | — | Custom SMTP, 확인 템플릿, Redirect URL, 만료/재발송 실제 계정 테스트 |
| [ ] | `WEB-003` | 이미지 첨부 실제 업로드 | `⬜ 대기` | — | — | Storage/RLS/용량·확장자 제한/삭제·실패 UX 구현 |
| [ ] | `WEB-004` | 통계·분석 확장 | `⬜ 대기` | — | — | 지표 정의 후 웹/백오피스 소유 경계를 확정하고 구현 |
| [ ] | `WEB-005` | 일정 단건 외부 공유 | `⬜ 대기` | — | — | 만료·취소 가능한 읽기 전용 링크와 개인정보 노출 검토 |
| [ ] | `WEB-006` | 마이페이지 Desktop UI 최적화 | `⬜ 대기` | — | — | Desktop/Mobile 분리와 디자인 시스템·다크모드 검증 |
| [ ] | `PAR-001` | 플랫폼 P0 기능 파리티 회귀 | `⬜ 대기` | — | — | 로그인/세션, 초대, 공간 데이터 경계, 멤버 역할, 가계부 분리를 Web/Android/iOS에서 확인 |

## 8. iOS·Apple 플랫폼

| 체크 | ID | 작업 | 상태 | 시작일 | 완료일 | 완료 기준·근거 / 다음 행동 |
|---|---|---|---|---|---|---|
| [x] | `IOS-000` | iOS 네이티브 셸·홈·일정 등록 1차 기반 | `✅ 완료` | 2026-06-18 | 2026-06-18 | Swift 네이티브 API client, 홈, 일정 Sheet, 라우팅 기반 |
| [ ] | `IOS-001` | 운영 API 배포 후 실제 계정 회귀 | `⬜ 대기` | — | — | 홈 요약·일정 등록·WebView 왕복·세션 유지 검증 |
| [ ] | `IOS-002` | EventKit 캘린더 UX | `⬜ 대기` | — | — | 캘린더 선택·내보내기·가져오기·중복 정책 구현 |
| [ ] | `IOS-003` | APNs·알림 운영 설정 | `🔴 차단` | — | — | 유료 Apple Developer, APNs Auth Key, Firebase, Xcode Capabilities 필요 |
| [ ] | `IOS-004` | Universal Links 재활성화 | `🔴 차단` | — | — | 유료 Apple Developer 전환 후 Associated Domains와 운영 링크 검증 |
| [ ] | `IOS-005` | 가족·자녀 capability 동등화 | `⬜ 대기` | — | — | `FAM-001` 계약 확정 후 iOS 메뉴·홈·API에 적용 |
| [ ] | `IOS-006` | TestFlight/App Store 출시 | `🔴 차단` | — | — | 유료 계정, 스크린샷·메타데이터·정책·실기기 QA 필요 |

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
