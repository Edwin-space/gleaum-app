# 📚 글리움(Gleaum) 프로젝트 문서 센터

> **모든 AI 어시스턴트에게**: 이 `docs/` 폴더는 글리움 프로젝트의 완전한 인수인계 문서입니다.
> 작업을 시작하기 전에 반드시 **모든 문서를 순서대로 읽어주세요.**
> 특히 `10-ai-handoff-guide.md`와 `12-product-model.md`를 가장 먼저 확인하세요.

---

## 📂 문서 목록

| 파일 | 내용 |
|------|------|
| `01-project-overview.md`   | 프로젝트 비전, 목표, 서비스 개요 |
| `02-tech-stack.md`         | 기술 스택 전체 상세 |
| `03-design-system.md`      | 디자인 시스템 (컬러, 타이포, 컴포넌트 규칙) |
| `04-file-structure.md`     | 전체 파일/폴더 구조 설명 |
| `05-database-schema.md`    | Supabase DB 스키마, RLS, 트리거 |
| `06-auth-and-api.md`       | Google OAuth, Calendar, Drive API 설정 |
| `07-features-completed.md` | 완료된 기능 전체 목록 |
| `08-features-pending.md`   | 미완료/예정 기능 및 우선순위 |
| `09-deployment.md`         | 배포 환경, 환경변수, CI/CD |
| `10-ai-handoff-guide.md`   | ⭐ AI 인수인계 핵심 가이드 |
| `11-improvement-audit.md`  | 개선/추가 기능 종합 진단 |
| `12-product-model.md`      | ⭐ Space 기반 제품 모델 재정의 |

---

## ⚡ 빠른 컨텍스트

- **서비스명**: 글리움 (Gleaum)
- **성격**: 개인, 연인, 가족을 포괄하는 Space 기반 일상 네트워크 서비스 (iOS/Android/Web PWA)
- **현재 단계**: Day 6 완료 (FCM 푸시 알림 + Supabase Cron 리마인더 완료, Space 모델 재정의 진행)
- **배포 URL**: https://gleaum-app.vercel.app
- **GitHub**: https://github.com/Edwin-space/gleaum-app
- **Supabase 프로젝트 ID**: tyvjdsescukaeorcuaga
- **개발 환경**: macOS, `/Volumes/WD_BLACK/Ai Works/gleaum/`

---

## 🚨 작업 시 절대 규칙

1. **제품 모델 우선 확인** — 신규 기능은 반드시 `12-product-model.md`의 Space / Category / Automation Policy 기준으로 설계
2. **`src/lib/db.ts`** — 모든 DB 접근의 단일 진입점, 구조 변경 금지
3. **Purple(`#5A32FA`) 사용 금지** — 브랜드 컬러는 Green/Teal/Blue (`#2EE895`, `#0CC9B5`, `#0084CC`)
4. **폰트** `Pretendard` + `Outfit` 조합 유지
5. **빌드 확인 필수** — `npm run build` 후 에러 없을 때만 push

마지막 업데이트: 2026-05-04
