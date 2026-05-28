# 📚 글리움(Gleaum) 프로젝트 문서 센터

> **모든 AI 어시스턴트에게**: 이 `docs/` 폴더는 글리움 **사용자 앱(User-facing App)**의 완전한 인수인계 문서입니다.
> 작업을 시작하기 전에 반드시 **`10-ai-handoff-guide.md`부터 먼저 읽어주세요.**
> 그 다음 `12-product-model.md`, `07-features-completed.md` 순으로 확인하세요.
>
> ⚠️ **백오피스(Admin Backoffice)** 관련 작업 시에는 이 폴더가 아닌
> **`backoffice/docs/`** 폴더의 문서를 기준으로 하세요. 두 시스템은 완전히 독립적으로 운영됩니다.

---

## 📂 문서 목록

| 파일 | 내용 | 중요도 |
|------|------|--------|
| `01-project-overview.md`   | 프로젝트 비전, 목표, 서비스 개요 | 참고 |
| `02-tech-stack.md`         | 기술 스택 전체 상세 | 참고 |
| `03-design-system.md`      | 디자인 시스템 (컬러, 타이포, 컴포넌트 규칙) | 참고 |
| `04-file-structure.md`     | 전체 파일/폴더 구조 설명 | 참고 |
| `05-database-schema.md`    | Supabase DB 스키마, RLS, 트리거 | 필수 |
| `06-auth-and-api.md`       | Google OAuth, Calendar, Drive API 설정 | 참고 |
| `07-features-completed.md` | 완료된 기능 전체 목록 (최신 작업 내역 포함) | 필수 |
| `08-features-pending.md`   | 미완료/예정 기능 및 우선순위, 네이티브 앱 계획 | 필수 |
| `09-deployment.md`         | 배포 환경, 환경변수, CI/CD | 참고 |
| `10-ai-handoff-guide.md`   | ⭐ **AI 인수인계 핵심 가이드** (절대 규칙 포함) | **최우선** |
| `11-improvement-audit.md`  | 개선/추가 기능 종합 진단 | 참고 |
| `12-product-model.md`      | ⭐ 개인 중심 + Space 확장형 제품 모델 재정의 | **최우선** |
| `13-gcp-account-migration.md` | GCP/Firebase 계정 이관 기록 | 참고 |
| `14-native-app-plan.md`    | ⭐ **네이티브 앱 확장 계획** (macOS → iOS → Android) | **최우선** |
| `Guide/expenses.md` | 지출 카테고리 설계 가이드 (고정/변동, 1~3차 분류) | 참고 |

---

## ⚡ 빠른 컨텍스트

- **서비스명**: 글리움 (Gleaum)
- **성격**: 개인 중심 + 친구/연인/가족 Space 확장형 토털 라이프 관리 서비스
- **현재 단계**: 웹 서비스 운영 + 네이티브 앱/스토어 출시 준비 + 초대/공간 정책 안정화
- **프로덕션 URL**: https://www.gleaum.com
- **GitHub**: https://github.com/Edwin-space/gleaum-app
- **최근 기준 커밋**: `d915bfb` (2026-05-28) — Android Firebase Performance 플러그인 제거(AGP 9.x 호환)까지 반영

---

## 🗺️ 현재까지 완료된 주요 마일스톤

