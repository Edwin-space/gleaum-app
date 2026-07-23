# 15. 기능 싱크 매트릭스

> 최종 업데이트: 2026-07-23
>
> 목적: 현재 지원 플랫폼인 PC Web / Mobile Web / Android App 사이의 기능 상태와 노출 정책을 통일한다. 작업 상태·완료 판정의 단일 기준은 `docs/24-project-work-tracker.md`의 `PAR-001` 3플랫폼 싱크 보드다.

---

## 핵심 원칙

글리움의 기능 싱크는 모든 플랫폼이 네이티브 기능까지 100% 동일해야 한다는 뜻이 아니다.

- **공통 기능**은 동일한 정책과 동일한 데이터 경계를 가져야 한다.
- **플랫폼 전용 기능**은 해당 플랫폼에서만 동작해도 되지만, 다른 플랫폼에서는 숨기거나 `앱 전용`, `준비 중`, `지원 예정`으로 명확히 안내해야 한다.
- **개인 데이터와 공간 데이터는 절대 섞이면 안 된다.** 개인 가계부/개인 일정은 개인 공간에만, 공유 공간 데이터는 해당 공유 공간에만 표시한다.
- **PC Web / Mobile Web / Native App은 같은 제품이어야 한다.** UI 형태는 달라도 진입 경로, 권한, 기능 상태, 실패 메시지는 같은 의미를 가져야 한다.
- 기본 구현 순서는 **공통 코어 계약 확정 → Android App → PC Web → Mobile Web → 3플랫폼 통합 회귀**다. Android를 기준 동작으로 삼지만 공통 데이터·권한 계약은 플랫폼에 종속시키지 않는다.

---

## 플랫폼 구분

| 플랫폼 | 의미 | 현재 상태 |
|---|---|---|
| PC Web | 데스크톱 브라우저에서 사용하는 웹 | 현재 지원·운영 중 |
| Mobile Web | 모바일 브라우저에서 사용하는 웹 | 현재 지원·운영 중 |
| Android App | Compose Material 3 + Capacitor bridge/fallback Android 앱 | 현재 지원·Google Play 배포 이력 |

iOS App은 기반 코드는 있지만 현재 지원 플랫폼·파리티 완료 조건에서 제외한다. Android/Web 기능과 정책이 확정된 뒤 별도 `IOS-*` 후순위로 재구현한다.

---

## 공통 기능 매트릭스

| 기능 | PC Web | Mobile Web | Android App | 싱크 기준 |
|---|---|---|---|---|
| Google 로그인 | 지원 | 지원 | 네이티브 지원 | 로그인 후 항상 앱/웹의 원래 세션으로 복귀해야 함 |
| 로그아웃 | 지원 | 지원 | 지원 | 웹 세션 + 네이티브 세션 정리 정책 통일 |
| 온보딩 | 지원 | 지원 | Compose 지원 | 신규 사용자는 개인화/보안 설정 흐름을 동일한 의미로 거쳐야 함 |
| 홈 화면 구성 | 지원 | 지원 | Compose 지원 | 사용자 선호 기반 홈 구성 정책 통일 |
| 테마 설정 | 지원 | 지원 | 지원 | `light/dark/system` 3모드 동일 적용 |
| 개인 가계부 | 지원 | 지원 | Compose 지원 | 개인 공간 데이터만 사용. 공유 공간 지출 자동 혼입 금지 |
| 공간 지출 | 지원 | 지원 | 지원 | 공유 공간 내부 전용. 개인 가계부 반영은 명시 액션으로만 처리 |
| 개인 일정 | 지원 | 지원 | 지원 | 개인 공간/개인 visibility 데이터만 사용 |
| 공간 일정 | 지원 | 지원 | Compose 지원 | 공간 멤버/역할 기준으로 생성·조회·수정 제한 |
| 공간 초대 | 지원 | 지원 | 지원 | 초대 코드/링크 유효성 검증 및 재발급 정책 통일 |
| 가족 공간 초대 | 후속 반영 | 후속 반영 | Compose 지원 | 공간 설정과 분리. `일반 가족 구성원`은 코드/링크, `자녀`는 보호자 확인·동의·일회성 초대 흐름 사용 |
| 자녀 계정 연결 | 지원 | 지원 | WebView 경로 보존 지원 | 자녀 이메일은 선택 제한값. Google/이메일 검증 계정의 72시간 토큰 claim은 후보만 저장하고 보호자 승인 전 멤버십·연령 권한 생성 금지 |
| 공간 멤버/권한 | 지원 | 지원 | Compose 지원 | 공간 지기/공간 운영자/공간 멤버 명칭 통일 |
| 가족 관계 표시 | 후속 반영 | 후속 반영 | Compose 지원 | `space_members.role` 권한과 `family_role` 관계를 분리하고 가족 공간에서 관계를 주 배지로 표시 |
| 알림 목록 | 지원 | 지원 | Compose 지원 | in-app 알림 조회 정책 통일 |
| 푸시 알림 | 웹 FCM | 웹 FCM | 네이티브 FCM | 권한 요청 타이밍과 실패 안내 통일 |
| 마이페이지 | 지원 | 지원 | Compose 전체 메뉴 지원 | 프로필, 설정, 계정 관리 항목 노출 정책 통일 |
| 광고 | Web AdSense/자체 광고 | Web AdSense/자체 광고 | AdMob 기반 + Kakao AdFit SDK 팝업 | 광고 슬롯/플랫폼 타겟 정책 통일 |

