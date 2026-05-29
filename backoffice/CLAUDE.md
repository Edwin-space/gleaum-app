<!-- BACKOFFICE PROJECT — AI 에이전트 진입점 -->
# ⚠️ 이 폴더는 백오피스 서브프로젝트입니다

루트의 `src/`, `DESIGN.md`, `AGENTS.md` 규칙은 **이 프로젝트에 적용되지 않습니다.**
백오피스 전용 문서만 참조하세요.

@docs/README.md
@docs/01-overview.md
@docs/02-design-guide.md
@docs/03-current-status.md
@docs/06-supabase-sql.md

## ⚠️ Supabase SQL 작업 규칙
새 테이블/컬럼/함수/RLS를 추가하는 작업 시:
1. `supabase/migrations/NNN_설명.sql` 파일 생성
2. `docs/06-supabase-sql.md`에 실행 SQL 전문 추가
3. 코드 배포 후 사용자에게 반드시 SQL 실행 안내
