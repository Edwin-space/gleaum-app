# 23. 외장 저장장치 작업 체크포인트

> 작성일: 2026-07-14
>
> 목적: 외장 저장장치 작업 폴더를 다른 Mac/AI에서 열어도 커밋·미커밋·외부 비밀 자산을 구분해 재개하기 위한 복구 체크포인트.

> 최신 이동 결과: 2026-07-23 맥북 작업을 GitHub 브랜치로 보존한 뒤 맥미니 `/Volumes/WD_BLACK/Ai Works/gleaum/`에 동기화했다. 로컬·원격 HEAD, Node 의존성, Web/backoffice/Android 빌드를 확인했다.

## 1. 현재 기준점

| 항목 | 값 |
|---|---|
| 저장소 | `https://github.com/Edwin-space/gleaum-app` |
| 브랜치 | `codex/platform-parity-sync-20260723` |
| Git 기준점 | `42b53b0` 플랫폼 파리티·공간 수명주기 → `564b923` Google Play 등록정보 애셋 |
| 현재 작업 경로 | `/Volumes/WD_BLACK/Ai Works/gleaum` |
| Android 버전 | `versionCode 26`, `versionName 1.1.5` |
| Android 패키지 | `com.gleaum.app` |
| 웹 운영 주소 | `https://www.gleaum.com` |
| 공식 관리자 | `https://admins.gleaum.com` |
| 마지막 Android 검증 | 2026-07-23 맥미니: debug compile·unit test·lint·assemble 738 tasks 통과. 최종 서명과 인증 이후 실기기 흐름은 미완료 |
| 마지막 단말 | `SM_F731N`, ADB serial `R3CW803L3WH` |

**중요:** 운영 보안, 가족/자녀 Web/API/DB, Android Material 3·캘린더/테마, 플랫폼 파리티, 공간 수명주기와 공개 스토어 애셋은 모두 브랜치에 커밋됐다. Git clone으로 소스는 복원되지만 `.env.local`, Android release keystore·비밀번호, 콘솔 설정과 로컬 stash는 복원되지 않는다.

`android/.idea/deploymentTargetSelector.xml`은 Android Studio의 최근 실행 대상 로컬 상태이며 제품 코드가 아니다. 복사에는 포함해도 되지만 향후 커밋에는 제외하는 것이 기본이다. 정확한 파일 수는 계속 바뀌므로 `git status -sb`를 직접 확인한다.

## 2. 현재 작업 트리 범위

### Android

- Compose Material 3 핵심 화면 gate 활성: 홈, 일정 목록/상세/폼, 가계부 목록/폼, 공간, 전체 메뉴, 알림, 온보딩.
- `GleaumTheme`의 light/dark ColorScheme, Typography, Shapes 명시.
- 공통 UI 추가: `GleaumAdaptiveContent`, `GleaumFeedbackBanner`, `GleaumStateCard`, `GleaumStatusBadge`, `GleaumLabelBadge`, `GleaumSemanticColors`.
- 공통 `GleaumScaffold`가 Material 3 Adaptive Navigation Suite를 사용한다.
- 임의 그라데이션, 상태를 동작 칩처럼 표시하던 UI, 화면별 중복 하단 메뉴를 정리했다.
- API 24 호환 ISO 날짜 파서 `NativeDateTime.kt` 추가.
- 기기 캘린더 자동 반영·외부 일정 가져오기 관련 코드가 작업 트리에 포함된다.
- Android debug APK는 빌드·설치까지 통과했지만 마지막 단말이 잠겨 있어 최종 화면 QA는 미완료다.

### Web/API/Supabase

- 웹 공간의 `소식 / 일정 / 멤버`, 네이티브 공간 활성화·소식 API, session context, 가족 보호자/자녀 초대 흐름은 `ff43799`에 커밋됐다.
- 가족/자녀 migration `020`, `021`, `022`는 운영 적용과 RLS·권한·RPC 재검증을 완료했다.
- 하우스 광고 URL 검증과 Kakao 다중 슬롯 간섭 제거는 `a60d187`에 커밋됐다.
- 캘린더 설정·테마 Web 브리지와 Android 네이티브 구현은 `da2384e` 이후 커밋에 보존됐다.