---

## 플랫폼 전용 기능

| 기능 | 적용 플랫폼 | 다른 플랫폼 노출 정책 | 현재 판단 |
|---|---|---|---|
| 생체인증 앱 잠금 | Android App, iOS App 예정 | Web에서는 숨김 또는 `앱 전용` 안내 | Android/iOS 네이티브 플러그인 기반 추가 완료. 웹 기능으로 오해시키면 안 됨 |
| 기기 캘린더 연동 | Android App 지원, iOS 예정 | Web에서는 `Android 앱 우선 지원` 안내 | Android 30일 내보내기·자동 반영·선택 가져오기 완료. iOS EventKit은 후속 |
| 앱 버전/스토어 업데이트 | Native App | Web에서는 숨김 | 앱 내부 마이페이지/설정에서만 노출하는 것이 적절 |
| Universal Link / App Link | Native App + Web 라우트 | Web에서는 일반 링크로 동작 | 초대 링크, OAuth callback, logout callback은 회귀 테스트 필요 |
| iOS 앱 다운로드 | iOS App | `/download`에서 `준비 중` 표시 | App Store 등록 전까지 동일 문구 유지 |
| Apple 로그인 | iOS/Web 예정 | 준비 중이면 모든 화면에서 같은 상태 표시 | 현재 일부 설정/마이페이지 중심으로 보일 수 있어 점검 필요 |

---

## 현재 확인된 불일치/점검 대상

