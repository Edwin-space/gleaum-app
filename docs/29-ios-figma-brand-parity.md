# iOS 코드 ↔ Figma 브랜드 가이드 대조표

> 기준일: 2026-07-27
> Figma: `Gleaum — Brand System & Store Asset Library` (fileKey `Swz3z9gWdsVuO13anqtOPF`, THE E&M / 참고 자료 프로젝트)
> 기준 문서: `docs/28-apple-liquid-glass-design-plan.md`, `DESIGN.md`
> 목적: iOS 디자인 관련 코드와 Figma 브랜드 가이드의 일치/차이를 고정하고, 라이트 톤 전환 결과를 기록한다.

## 1. 결론

- **디자인 토큰 레이어(`GleaumDesignSystem.swift`, `GleaumSymbol.swift`)는 Figma와 일치**한다. 브랜드 색·스페이싱·라운드·SF Symbols·5탭·시맨틱(라이트 우선) 색 운영이 모두 맞다.
- **실제 렌더 화면(홈·일정등록·로그인)이 다크였던 것이 유일한 방향 불일치**였고, 2026-07-27 라이트로 전환했다.
- **Liquid Glass·capsule 버튼·시스템 폰트**는 세부 표기/구현 정합화가 남는다(§4).

## 2. 일치 항목 (변경 불필요)

| 항목 | iOS 코드 | Figma / DESIGN.md |
|---|---|---|
| 브랜드 색 | `GleaumColors` Blue #0084CC · Teal #0CC9B5 · Green #2EE895 | 동일 |
| 스페이싱 | `GleaumSpacing` 4·8·12·16·20·24·32 | 4px 그리드 동일 |
| 라운드 | `GleaumRadius` 8·16·24(card)·32(nav)·pill | 동일 |
| 아이콘 | `GleaumSymbol` SF Symbols(house/calendar/person.2/creditcard/line.3.horizontal) | 05 아이코노그래피·08 Apple |
| 탭 구성 | 홈·일정·공간·가계부·전체 | 08 Apple 탭 동일 |
| 색 운영 | `screenBackground = systemGroupedBackground` (라이트 기본·시맨틱, 다크모드 자동) | 라이트 우선 방향 동일 |
| 뱃지 | `GleaumStatusBadge` tone 12% 캡슐 | 04/08 type badge 동일 |
| 카드 | `GleaumCard` radius 24 + separator | 08/DESIGN.md card 동일 |

## 3. 2026-07-27 라이트 전환 (완료)

사용자 방침(다크 지양, 다크는 다크모드에서만)에 따라 하드코딩 다크 화면을 라이트 팔레트로 전환했다.

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `NativeHomeViewController.swift` | bg #0F1729, surface #151E33, text 흰색, 다크 블러 하단바, 다크 그라디언트 카드, `.lightContent` | bg Canvas #FAFAFD, surface #FFFFFF+hairline, text Navy #1A1B2E, 라이트 블러 하단바(컬러 섀도우), 브랜드-블루 tint 카드, `.darkContent` |
| `NativeScheduleCreateViewController.swift` | bg #0F1729, surface #151E33, text 흰색, `.lightContent` | 폼 bg #F5F5F9, surface #FFFFFF+hairline, Navy 텍스트, 오류색 #EF4444, `.darkContent` |
| `GleaumDesignSystem.swift · GleaumBrandBackdrop` | 다크 네이비 그라디언트 + 브랜드 글로우 | 화이트/Canvas 그라디언트 + 브랜드 글로우(라이트) |
| `GleaumDesignSystem.swift · GleaumBrandMark` | 워드마크 `.white` | `.primary`(라이트·다크 자동) |
| `GleaumAccessViews.swift · GleaumLoginView` | hero 텍스트 `.white`/0.72, 패널 테두리 white 0.28 | `.primary`/`.secondary`, `GleaumColors.separator` |
| `LoginViewController.swift` | `.lightContent` | `.darkContent` |

> 버튼 위 스피너·구글 아이콘 배경의 `.white`는 브랜드-컬러 버튼 위이므로 유지. `.ultraThinMaterial` 로그인 패널은 라이트 배경 위에서 밝은 프로스트로 자동 렌더된다.

## 4. 남은 정합화 (미완료)

| 차이 | 현재 | 권장 | 소유 |
|---|---|---|---|
| **Liquid Glass** | 앱 셸/탭 바 미구현(IOS-009). material 사용은 로그인 패널 1곳 | SwiftUI 5탭 셸 구현 시 탭 바·toolbar 등 **탐색 계층에만** Liquid Glass 적용(콘텐츠 카드 남용 금지) | `IOS-009` |
| **Primary 버튼 형태** | 코드 `gleaumPrimaryAction` = capsule(pill) `borderedProminent`, minHeight 52 | Figma 08 Apple 열 버튼을 capsule로 맞춰 코드와 일치(브랜드도 pill) | Figma 08 |
| **타이포그래피** | Apple 시스템 폰트 + Dynamic Type(`.largeTitle`/`.title2`/`.headline`/`.body`/`.caption`) — doc 28 기준 정답 | Figma 04/13에 "iOS는 시스템 폰트+Dynamic Type(워드마크만 예외)" 명시 추가 | Figma 04/13 |
| **레거시 화면 대체** | 홈·일정등록은 UIKit(라이트 전환 완료) | doc 28대로 SwiftUI 화면으로 최종 교체 시 본 라이트 팔레트 계승 | `IOS-009/010` |

## 5. 검증 상태

- 코드 변경은 색상 값·enum·상태바 스타일 한정으로 구조 변경 없음.
- 실제 시뮬레이터 라이트 렌더 육안 검증은 다음 iOS 빌드에서 확인 필요.
