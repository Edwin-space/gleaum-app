# 03. 디자인 시스템 (Premium UI Overhaul)

## 디자인 콘셉트

**"Premium Glassmorphism & Fluid Mesh Gradient"** — 프리미엄 리뉴얼 완료 (2026-04-30)

- **배경**: 정적인 블롭을 제거하고, 3가지 브랜드 컬러가 유기적으로 움직이는 **애니메이션 메쉬 그라디언트** 적용. 깊이감 있는 시각 경험 제공.
- **레이아웃**: 모든 카드는 투명한 유리 질감의 **Glassmorphism (`.glass-card`)** 스타일 적용.
- **타이포그래피**: 둔탁한 폰트에서 하이엔드 웹 서체인 **Outfit**과 **Pretendard** 조합으로 변경하여 자간과 가독성 극대화.
- **아이콘**: 조잡한 이모지 아이콘을 배제하고, 정교한 **SVG 라인 아이콘** 시스템으로 통일.

---

## 컬러 팔레트

### 브랜드 컬러 (`src/styles/tokens.css`)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--brand-blue` | `#0084CC` | 공유 일정, 주요 포인트, 메인 액션 |
| `--brand-teal` | `#0CC9B5` | 개인 일정, 서브 포인트 |
| `--brand-green` | `#2EE895` | 자녀 일정, 완료/긍정 상태 |
| `--color-ink` | `#1A1B2E` | 메인 텍스트 (깊은 네이비) |
| `--color-ink-muted-80` | `#333333` | 본문 텍스트 (가독성 최적화) |
| `--color-ink-muted-48` | `#6E6E66` | 보조 텍스트, 플레이스홀더 |
| `--brand-gradient` | `linear-gradient(135deg, #2EE895 0%, #0CC9B5 50%, #0084CC 100%)` | 히어로 카드/FAB/주요 버튼 |

### 일정 유형 컬러

| 유형 | 변수 | 값 |
|------|------|-----|
| 공유일정 | `--color-schedule-shared` | `#0084CC` 블루 |
| 개인일정 | `--color-schedule-personal` | `#0CC9B5` 틸 |
| 자녀일정 | `--color-schedule-child` | `#2EE895` 그린 |
| 정기지출 | `--color-schedule-expense` | `#F59E0B` 앰버 |

---

## 타이포그래피

| 서체 | 용도 | 적용 |
|------|------|------|
| **Outfit** | 영문, 숫자, 헤드라인 | `font-family: var(--font-display)` |
| **Pretendard** | 한국어 본문, 인터페이스 | `font-family: var(--font-body)` |

### 텍스트 가이드
- **자간(Letter Spacing)**: 시각적 밀도를 위해 `-0.01em` ~ `-0.03em` 적용.
- **페이지 타이틀**: `text-[36px] ~ [40px] font-bold tracking-tight`
- **카드 제목**: `text-[16px] font-bold`
- **본문**: `text-[14px] font-medium`

---

## 핵심 유틸리티

### Glassmorphism (`.glass-card`)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 132, 204, 0.08);
}
```

### Mesh Gradient (`.mesh-bg`)
배경에 3개의 거대한 블러 원(`mesh-blob`)이 천천히 회전하며 몽환적인 분위기를 연출합니다.

---

## 컴포넌트 규칙

### 카드 (Schedules, Notifications 등)
- 배경색 대신 `.glass-card` 클래스 사용.
- 모서리 곡률: `rounded-[24px]` 또는 `rounded-[20px]`.
- 클릭 인터랙션: `active:scale-[0.98] transition-all`.

### 버튼 (Primary)
- `background: var(--color-ink)` (네이비) 또는 `var(--brand-gradient)`.
- 강력한 그림자: `box-shadow: 0 12px 32px rgba(26, 27, 46, 0.2)`.
- 높이: 대형 버튼 `h-[64px]`, 일반 `h-[52px]`.

---

## 애니메이션 클래스

| 클래스 | 효과 | 용도 |
|--------|------|------|
| `.animate-fade-in-up` | 아래→위 페이드인 (0.4s) | 리스트 아이템 순차 등장 |
| `.animate-slide-up` | 아래에서 슬라이드업 (0.45s) | 모달, 바텀 시트 |
| `.mesh-bg` / `.mesh-blob` | 애니메이션 메쉬 배경 | `globals.css` — 로그인 페이지 전용 |

---

## BottomNav 구조

- **플로팅 글래스**: `.glass-card` 스타일 적용, `rounded-[32px]`.
- **FAB (중앙 버튼)**: 브랜드 그라디언트 적용, 화이트 라인 아이콘.
- **아이콘**: 활성 시 브랜드 컬러, 비활성 시 가독성이 확보된 그레이(`var(--color-ink-muted-48)`).
