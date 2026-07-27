# 15. 네이티브 플랫폼 기능 동등화 매트릭스

> 최종 업데이트: 2026-07-24
>
> 목적: Android App과 Apple App(iPhone/iPad/macOS)의 기능·데이터·권한 의미를 통일하고 Web 유지 범위를 지원 표면으로 제한한다. 작업 상태와 완료 판정의 단일 기준은 `docs/24-project-work-tracker.md`의 `PAR-002`다.

---

## 제품 플랫폼 정책

- 정식 제품 플랫폼은 **Android App**과 **Apple App(iPhone/iPad/macOS)** 두 가지다.
- 구현 우선순위는 **공통 코어 계약 → Android 구현·실기기·출시 마감 → Apple 구현·실기기·출시 마감**이다.
- Android를 기준 동작으로 삼되 Apple 화면은 SwiftUI와 Apple 플랫폼 UX로 구현한다.
- API·DB·RLS·capability·오류 코드는 두 앱이 공유하는 공통 코어 계약이다.
- PC Web과 Mobile Web은 제품 기능 파리티 대상이 아니다. Android/Apple 기능을 Web에 맞추거나 Web 기능을 두 앱에 맞추는 작업을 진행하지 않는다.

## 플랫폼 구분

| 구분 | 역할 | 운영 정책 |
|---|---|---|
| Android App | 최우선 제품 플랫폼 | Compose Material 3, 실기기·Play 출시까지 먼저 마감 |
| Apple App | 두 번째 제품 플랫폼 | Android 공통 계약을 사용해 SwiftUI로 구현. iPhone 5탭, iPad 적응형, native macOS UX |
| Web 지원 표면 | 앱과 운영을 지원하는 시스템 표면 | 마케팅·랜딩·법적 문서·인증/초대 callback·fallback·공통 API·Cron·백오피스만 유지 |

## Web 유지 범위

### 유지

- 루트 마케팅 랜딩, 기능 소개, Google Play/App Store 및 다운로드 안내
- 이용약관, 개인정보처리방침, 계정 삭제 안내
- OAuth·이메일 인증 callback, 비밀번호 재설정
- 일반 공간·자녀 초대 랜딩과 앱 미설치·구버전 fallback
- Android/Apple이 호출하는 Native Bearer API
- 알림·정기 작업 Cron과 서버 검증
- `admins.gleaum.com` 백오피스
- 장애 대응을 위해 네이티브 앱에 미리 정의된 제한적 Web fallback

### 신규 구현하지 않음

- 브라우저용 홈·일정·가계부·공간·알림·마이페이지 기능 추가
- PC Web과 Mobile Web 간 기능·레이아웃 동등화
- Android 또는 Apple 기능을 Web에 후속 구현
- Desktop/Mobile Web 역할별·테마별·키보드/터치 전체 회귀
- Web 전용 생체인증·기기 캘린더 등 네이티브 기능 대체 구현

기존 로그인형 Web 화면은 즉시 삭제하지 않고 유지보수 모드로 둔다. 보안·개인정보·데이터 손실·인증/초대 장애만 수정하며 신규 제품 기능을 추가하지 않는다.

## WebView와 브리지 허용 범위

- 핵심 화면인 홈·일정·공간·가계부·알림·마이페이지·가족/자녀 관리는 Android/Apple 네이티브 화면이 소유한다.
- WebView는 이용약관·개인정보처리방침 원문, 외부 인증 fallback, 앱 미설치·구버전 초대 fallback처럼 명시된 보조 화면에만 허용한다.
- 네이티브 화면은 WebView cookie에 의존하지 않고 Bearer token으로 공통 API를 호출한다.
- 새 Web fallback은 긴급 수정 가능성이 높고 개인정보 노출이 제한적인 비핵심 화면에만 추가한다.
- WebView 사용 여부와 관계없이 권한과 데이터 변경은 API·DB에서 다시 검증한다.

## Android → Apple 동등화 매트릭스

