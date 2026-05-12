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

### ⚠️ [필수] 컴포넌트 원칙 — **UI 코드 작성 전 실제 설치 확인부터**

> **이 규칙을 지키지 않으면 컴포넌트 스타일이 정상적으로 렌더링되지 않아 실제 배포 화면이 깨집니다.**
> 과거 컴포넌트를 설치하지 않은 상태로 Tailwind 클래스로 shadcn/ui를 흔내내다 배포가 부서진 실제 사례가 있었습니다.

**[설치 확인 명령어]**
```bash
# backoffice/ 폴더에서 실행
# components.json 파일이 없다면 shadcn이 초기화되지 않은 상태입니다.
ls backoffice/components.json   # 존재해야 정상

# 필요한 컴포넌트 추가 시
px shadcn@latest add [component-name] -y
```

**[현재 설치된 컴포넌트 목록]**
`button`, `input`, `label`, `badge`, `table`, `tabs`, `select`, `textarea`, `card`, `separator`, `radio-group`, `switch`

**[컴포넌트를 쉽게 추가하는 방법]**
```bash
npx shadcn@latest add dialog -y      # 다이얼로그
npx shadcn@latest add toast -y       # 토스트
npx shadcn@latest add dropdown-menu -y  # 드롭다운 메뉴
```

---

### 점대 규칙 요약

1. **shadcn/ui 컴포넌트 도입 원칙** — 모든 UI는 `src/components/ui/`의 컴포넌트를 import하여 사용. Tailwind 클래스로 shadcn을 **직접 시뮬레이션하는 수동 작성은 금지**.
2. **기존 사용자 앱 코드 절대 수정 금지** — `backoffice/` 폴더 외부의 모든 파일은 읽기 전용
3. **빌드 검증 필수** — `npm run build` 성공(촜코드: 0) 후에만 `git push`
4. **공통 Sidebar 수정 시** — `backoffice/src/components/Sidebar.tsx` 단일 파일만 수정. 각 page.tsx에 사이드바 직접 작성 금지
5. **환경변수 파일 커밋 금지** — `.env.local`은 `.gitignore`로 제외되어 있음

마지막 업데이트: 2026-05-12