| 우선순위 | 대상 | 파일 | 조치 |
|---|---|---|---|
| P0 | 로그인 후 복귀 | `src/components/NativeAppProvider.tsx`, Android `RouterActivity`, `MainActivity` | Android OAuth callback 보정 완료. 실제 기기 회귀 테스트 필요. iOS는 `IOS-*` 후순위에서 별도 검증 |
| P0 | 개인/공간 데이터 경계 | `src/lib/db.ts`, `supabase/migrations/015_harden_private_schedule_rls.sql`, `tests/data-boundaries.test.ts` | 강화 SQL 실행·정책 확인 이력과 코드 접근 매트릭스 9/9 존재. Docker/로컬 Supabase 역할별 CRUD 통합 회귀는 `WEB-001` |
| P0 | 공간 초대 링크/코드 | `src/app/invite/[code]`, `src/app/api/invite/info/route.ts`, `src/components/NativeAppProvider.tsx` | 링크/코드/앱링크/웹링크 모두 같은 초대 코드로 진입하는지 검증 필요 |
| P1 | 가족 관계·초대 UX | Android `ComposeSpaceScreen`, `NativeSpaceActivity`, Web 공간 멤버/설정 화면 | Android는 관계/권한 분리와 초대/설정 분리 완료. PC/Mobile Web은 같은 API 계약과 정보 구조로 후속 반영하고 iOS는 Android 확정 동작을 기준으로 재구현 |
| P1 | 기기 캘린더 설정 | `src/app/settings/calendar/page.tsx`, `src/lib/native-calendar.ts`, Android `NativeCalendarPlugin` | Android 내보내기·자동 반영·가져오기 완료. iOS EventKit 확장 필요 |
| P1 | 생체인증 설정 노출 | `src/app/mypage/*`, `src/components/NativeBiometricGate.tsx` | Web에서는 앱 전용으로 오해되지 않게 숨김/안내 기준 필요 |
| P1 | 광고 플랫폼 타겟 | `src/components/AdSlot.tsx`, Android AdFit/AdMob 코드, `backoffice/*` | 웹/Android 타겟과 AdFit 실패 fallback 실기기 검증 필요 |
| 완료 | 관리자/백오피스 경계 | `backoffice/*`, `next.config.ts` | 공식 콘솔은 `admins.gleaum.com` 단일화, 메인 `/admin`은 리다이렉트 |
| P2 | 지도 API 안내 | 일정 상세 화면 | 지도 미연동 상태 문구를 PC/Mobile 동일하게 정리 필요 |
| P2 | 이미지 첨부 | 일정 생성/수정 화면 | UI만 있는 경우 모든 플랫폼에서 같은 `준비 중` 또는 비활성 처리 필요 |

---

## 다음 구현 순서

### 1단계 — P0 기능 회귀 안정화

- Android 앱 Google 로그인 후 모바일 웹 로그인 화면으로 되돌아가지 않는지 실제 배포 버전 확인
- 초대 링크 `https://gleaum.com/invite/{code}`가 웹/Android 앱에서 모두 유효한 코드로 진입하는지 확인
- 운영 RLS 정책이 authenticated 역할과 개인/공간 경계를 유지하는지 재확인하고, 로컬 Supabase 준비 후 역할별 CRUD 자동 회귀 추가
- 개인 가계부 입력이 공유 공간에 표시되지 않는지 확인
- 공유 공간 지출이 개인 가계부에 자동 섞이지 않는지 확인
- 공간 멤버/역할 표시가 실제 `space_members` 기준과 일치하는지 확인

### 2단계 — 설정 기능 싱크

- 마이페이지 설정 항목을 PC Web / Mobile Web / Android App 기준으로 재분류
- Web 미지원 네이티브 기능은 숨기거나 `앱 전용`으로 표시
- 준비 중 기능은 모든 화면에서 같은 문구와 같은 상태 배지를 사용
- 캘린더, 생체인증, 알림, 테마, 홈 화면 구성의 진입 경로를 통일

### 3단계 — 운영/관리 기능 경계 정리

- 사용자 앱 `/admin/*`와 별도 `backoffice/*`의 역할 분리
- 광고 관리가 사용자 앱에 남아야 하는지, 백오피스로 완전히 이관할지 결정
- Firebase App Distribution/Remote Config는 백오피스 기준으로 관리하는 것을 기본값으로 둔다

### 4단계 — 플랫폼별 출시 준비

- Android: Play Console 정식 출시 전 R8, 데이터 안전, 스토어 등록정보, 릴리즈 SHA-1 확인
- iOS: Apple Developer 유료 계정, Associated Domains, APNs, App Store URL 확보
- Web: PWA/다운로드/앱 설치 안내 문구 정리

---

## 작업 시 주의

- 기능 싱크 작업 중 DB 구조 변경이 필요하면 먼저 문서와 SQL 파일을 작성하고, 사용자에게 Supabase SQL Editor 실행 SQL을 명확히 안내한다.
- 컴포넌트에서 Supabase 쿼리를 직접 작성하지 않는다. 모든 쿼리는 `src/lib/db.ts`를 통한다.
- 기능을 숨기는 것과 삭제하는 것은 다르다. 준비 중 기능은 운영상 필요한 경우 숨기고, 사용자에게 약속해야 하는 경우에만 안내한다.
- Native-only 기능은 웹에서 실패하는 버튼으로 두지 않는다.