| 기능 | 공통 코어 계약 | Android | Apple | Web 지원 표면 |
|---|---|---|---|---|
| 로그인·세션 | Supabase access/refresh token, capability, 만료·로그아웃 | Credential Manager 실기기 마감 | 기존 Google browser OAuth·이메일·Sign in with Apple 상태 머신 | callback·재설정·법적 문서 |
| 홈·캐시 | 계정 모드, 개인 원장, 빈/오류, 새로고침 | 선조회·캐시·오프라인 회귀 | SwiftUI 셸 선조회·프로세스 캐시 | 없음 |
| 일정 | 개인/공간 경계, 역할, 참여자, 알림 | 목록·상세·폼·역할별 회귀 | 목록·상세·폼 이식 | 초대/딥링크 fallback만 |
| 공간 | 개인/공유 경계, 역할, 가족 전환, 안전 삭제 | 전환·삭제 실기기 회귀 | 공간 관리 이식 | 관련 Native API |
| 가족·자녀 | 관계/권한 분리, OTP, 동의, claim, 최종 승인 | 보호자·자녀 2계정 회귀 | SwiftUI 보호자·자녀 흐름 | 초대 랜딩·인증 callback·법적 원문 |
| 가계부 | 개인/공간 원장, 반복 항목, 쓰기 권한 | 쓰기·갱신 회귀 | 목록·등록·수정 이식 | 관련 Native API |
| 알림 | 서버 opt-in, 목록, 읽음, 목적지 | FCM 수신/비수신·딥링크 | APNs/FCM·딥링크 | Cron·발송 서버 |
| 캘린더 | 일정 ID·중복·동기화 의미 | Calendar Provider 회귀 | EventKit 구현 | 없음 |
| 생체인증 | 잠금 설정 의미·세션 보호 | BiometricPrompt | LocalAuthentication | 없음 |
| 광고 | 계정 capability·플랫폼 타겟 | AdMob·AdFit | Apple용 광고 구현 시 동일 제한 | 백오피스 캠페인 관리 |

## 변경 영향 체크리스트

- [ ] 공통 API 요청·응답·오류 코드가 변경되는가?
- [ ] DB·RLS·capability·개인/공간 데이터 경계가 변경되는가?
- [ ] Android 구현·실기기·출시 영향은 무엇인가?
- [ ] Android 완료 후 Apple 후속 항목을 등록했는가?
- [ ] Web 지원 표면의 인증·초대·법적 문서·API·Cron·백오피스에 영향이 있는가?
- [ ] Web 사용자 제품 기능을 실수로 신규 구현하거나 완료 조건에 포함하지 않았는가?
- [ ] Android와 Apple의 권한·오류·딥링크 의미가 같은가?

## 구현 순서

1. Android 자녀 계정·가계부·공간 전환/삭제·캘린더·캐시·TalkBack·로그인 실기기 회귀
2. Android 서명 AAB·Google Play 정책·스토어 자료 마감
3. Apple shared Swift Package·Liquid Glass 디자인 시스템
4. Apple 인증·세션 상태 머신
5. iPhone 5탭 앱 셸·라우터·선조회
6. 일정·공간·가계부·알림·전체 메뉴·가족/자녀 이식
7. EventKit·생체인증과 iPhone simulator 로컬 QA
8. iPad sidebar/list-detail·Stage Manager 적응형 UX와 simulator QA
9. native macOS window·sidebar·menu·keyboard UX와 로컬 Mac QA
10. 유료 Apple Developer Program 획득
11. Apple 로그인·APNs·Universal Links·실기기·TestFlight·macOS 공증·App Store 출시

## 작업 시 주의

- Web 서버를 중단하는 정책이 아니다. 앱과 운영에 필요한 공통 API·인증·링크·문서·백오피스는 계속 운영한다.
- 기존 Web 사용자 화면을 제거하려면 사용 현황·데이터 내보내기·공지·리다이렉트 정책을 별도 승인받아야 한다.
- API·DB 변경은 Android 한 화면에 맞춘 임시 계약으로 만들지 않는다.
- Apple은 Android UI를 복제하지 않고 같은 기능 의미만 유지한다.
- iPad는 iPhone 화면을 확대하지 않고 창 폭에 따라 sidebar·list-detail·다열 배치를 사용한다.
- macOS는 `Designed for iPad`가 아닌 native SwiftUI 앱으로 제공한다.
- 유료 Apple 계정은 라이선스 비의존 구현과 로컬 검증을 모두 마친 뒤 획득한다.
- Native-only 기능을 마케팅 Web에서 사용할 수 있는 기능처럼 안내하지 않는다.
