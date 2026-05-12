# 📚 글리움 백오피스(Admin Backoffice) 문서 센터

> **모든 AI 어시스턴트에게**: 백오피스와 관련된 모든 작업은 **이 `backoffice/docs/` 폴더의 문서를 기준**으로 합니다.
> 루트의 `docs/` 폴더(사용자 앱 문서)를 참조하지 마세요. 두 시스템은 독립적으로 운영됩니다.
> 작업 시작 전 반드시 **`01-overview.md` → `02-design-guide.md` → `03-current-status.md`** 순으로 읽으세요.

---

## 📂 문서 목록

| 파일 | 내용 | 중요도 |
|------|------|--------|
| `01-overview.md` | 백오피스 시스템 개요, 목적, 기술 스택 | **최우선** |
| `02-design-guide.md` | 백오피스 전용 UI/UX 설계 원칙 및 컴포넌트 규칙 | **최우선** |
| `03-current-status.md` | 현재 구현 완료/미완료 항목, 다음 작업 우선순위 | **최우선** |
| `04-trouble-log.md` | 개발 중 발생한 주요 문제 및 해결 기록 | 참고 |
| `05-deployment.md` | 배포 환경, 환경변수, CI/CD 파이프라인 | 참고 |

---

## ⚡ 빠른 컨텍스트

- **서비스명**: 글리움 백오피스 (Gleaum Admin Backoffice)
- **운영 목적**: 회원/공간 관리, CRM 캠페인 발송, 광고 매니저, 시스템 설정
- **접근 방식**: 독립 서브 프로젝트 (`gleaum-app/backoffice/` 하위)
- **배포**: Vercel 독립 프로젝트 (Root Directory: `backoffice`)
- **연결 DB**: 기존 사용자 앱과 동일한 Supabase 프로젝트 공유

---

## 🚨 백오피스 작업 시 절대 규칙

1. **shadcn/ui 패키지 설치 금지** — shadcn 스타일을 Tailwind CSS 클래스로 수동 구현. `shadcn add [컴포넌트]` 명령어 사용 불가
2. **기존 사용자 앱 코드 절대 수정 금지** — `backoffice/` 폴더 외부의 모든 파일은 읽기 전용
3. **빌드 검증 필수** — `backoffice/` 폴더에서 `npm run build` 성공 후에만 `git push`
4. **공통 Sidebar 수정 시** — `backoffice/src/components/Sidebar.tsx` 단일 파일만 수정. 각 page.tsx에 사이드바를 직접 작성하지 않음
5. **환경변수 파일 커밋 금지** — `.env.local`은 `.gitignore`로 제외되어 있음

마지막 업데이트: 2026-05-12
