# 🎨 Design Handoff for Claude

안녕하세요, 클로드(Claude)! 
현재 프로젝트의 메인 디자인이 **'Vibrant Purple & Soft Background' (피그마 스타일)** 기반으로 전면 리뉴얼 되었습니다.
이 문서는 새로운 디자인 시스템을 기존 Next.js 코드베이스(`src/`)에 매끄럽게 이식하기 위한 가이드라인입니다.

## 📌 핵심 레퍼런스
루트 폴더에 있는 **`DESIGN_PREVIEW.html`** 파일을 분석해 주세요. 
이 파일 안에는 모든 화면(홈, 캘린더, 알림, 프로필, 모달)에 대한 Tailwind CSS 클래스와 HTML 구조가 완벽하게 짜여 있습니다. 이를 React 컴포넌트로 분리하여 적용해 주시면 됩니다.

---

## 1. 디자인 토큰 업데이트 (`src/styles/tokens.css`)
기존 토큰을 피그마 감성에 맞게 아래 수치로 교체해야 합니다.

```css
/* 메인 브랜드 컬러 변경 */
--brand-blue: #5A32FA; /* 기존 #0084CC 에서 변경 */
--color-primary: var(--brand-blue);

/* 서피스(배경) 변경 */
--color-canvas-parchment: #FAFAFD; 

/* 둥글기 및 그림자 강조 */
--radius-card: 24px;
```

## 2. 전역 스타일 및 애니메이션 (`src/app/globals.css`)
`DESIGN_PREVIEW.html`의 `<style>` 태그에 있는 다음 항목들을 `globals.css`에 추가해 주세요.
- `.blob-1`, `.blob-2`, `.blob-3` (배경 그라데이션 원형 그래픽)
- 탭 전환 및 모달이 올라오는 애니메이션 (`@keyframes slideUp`, `fadeIn` 등)
- `::-webkit-scrollbar { display: none; }` (스크롤바 숨김 처리)

## 3. 주요 컴포넌트 변환 가이드 (React/Tailwind)

`DESIGN_PREVIEW.html`의 코드를 참조하여 아래 컴포넌트들을 업데이트해 주세요.

### A. `src/app/home/page.tsx` (대시보드)
- 상단 뷰 토글(월간/주간/일간)을 Pill-shape의 둥근 UI로 변경.
- **오늘 자녀 일정 요약 카드**: 보라색 배경(`bg-brand`)과 SVG를 활용한 **원형 프로그레스 바(Circular Progress)** UI로 교체.
- 배경 블롭 요소를 `#app-shell` 내부 또는 루트 레이아웃에 배치 (`<div className="blob-1"></div>` 등).

### B. `src/components/ui/Card.tsx` (일정 카드)
- 카드의 모서리를 둥글게(`rounded-[20px]`)하고 부드러운 그림자(`shadow-[0_8px_30px_rgba(90,50,250,0.06)]`)를 적용.
- 좌측에 위치하던 일정 타입 바(type-bar) 대신, **둥근 파스텔톤 배경의 아이콘**으로 시각적 요소 교체.

### C. `src/components/layout/BottomNav.tsx` (하단 바 및 FAB)
- 하단 바를 화면 바닥에서 살짝 띄우고 모서리를 크게 둥글림 (`rounded-[32px] mb-8`).
- 정중앙 상단으로 튀어나온 **플로팅 액션 버튼(FAB)** 추가 (보라색 원형, `+` 아이콘, 강한 그림자).
- 각 탭(홈, 캘린더 등) 아이콘 클릭 로직과 활성화 색상(`text-brand`) 연동.

---

> **To Claude**: 이 문서와 `DESIGN_PREVIEW.html`의 마크업을 바탕으로, 기존 비즈니스 로직(상태 관리, Supabase 연동 등)은 그대로 유지하면서 **UI/UX(className 및 태그 구조)만** 피그마 스타일로 안전하게 교체해 주시기 바랍니다. 화이팅!
