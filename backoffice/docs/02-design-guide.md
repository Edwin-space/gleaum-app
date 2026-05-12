# 02. 백오피스 디자인 가이드 (Design Guide)

> 이 가이드는 백오피스 전용입니다. 기존 사용자 앱의 `DESIGN.md` 및 `docs/03-design-system.md`와는 별개로 운영됩니다.

---

## 1. 디자인 철학

백오피스는 **운영자의 생산성**을 최우선으로 합니다.
- ❌ 화려한 애니메이션, 그라디언트, 커스텀 색상 시스템 → 금지
- ✅ shadcn/ui 표준 스타일의 심플하고 일관된 흑백 톤 관리자 UI → 원칙

---

## 2. CSS 방식

**Tailwind CSS v4를 사용하며, shadcn/ui 스타일을 수동으로 구현합니다.**

```css
/* globals.css에 정의된 CSS 변수 기반 테마 */
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
--card: oklch(1 0 0);
--primary: oklch(0.205 0 0);    /* 거의 검정색 */
--muted: oklch(0.961 0 0);
--accent: oklch(0.961 0 0);
--border: oklch(0.922 0 0);
```

**shadcn/ui 패키지를 설치하지 않으므로**, 아래처럼 Tailwind 클래스를 직접 조합해서 컴포넌트를 구현합니다.

```tsx
/* 버튼 예시 */
<button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-9 px-4 text-sm font-medium hover:bg-primary/90 transition-colors">
  버튼 텍스트
</button>

/* 카드 예시 */
<div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
  ...
</div>

/* 테이블 예시 */
<table className="w-full caption-bottom text-sm">
  <thead><tr className="border-b">...</tr></thead>
  <tbody><tr className="border-b transition-colors hover:bg-muted/50">...</tr></tbody>
</table>
```

---

## 3. 레이아웃 구조

```
RootLayout (layout.tsx)
├── <Sidebar />          ← 고정 좌측 사이드바 (w-64)
└── <main>               ← 우측 스크롤 가능한 메인 콘텐츠
     └── [각 page.tsx]   ← 개별 페이지 (사이드바 코드 절대 포함 금지)
```

**각 page.tsx는 `<main className="p-8">` 태그로 시작하고 끝냅니다.**
사이드바 코드를 page.tsx에 직접 작성하지 마세요. 오직 `components/Sidebar.tsx`만 사용합니다.

---

## 4. 사이드바 메뉴 추가 방법

`backoffice/src/components/Sidebar.tsx` 파일의 `links` 배열에만 추가합니다.

```tsx
const links = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/users", label: "회원 및 공간 관리", icon: Users },
  // 여기에 새 메뉴 추가
  { href: "/new-page", label: "새 메뉴 이름", icon: SomeIcon },
];
```

---

## 5. 주요 컴포넌트 패턴 레퍼런스

### 섹션 헤더
```tsx
<header className="mb-8">
  <h1 className="text-3xl font-bold tracking-tight text-foreground">페이지 제목</h1>
  <p className="text-muted-foreground mt-1">부제목 설명</p>
</header>
```

### 데이터 테이블 (회원/공간 등)
- `rounded-xl border bg-card shadow-sm` 래퍼
- 상단: 검색 Input + 필터
- 테이블: `hover:bg-muted/50` 행 hover 효과
- 데이터 없을 시: `<td colSpan={n}>DB 연동 후 데이터가 표시됩니다.</td>`

### 상태 배지
```tsx
/* 완료 */
<span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">완료</span>
/* 미완료 */
<span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">미완료</span>
```

### 셀렉트 박스 / 인풋
```tsx
<input className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
```

---

## 6. 모바일 대응

백오피스는 기본적으로 **PC 화면(1280px 이상) 운영 환경을 기준**으로 합니다.
최소한의 반응형(`md:` 중단점)만 적용하며, 모바일 최적화는 우선순위가 낮습니다.
