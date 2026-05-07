# 08. 미완료 / 예정 기능

## 우선순위 기준

| 기호 | 의미 |
|------|------|
| 🔴 | 필수 (서비스 핵심 기능) |
| 🟡 | 중요 (사용성 크게 향상) |
| 🟢 | 선택 (있으면 좋음) |

---

## 현재 기술 부채

| 항목 | 내용 | 파일 |
|------|------|------|
| `middleware.ts` 경고 | "middleware" 파일명 deprecated → "proxy"로 변경 권장 | `src/middleware.ts` |
| 이미지 첨부 미구현 | UI는 있으나 실제 업로드 로직 없음 | `src/app/schedules/new/page.tsx` |
| Google OAuth 앱 게시 | 테스트 사용자만 로그인 가능 (프로덕션 미게시) | Google Cloud Console |
| Google Calendar 연동 | 코드 완성, 수동 API 활성화 대기 | Google Cloud Console |

---

## 웹 서비스 잔여 과제

### 🟡 통계 및 분석 페이지
- 월간 자녀 일정 완료율 차트
- 카테고리별 지출 트렌드 (월별 추이)
- 사용자 활동 요약 대시보드

### 🟡 1회성 일정 단건 외부 공유
- 특정 `scheduleId` 기반 읽기 전용 공개 뷰 (`/share/[scheduleId]`)
- 비로그인 게스트도 해당 일정 정보 열람 가능

### 🟡 Google Drive 사진 첨부
- Google Picker API 연동
- `schedule_attachments` 테이블 추가 필요
- Drive API 활성화 선행 필요

### 🟢 마이페이지 PC UI 최적화
- 프로필 수정 영역 PC 대시보드 구조화

### 🟢 Space 아키텍처 확장
- `family_groups.type` 추가 → 기존 가족 그룹을 Space로 확장
- `spaces`, `space_members`, `schedule_assignees`, `schedule_observers`, `notification_rules` 테이블 설계
- 중기 목표: 개인 Space / 연인 Space / 가족 Space / 모임 Space 구분

---

## 네이티브 앱 확장 계획

> 상세 계획서: `docs/14-native-app-plan.md` 참조

### Phase A — macOS 앱 (우선 진행) 🔴

**전략**: Capacitor.js로 현재 Next.js 웹을 macOS 네이티브 앱으로 래핑
**배포**: Mac App Store 및/또는 직접 배포 (.dmg)
**진행 상태**: 계획 수립 완료, 작업 대기 중

주요 작업 항목:
- [ ] `@capacitor/core` + `@capacitor/cli` 설치 및 프로젝트 초기화
- [ ] `capacitor.config.ts` 구성 (Bundle ID: `com.gleaum.app`)
- [ ] Next.js 정적 export 설정 (`output: 'export'`) 또는 local webserver 방식 결정
- [ ] Xcode 프로젝트 생성 및 Mac Catalyst 활성화
- [ ] 네이티브 스플래시 스크린 + 앱 아이콘 세트 구성
- [ ] APNs 푸시 알림 연동 (현재 FCM → APNs 브릿지)
- [ ] `@capacitor/local-notifications` 플러그인 연동
- [ ] `@capacitor/browser` 플러그인 (OAuth 플로우)
- [ ] macOS 창 크기/메뉴바 설정
- [ ] Apple Developer 계정 등록 및 프로비저닝 프로파일 설정
- [ ] Mac App Store 심사 제출

### Phase B — iOS / iPad 앱 🟡

**전략**: macOS Capacitor 설정 재활용 (동일 Xcode 프로젝트에서 iOS 타겟 추가)
**배포**: App Store

주요 추가 작업:
- [ ] iOS 타겟 추가 (iPad + iPhone 유니버설)
- [ ] `@capacitor/status-bar` 상태바 스타일 조정
- [ ] `@capacitor/keyboard` 키보드 이벤트 처리
- [ ] `@capacitor/haptics` 햅틱 피드백
- [ ] Face ID / Touch ID 인증 (`@capacitor-community/biometric-auth`)
- [ ] 네이티브 캘린더 동기화 (`@capacitor-community/native-market`)
- [ ] App Store 스크린샷 및 메타데이터 제출

### Phase C — Android 앱 🟢

**전략**: 동일 Capacitor 코드베이스에서 Android 타겟 추가
**배포**: Google Play Store

주요 작업:
- [ ] Android Studio 설정 및 Android 타겟 추가
- [ ] FCM 이미 연동되어 있어 푸시 알림 추가 작업 최소
- [ ] `@capacitor/splash-screen` Android 스플래시 설정
- [ ] Google Play Console 등록 및 심사 제출
- [ ] 키스토어 생성 + APK/AAB 서명

