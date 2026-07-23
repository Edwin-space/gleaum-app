# 26. 앱 빠른 업데이트 전달 전략

> 검토일: 2026-07-16
> 대상: Android 우선, Android 안정화 후 동일 원칙으로 iOS 적용

## 결론

글리움에는 일반적인 CodePush형 OTA를 주 업데이트 수단으로 추가하지 않는다.

현재 앱은 `capacitor.config.ts`의 `server.url=https://www.gleaum.com`으로 운영 Web을 직접 불러오므로 Web UI와 API는 Vercel 배포 즉시 앱에 반영된다. 반면 현재 홈·일정·공간·가계부·메뉴의 주요 화면은 Kotlin/Compose 네이티브 코드다. HTML/CSS/JavaScript 번들만 교체하는 OTA는 이 네이티브 화면을 수정할 수 없다.

따라서 업데이트 경로를 다음 세 종류로 명확히 분리한다.

| 변경 종류 | 전달 경로 | 마켓 심사 |
|---|---|---|
| API, 서버 검증, Web 화면 | Vercel 원자적 배포·승격 | 불필요 |
| 노출 여부, 점진 배포율, 안내 문구, 긴급 차단 | Firebase Remote Config 기반 사전 구현된 설정 | 불필요 |
| Kotlin/Compose, 네이티브 플러그인, 권한, SDK, Manifest | Google Play 새 AAB | 필요 |

## 현재 구조에서 OTA가 해결하지 못하는 것

- `NativeSpaceActivity.kt`, `ComposeSpaceScreen.kt` 같은 Kotlin/Compose 수정
- Android 리소스, Manifest, 권한, 딥링크, Firebase/AdMob SDK 변경
- 새 Capacitor 플러그인 또는 네이티브 브리지 추가
- 네이티브 로그인·세션 라우팅 수정

공간 삭제 UI처럼 네이티브 화면에서 발생한 오류는 OTA JavaScript 번들로 고칠 수 없다.

## 권장 구현

### 1. 네이티브 기능 레지스트리

이미 포함된 Firebase Remote Config를 이용해 앱에 다음 계약을 사전 구현한다.

- `enabled`: 기능 노출·진입 차단
- `rolloutPercent`: 기기 단위 점진 배포
- `minNativeVersion`: 필요한 최소 네이티브 버전
- `maintenanceMessage`: 장애 시 사용자 안내
- `forceWebFallback`: 미리 구현된 Web 대체 화면으로 전환 가능한 기능만 사용

Remote Config는 권한 판정 수단으로 사용하지 않는다. 모든 권한과 데이터 변경은 현재처럼 API와 DB에서 다시 검증한다.

### 2. 서버 우선 수정 가능 영역 확대

- 업무 규칙, 검증, 제한값, 오류 코드는 API가 소유한다.
- 자주 바뀌는 안내 문구와 단순 콘텐츠는 서버/Remote Config가 소유한다.
- 안정성과 네이티브 UX가 중요한 핵심 화면은 Compose로 유지한다.
- 긴급 수정 빈도가 높은 비핵심 화면만 사전에 Web fallback 경로를 둔다.

### 3. 네이티브 업데이트 도달 시간 단축

- Play 내부/비공개 테스트 → 단계적 Production 출시 자동화
- Play In-App Updates로 승인된 새 버전의 즉시/유연 업데이트 안내
- Crashlytics 지표와 Remote Config kill switch로 문제 버전의 기능 즉시 차단
- 네이티브 API 계약에 `minSupportedVersion`을 두어 호환되지 않는 기능을 안전하게 제한

## OTA 플러그인 판단

Capacitor 8 호환 Live Update 플러그인은 존재하지만 Web 자산만 교체한다. 현재 `server.url` 방식에서는 동일 역할을 Vercel이 이미 수행하므로 플러그인을 추가하면 중복된 배포 경로·롤백 상태·서명 키만 늘어난다.

향후 오프라인 우선 번들 방식으로 전환할 경우에만 다음 조건으로 재검토한다.

- 네이티브 버전별 채널 분리
- RSA 서명 검증
- 점진 배포와 자동 롤백
- 마지막 정상 번들 보존
- 네이티브 호환 버전 강제
- iOS 심사 범위를 크게 바꾸지 않는 Web 자산 수정만 허용

Microsoft App Center는 2025-03-31 종료됐으므로 과거 App Center CodePush를 신규 기반으로 선택하지 않는다.

## 스토어 정책 경계

- Google Play는 Play 외부에서 DEX/JAR/SO 같은 실행 코드를 내려받아 앱을 자체 업데이트하는 방식을 금지한다. WebView의 해석형 JavaScript 예외가 있지만 정책 위반 기능을 제공하면 안 된다.
- Apple App Review Guideline 2.5.2는 심사된 앱의 기능을 도입하거나 변경하는 코드를 내려받아 실행하는 것을 제한한다.

따라서 OTA를 마켓 심사 우회 수단으로 설계하지 않는다. 글리움의 현실적인 빠른 배포 수단은 **운영 Web/API 즉시 배포 + 사전 탑재 Remote Config 제어 + 네이티브 마켓 업데이트**의 조합이다.

## 참고

- Google Play Device and Network Abuse: https://support.google.com/googleplay/android-developer/answer/16559646
- Apple App Review Guidelines 2.5.2: https://developer.apple.com/app-store/review/guidelines/
- Capawesome Capacitor Live Update: https://capawesome.io/docs/plugins/live-update/
- Microsoft App Center retirement: https://learn.microsoft.com/en-us/appcenter/retirement