```
✅ Day 1~4   기반 구축, DB 연동, Google OAuth
✅ Day 5     초대 링크, 전 페이지 디자인 리뉴얼
✅ Day 6     FCM 푸시 알림, Supabase Cron 리마인더, 자동화 정책 엔진
✅ Day 7~9   SEO, PWA 완성, PC/모바일 뷰 분리
✅ 2026-05-08 PC WEB 전 구간 프리미엄 인라인 스타일 리디자인
✅ 2026-05-08 모바일 전 구간 프리미엄 인라인 스타일 리디자인
✅ 2026-05-08 모바일 /home 성능 최적화 (Speed Insights poor 개선)
✅ 2026-05-08 GA4 세팅 + 핵심 이벤트 트래킹
✅ 2026-05-08 사이드바/BottomNav 모바일 노출 버그 수정
✅ 2026-05-08 네이티브 앱 계획서 수립 (14-native-app-plan.md)
✅ 2026-05-08 Capacitor 네이티브 앱 기반 구축 (iOS + Android 플랫폼 추가)
✅ 2026-05-08 native.ts 유틸리티 레이어, NativeAppProvider, Info.plist, AndroidManifest 설정 완료
✅ 2026-05-14 Google Play 내부 테스트 버전 업로드 완료
✅ 2026-05-26 온보딩 직접 진입/신규 유저 플로우 개선, 네이티브 성능 최적화
✅ 2026-05-26 Android Kotlin stdlib 충돌 해결, iOS WKWebView/알림 권한 타이밍 개선
✅ 2026-05-27 공간 정책 개편, 초대 공유 3종, 다운로드 페이지 추가
✅ 2026-05-27 초대 링크/로그인/인앱 브라우저/AdSense ads.txt 관련 버그 수정
✅ 2026-05-27 가계부 지출 등록 시 즉시 FCM 발송되는 크리티컬 버그 수정
✅ 2026-05-27 iOS 무료 Apple Developer 빌드를 위해 Associated Domains entitlement 임시 제거
✅ 2026-05-28 개인/공유 공간 데이터 경계 보정, 공간 멤버 조회 안정화, private 데이터 개인 공간 이동 SQL 추가
✅ 2026-05-28 공간 초대 코드 복사, 신규 참여 기본 권한, 역할 명칭, 프로필 이미지 URL 렌더링 안정화
✅ 2026-05-28 개인 가계부와 공간 지출 개념 분리, 공간 지출 → 개인 가계부 반영 모델 추가
✅ 2026-05-28 고정지출 연체 알림, 주간 소비 다이제스트, D-day UI 추가
✅ 2026-05-28 Firebase Crashlytics/Remote Config/App Check/App Distribution 기반 추가
✅ 2026-05-28 백오피스 릴리즈 관리 + Remote Config 편집기 추가
✅ 2026-05-28 Android AGP 9.x 호환 문제로 Firebase Performance Gradle 플러그인 제거
✅ 2026-05-28 Firebase App Distribution Gradle DSL 제거로 Android Studio Sync 오류 수정

🔜 다음 단계  Supabase `012_cron_overdue_and_digest.sql` 실행 여부 확인 → Firebase Remote Config 실값 등록 → Android 내부 배포 검증 → Apple Developer 유료 계정 연결
```

---

## 🚨 작업 시 절대 규칙

1. **인라인 스타일 전용** — Tailwind CSS v4 신뢰성 문제로 **모든 컴포넌트는 100% 인라인 스타일만 사용**. `glass-card`, `animate-*`, CSS `var()` 금지
2. **제품 모델 우선 확인** — 신규 기능은 반드시 `12-product-model.md` 기준으로 설계
3. **`src/lib/db.ts`** — 모든 DB 접근의 단일 진입점, 구조 변경 금지
4. **Purple(`#5A32FA`) 사용 금지** — 브랜드 컬러는 `#0084CC` / `#0CC9B5` / `#2EE895`
5. **`useIsDesktop()`** — `@/hooks/useMediaQuery`에서 import (NOT `@/hooks/useIsDesktop`)
6. **빌드 확인 필수** — `npm run build` 후 에러 없을 때만 push
7. **문서 업데이트 필수** — 작업 완료 후 `07-features-completed.md`, `10-ai-handoff-guide.md` 반드시 업데이트
8. **NAS 자동 동기화** — `git push` 완료 시 post-push 훅이 자동으로 NAS(`/Users/edwin/Sync-NAS/#1. Personal/Project/Gleaum/`)에 동기화. 훅 재설치 필요 시: `bash scripts/install-hooks.sh`

---

마지막 업데이트: 2026-05-28