### 문서

- 제품/DB/완료/미완료/인수인계/Android QA/가족 자녀/Material 3 감사 문서가 변경 또는 신규 상태다.
- Android 코드 감사 임시 평균은 90.8/A이며 로그인/가입은 86/B다.
- 실기기 최종 등급은 아직 확정하지 않았다.

## 3. 복사 방식

### 방식 A — 현재 폴더를 그대로 미러링

개발 환경 캐시와 숨김 파일까지 동일하게 보존해야 할 때 사용한다. `<USB_NAME>`을 실제 외장 저장장치 이름으로 바꾼다.

```bash
mkdir -p "/Volumes/<USB_NAME>/gleaum"
rsync -a --progress --stats --extended-attributes \
  "/Volumes/WD_BLACK/Ai Works/gleaum/" \
  "/Volumes/<USB_NAME>/gleaum/"
```

- `.git`, `.env.local`, `backoffice/.env.local`, untracked 파일까지 복사된다.
- `node_modules`, `.next`, `out`, Android build cache도 포함되어 용량과 시간이 크게 증가한다.
- 외장 저장장치 분실 시 환경변수가 노출될 수 있으므로 암호화된 저장장치를 권장한다.

### 방식 B — 권장 portable source 복사

소스와 현재 미커밋 작업은 모두 보존하고 다시 생성 가능한 캐시만 제외한다.

```bash
mkdir -p "/Volumes/<USB_NAME>/gleaum"
rsync -a --progress --stats --extended-attributes \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'out/' \
  --exclude 'backoffice/node_modules/' \
  --exclude 'backoffice/.next/' \
  --exclude 'android/.gradle/' \
  --exclude 'android/build/' \
  --exclude 'android/app/build/' \
  --exclude 'ios/App/Pods/' \
  "/Volumes/WD_BLACK/Ai Works/gleaum/" \
  "/Volumes/<USB_NAME>/gleaum/"
```

이 방식도 `.git`, `.env.local`, untracked 파일은 복사한다. 대상 경로에 기존 프로젝트가 있다면 먼저 별도 백업하고, 검증 전 `--delete` 옵션은 사용하지 않는다.

## 4. 저장소 밖에서 별도로 옮겨야 하는 항목

| 항목 | 현재 기본 위치/관리처 | 필요 시 조치 |
|---|---|---|
| Android release keystore | `~/gleaum-release.keystore` | 암호화하여 별도 복사. 저장소 폴더 복사에 포함되지 않음 |
| Keystore 비밀번호 | `ANDROID_KEYSTORE_PASSWORD` 등 환경변수 | 비밀번호 관리자 또는 안전한 별도 채널 사용 |
| Apple signing certificate/profile | macOS Keychain / Apple Developer | 새 Mac에서 인증서·프로파일 재설정 |
| Vercel 환경변수 | Vercel 프로젝트 | `.env.local`과 운영값이 동일하다고 가정하지 말고 Vercel에서 확인 |
| Supabase 운영 DB/설정 | Supabase 원격 프로젝트 | 로컬 SQL 파일 복사는 운영 적용 상태를 복제하지 않음 |
| Firebase/APNs 설정 | Firebase·Apple 콘솔 | 콘솔 권한과 인증키 별도 확인 |
| Android SDK/JDK/Gradle cache | 로컬 개발 환경 | Android Studio JBR 21 및 SDK를 새 장비에 설치 |

`android/app/google-services.json`, 루트 `.env.local`, `backoffice/.env.local`은 현재 프로젝트 폴더 안에 존재한다. 외부 공유용 USB라면 평문 보관하지 않는다.

## 5. 복사 직후 검증

새 위치에서 다음 순서로 확인한다.

```bash
cd "/Volumes/<USB_NAME>/gleaum"
git status -sb
git log --oneline -5
```

