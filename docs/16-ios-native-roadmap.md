# iOS 네이티브 전환 로드맵

> 기준일: 2026-06-18
> 목적: 회원가입/로그인 외 iOS 네이티브 전환 대상을 정리하고, WebView와 SwiftUI 화면이 같은 데이터 계약을 쓰도록 한다.

## 현재 상태

- iOS는 Capacitor 기반 WKWebView 앱이다.
- 네이티브 로그인/세션 저장은 구현되어 있다.
- 생체인증과 기기 캘린더는 네이티브 플러그인 브리지 수준까지 구현되어 있다.
- 홈, 일정, 가계부, 공간, 마이페이지/설정의 제품 화면은 대부분 웹 화면을 WKWebView로 표시한다.

## 전환 원칙

- 전체 앱을 한 번에 SwiftUI로 재작성하지 않는다.
- 앱 품질에 직접 영향을 주는 첫 화면, 고빈도 입력, OS 권한, 보안, 딥링크부터 네이티브화한다.
- Swift/iOS 화면은 Supabase를 직접 많이 조회하지 않고, Next.js Route Handler를 BFF처럼 사용한다.
- DB 쿼리 로직은 `src/lib/db.ts`에 모으고, Route Handler는 인증/HTTP 입출력만 담당한다.
- 네이티브 API는 WebView cookie 세션과 `Authorization: Bearer <access_token>` 호출을 모두 지원해야 한다.

## 우선순위

| 우선순위 | 구간 | 이유 | 권장 방식 |
|---|---|---|---|
| P0 | iOS 앱 셸/라우팅 | 로그인 후 화면 전환, 세션, 뒤로가기, 홈 복귀가 앱 품질을 좌우 | SwiftUI Shell + WebView/Native 하이브리드 라우팅 |
| P0 | 홈 요약 | 앱 첫 화면이며 체감 품질이 가장 큼 | 네이티브 홈 요약 화면 |
| P0 | 일정 빠른 등록 | 사용자 제보가 있었던 핵심 입력 플로우 | SwiftUI 일정 등록 Sheet |
| P0 | 생체인증/보안 설정 | Face ID/Touch ID는 OS 네이티브 UX가 필수 | 네이티브 보안 설정 화면 또는 네이티브 Sheet |
| P0 | 푸시 권한/APNs | iOS 권한 요청 타이밍이 중요 | 네이티브 권한 안내 화면 |
| P0 | 초대 링크/딥링크 | Safari/WebView/앱 전환 오류 방지 | Universal Link + 네이티브 초대 수락 진입점 |
| P1 | 캘린더 연동 설정 | EventKit 플러그인을 실제 UX로 완성 | 캘린더 선택/내보내기/가져오기 네이티브 화면 |
| P1 | 가계부 빠른 입력 | 금액·날짜·카테고리 입력은 네이티브 컨트롤이 안정적 | 수입/지출 Quick Entry Sheet |
| P1 | 공간 초대/공유 | iOS Share Sheet와 맞물림 | 초대 코드 복사/링크 공유 네이티브화 |
| P2 | 관리자/백오피스 | 사용자 앱 핵심 흐름이 아님 | 웹 유지 |

## 2026-06-18 1차 기반 반영

### 추가된 API

| API | 메서드 | 용도 |
|---|---|---|
| `/api/native/home-summary` | `GET` | iOS 네이티브 홈 화면용 요약 데이터 |
| `/api/native/schedules` | `POST` | iOS 네이티브 일정 등록 Sheet용 생성 API |

### 인증 방식

- WebView/웹 호출: 기존 Supabase cookie 세션 사용.
- Swift 네이티브 호출: `Authorization: Bearer <access_token>` 헤더 사용.
- 공통 인증 헬퍼: `src/lib/supabase/native-route.ts`.

### 홈 요약 계약

`GET /api/native/home-summary` 응답은 다음 영역을 포함한다.

| 필드 | 의미 |
|---|---|
| `serverTime` | 서버 응답 기준 시각 |
| `user` | 사용자 표시명, 이메일, 아바타, 온보딩 완료 여부, 타임존 |
| `spaces` | 활성 공간, 개인 공간, 공유 공간, 역할, 멤버 수 |
| `schedules` | 오늘 일정, 향후 일정, 개수 |
| `ledger` | 이번 달 수입, 지출, 순액, 최근 원장 항목 |

### 일정 생성 계약

`POST /api/native/schedules` 요청 예시:

```json
{
  "title": "병원 예약",
  "type": "personal",
  "startTime": "2026-06-18T09:00:00.000Z",
  "endTime": "2026-06-18T10:00:00.000Z",
  "allDay": false,
  "reminder": 15,
  "repeat": "none",
  "memo": "초진"
}
```

공유 공간 일정은 `spaceId`와 `participantIds`를 받을 수 있다. 서버는 `space_members.role`을 확인해 `admin/editor`만 공유 공간 일정을 생성하도록 막는다.

## 2026-06-18 P0 네이티브 앱 셸 반영

### 추가된 iOS 파일

| 파일 | 역할 |
|---|---|
| `NativeHomeModels.swift` | `/api/native/*` 응답/요청 Codable 모델 |
| `NativeAPIClient.swift` | Bearer 세션 기반 네이티브 API 클라이언트 |
| `NativeRouteCoordinator.swift` | 홈/웹 경로/초대 링크 딥링크 라우팅 |
| `NativeHomeViewController.swift` | iOS 네이티브 홈 화면 |
| `NativeScheduleCreateViewController.swift` | iOS 네이티브 일정 빠른 등록 Sheet |

### P0 구현 상태

| P0 항목 | 상태 | 비고 |
|---|---|---|
| 앱 셸/라우팅 | 1차 완료 | 세션 보유 시 네이티브 홈을 full-screen으로 표시, 비네이티브 구간은 WebView 경로로 이동 |
| 홈 요약 | 1차 완료 | 종합 일정 → 오늘 달력 → 오늘 일정 → 광고 → 가계부 순서 |
| 일정 빠른 등록 | 1차 완료 | 홈 `+`/오늘 일정 `+ 새 일정` → 네이티브 Sheet → `POST /api/native/schedules` |
| 생체인증/보안 설정 | 1차 완료 | `NativeBiometricPlugin.isAvailable()`은 Face ID/Touch ID 등록만 available 처리 |
| 푸시 권한/APNs | 1차 완료 | 홈 앱 설정의 알림 버튼에서 iOS 알림 권한 요청 및 APNs 등록 |
| 초대 링크/딥링크 | 1차 완료 | `gleaum://invite/{code}` 및 `https://www.gleaum.com/invite/{code}`를 WebView 초대 경로로 라우팅 |

## 다음 구현 순서

1. 운영/Vercel에 `/api/native/home-summary`, `/api/native/schedules` 배포 후 실제 계정으로 홈 요약 로딩 확인
2. 네이티브 홈에서 웹으로 이동한 뒤 다시 네이티브 홈으로 복귀하는 하단 탭/홈 버튼 UX 추가
3. 일정 빠른 등록 Sheet에 반복, 장소, 참여자 선택, 공유 공간 권한 안내 추가
4. 생체인증/보안 설정 화면을 웹 설정 경유가 아닌 완전 네이티브 화면으로 확장
5. 캘린더 설정 화면을 EventKit UX로 확장

## 주의 사항

- Swift 화면에서 Supabase 테이블을 직접 많이 조회하면 웹/Android/iOS 로직이 분리된다.
- 네이티브 화면은 반드시 API 계약을 우선 사용한다.
- 현재 홈 요약의 날짜 범위는 서버 기준 월/일 범위를 사용한다. 사용자 타임존별 정확한 경계 처리는 추후 API에 `timezone` 파라미터를 추가해 보강한다.
- 가계부는 `ledger_entries` 원장을 기준으로 한다. 일회성 지출을 `schedules` 일정처럼 다시 확장하지 않는다.
- 공간 공유 일정은 개인 공간/공유 공간 경계를 절대 섞지 않는다.



## 2026-06-18 P0 fallback 보정

- 네이티브 홈 API가 운영에 배포되기 전에는 `GET /api/native/home-summary`가 404를 반환할 수 있다.
- 앱 첫 화면이 에러 화면으로 막히지 않도록 `NativeAPIError.shouldFallbackToWebHome`을 추가했다.
- 404 또는 5xx 응답은 자동으로 기존 WebView `/home`으로 전환한다.
- 따라서 운영 API 배포 전까지는 네이티브 홈 대신 모바일 웹 홈이 보이는 것이 안전 동작이다.