- 브랜치가 `codex/platform-parity-sync-20260723`, HEAD가 최소 `564b923`인지 확인한다.
- 원본과 동일한 modified/untracked 목록이 보이는지 확인한다.
- 원본 폴더에서 복사 후 변경을 추가했다면 다시 `rsync`해야 한다.

캐시를 제외해 복사했다면 의존성을 복원한다.

```bash
npm ci
npm --prefix backoffice ci
```

검증 명령:

```bash
npm run build
npm --prefix backoffice run build
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' \
  android/gradlew -p android :app:assembleDebug :app:lintDebug
```

## 6. 외부 작업 재개 순서

1. `git log --oneline -5`, `git status -sb`와 `docs/24-project-work-tracker.md`의 실행 큐를 확인한다.
2. 루트 `AGENTS.md`를 읽고 UI 작업이면 `DESIGN.md`, `design-system-ui.html`도 확인한다.
3. `docs/10-ai-handoff-guide.md`, `docs/12-product-model.md`, 이 문서를 읽는다.
4. `git diff --stat`와 untracked 파일을 확인한다.
5. Android 작업은 사용자가 재개를 지시한 뒤 `docs/20-android-native-release-qa.md`, `docs/22-android-material3-ui-audit.md`의 미완료 실기기 QA부터 시작한다.
6. 가족/자녀 작업은 `docs/21-family-child-account-foundation.md`와 migration `020`~`022`를 기준으로 한다.
7. Supabase SQL은 파일 경로를 SQL Editor에 입력하지 말고 파일 **내용 전체**를 붙여넣어 실행한다. 이미 적용 완료로 기록된 migration은 중복 실행 전 반드시 운영 상태를 확인한다.
8. 작업 시작·완료·차단 상태는 `docs/24-project-work-tracker.md`에 먼저 기록한다. 상세 이동 상태가 바뀌면 이 체크포인트도 갱신하고, 기능·아키텍처가 바뀐 경우에만 관련 상세 문서를 함께 갱신한다.

## 7. 즉시 이어갈 체크리스트

> Android 검증은 2026-07-16 재개했다. 아래 항목 중 빌드·서명 전 release 패키징·로그인 진입은 완료했고, 인증 세션 또는 서명 비밀번호가 필요한 항목은 차단 상태로 관리한다.

- [ ] 잠금 해제한 Android 단말에서 최신 debug APK 실행.
- [ ] 홈·일정·가계부·공간·전체·알림·온보딩 light/dark/system 캡처.
- [ ] 상태바·시스템 navigation bar와 앱 테마 동기화 확인.
- [ ] 폰 세로/가로와 태블릿·폴더블에서 NavigationBar/NavigationRail 확인.
- [ ] 큰 글꼴 1.3배와 TalkBack 확인.
- [ ] Google/이메일 로그인과 로그아웃 회귀 확인.
- [ ] 일정·가계부 CRUD, 공간 전환·소식·멤버, 푸시 딥링크 확인.
- [ ] AdFit 닫기/오늘 그만 보기/실패 시 홈 레이아웃 확인. (2026-07-23 실기기 요청·로드·SDK 팝업 렌더링·무크래시 확인 완료)
- [ ] 로그인/가입 화면을 Compose Material 3로 전환할지 최종 결정.
- [ ] 검증 결과로 `docs/22-android-material3-ui-audit.md`의 대기 항목과 최종 점수 갱신.

## 8. 복사 완료 판정

다음 조건을 모두 만족해야 원본 장치를 분리해도 된다.

- [x] 2026-07-16 외장 저장장치의 `git status -sb`가 원본과 동일함을 확인했다.
- [x] 2026-07-16 `.git` 디렉터리와 untracked 신규 파일 존재를 확인했다.
- [x] 2026-07-16 `.env.local` 등 필요한 환경 파일의 존재 여부를 확인했다(값은 문서에 기록하지 않음).
- [ ] release 빌드가 필요하면 keystore와 비밀번호를 별도로 확보했다.
- [x] 2026-07-16 새 위치에서 `npm run build`를 통과시켰다.
- [ ] 원본 폴더는 외장 복사 검증 전 삭제하지 않았다.
