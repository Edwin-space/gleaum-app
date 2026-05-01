# 🎨 Gleaum (글리움) Design System: Master Specification

> **🚨 Single Source of Truth (SSOT)**: 모든 개발자와 AI 에이전트는 UI 컴포넌트 추가, 수정 시 이 문서를 최우선으로 준수해야 합니다.
> 이전의 임시 컬러였던 'Vibrant Purple(`#5A32FA`)'은 **완전히 폐기**되었습니다. 절대 사용하지 마십시오.
> 시각적 레퍼런스: `design-system-ui.html`을 브라우저로 열어 모든 컴포넌트의 실제 렌더링을 확인하세요.

---

## 1. Brand Identity & Philosophy

**"나, 그리고 연인/가족의 일상 네트워크"**
> "우리의 시차를 없애는 가장 스마트한 방법, 실시간 시간 공유."

글리움(Gleaum)은 일상을 동기화하고 관계의 밀도를 높이는 '실시간 연결 플랫폼'입니다. 브랜드 명칭은 다음의 핵심 가치를 담고 있습니다:

- **Gleam (비춤 = Visibility)**: 복잡한 일상을 선명하게 시각화하여 서로의 상황을 한눈에 파악
- **글 (Writing = Commitment)**: 함께할 시간을 정성스럽게 기록하고 확정하는 신뢰의 언어
- **-ium (이음/공간 = Synchronized Space)**: 나, 연인, 가족의 시간이 하나로 연결되어 함께 머무는 디지털 광장

### Brand Manifesto
> 세상의 수많은 소셜 네트워크는 '타인'에게 보여주는 것에 집중합니다.
> 하지만 글리움은 내 곁의 '가장 소중한 사람'에게 집중합니다.
> 각자의 할 일을 명확히 기록하고, 서로의 빈자리를 따뜻하게 조명하는 공간.
> 글리움에서 우리의 시간은 비로소 하나의 이야기가 됩니다.

### UX/UI Concept
'Gleam'의 가치를 반영하여, 프리미엄 글래스모피즘(Glassmorphism)과 생동감 있는 오리지널 컬러(Green/Teal/Blue)를 결합합니다. 공유된 일정이 빛나는 듯한 'Highlight' 연출과 직관적인 스케줄 뷰를 통해 사용자에게 심리적 안정감과 **"묻지 않아도 아는 배려"**를 제공합니다.

---

## 2. Color System

앱의 모든 인터랙티브 요소와 배경은 아래의 컬러 토큰(`src/styles/tokens.css`)을 엄격하게 따릅니다.
**임의의 Hex 코드를 직접 하드코딩하지 마세요.**

### 2.1. Brand Palette
| Name | Hex | CSS Variable | Role & Usage |
| :--- | :--- | :--- | :--- |
| **Brand Green** | `#2EE895` | `--brand-green` | 완료(Completed), 긍정적 상태(Success), 그룹 목표/자녀 일정 |
| **Brand Teal** | `#0CC9B5` | `--brand-teal` | 포커스 링(Focus), 보조 액션(Secondary), 개인 일정 (프라이버시) |
| **Brand Blue** | `#0084CC` | `--color-primary` | **Primary Action**, 핵심 버튼, 공유 일정 (연인/가족), 1회성 외부 초대 모임 |
| **Brand Navy** | `#1A1B2E` | `--brand-navy` | **Primary Text** (가장 어두운 텍스트 색상) |
| **Brand Black** | `#0A0A0A` | `--brand-black` | 극대화된 대비 요소 (모달 오버레이 등) |

### 2.2. Brand Gradient
```css
background: linear-gradient(135deg, #2EE895 0%, #0CC9B5 50%, #0084CC 100%);
/* CSS Variable: var(--brand-gradient) */
```

### 2.3. Schedule Type Colors (일정 유형별)
| Type | Hex | Icon BG (10% opacity) |
| :--- | :--- | :--- |
| 공유 (Shared) | `#0084CC` | `rgba(0, 132, 204, 0.10)` |
| 개인 (Personal) | `#0CC9B5` | `rgba(12, 201, 181, 0.10)` |
| 자녀 (Child) | `#2EE895` | `rgba(46, 232, 149, 0.10)` |
| 지출 (Expense) | `#F59E0B` | `rgba(245, 158, 11, 0.10)` |

### 2.4. Status Colors (상태별)
| Status | Hex | Text Color |
| :--- | :--- | :--- |
| 대기중 (Pending) | `#AEAEA8` | White |
| 진행중 (In Progress) | `#0084CC` | White |
| 완료 (Completed) | `#2EE895` | Brand Black |
| 미완료 (Missed) | `#EF4444` | White |

### 2.5. Backgrounds & Surfaces
| Name | Value | Usage |
| :--- | :--- | :--- |
| Canvas Parchment | `#FAFAFD` | 앱 기본 배경색 (순백색이 아님) |
| Glass Surface | `rgba(255, 255, 255, 0.65)` | 카드/헤더/모달 배경. **`backdrop-filter: blur(24px)` 필수** |
| Hairline Border | `rgba(255, 255, 255, 0.8)` | 글래스 카드의 빛 반사 테두리 |
| Neutral Gray 100 | `#F5F5F3` | Input 기본 배경 |
| Neutral Gray 200 | `#E8E8E4` | 구분선, 비활성 요소 |
| Neutral Gray 400 | `#AEAEA8` | Caption, Muted 텍스트 |
| Neutral Gray 600 | `#6E6E66` | Secondary 텍스트 |
| Muted Text | `#8E8E93` | 시간 표시, 부가 정보 |

---

## 3. Typography

### 3.1. Font Stack
- **Korean (Primary)**: `Pretendard`
- **English / Numbers / Display**: `Outfit`
- **Full Stack**: `'Pretendard', 'Outfit', system-ui, -apple-system, sans-serif`

### 3.2. Type Scale
| Level | Size | Weight | Letter Spacing | Color | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | 26px | 700 | `-0.02em` | Navy | 페이지 최상단 제목 |
| **Card Title** | 18–20px | 700 | `-0.01em` | Navy | 카드 내부 제목 |
| **Section Title** | 17px | 700 | Tight | Navy | 섹션 소제목 |
| **Body** | 16px | 400 | Normal | Navy / Gray 600 | 본문 텍스트 |
| **Caption / Time** | 13px | 600 | Normal | Gray 400 | 시간, 부가 정보 |
| **Micro / Label** | 10–11px | 600 | `0.06em` uppercase | Gray 600 | 탭, 네비 라벨 |

---

## 4. Spacing & Grid

### 4.1. 4px Base Grid
모든 여백(Margin, Padding)은 **4px의 배수**만 사용합니다.

| Token | Value | Tailwind | Usage |
| :--- | :--- | :--- | :--- |
| `xxs` | 4px | `p-1` | 아이콘 내부 여백 |
| `xs` | 8px | `p-2` | 배지 패딩, 좁은 간격 |
| `sm` | 12px | `p-3` | 카드 내부 작은 패딩 |
| `md` | 16px | `p-4` | 카드 기본 패딩, 아이템 간격 |
| `lg` | 20px | `px-5` | **화면 좌우 기본 패딩** |
| `xl` | 24px | `p-6` | 카드 넉넉한 패딩 |
| `2xl` | 32px | `p-8` | 섹션 간 간격 |
| `3xl` | 48px | `p-12` | 페이지 최상단 여백 |

### 4.2. Border Radius System
| Token | Value | Usage |
| :--- | :--- | :--- |
| `radius-sm` | 8px | 작은 요소 |
| `radius-input` | 16px | Input, Textarea |
| **`radius-card`** | **24px** | **모든 카드 (★ 가장 중요)** |
| `radius-nav` | 32px | BottomNav, 모달 상단 |
| `radius-pill` | 9999px | 버튼, 배지, FAB |

---

## 5. Component Library

### 5.1. Buttons (Pill Shape)
모든 버튼은 `border-radius: 9999px`, 최소 높이 **44px** (터치 영역 확보).

| Variant | Background | Text | Shadow |
| :--- | :--- | :--- | :--- |
| **Primary** | `#0084CC` | White | `0 4px 14px rgba(0,132,204,0.25)` |
| **Secondary (Teal)** | `#0CC9B5` | White | `0 4px 14px rgba(12,201,181,0.2)` |
| **Success (Green)** | `#2EE895` | Navy | `0 4px 14px rgba(46,232,149,0.2)` |
| **Gradient** | `var(--brand-gradient)` | White | `var(--shadow-fab)` |
| **Outline** | Transparent | Blue | `border: 2px solid #0084CC` |
| **Ghost** | Transparent | Blue | None |
| **Danger** | `#FEE2E2` | `#DC2626` | None |
| **Disabled** | `#E8E8E4` | `#AEAEA8` | None, `pointer-events: none` |

**Button Sizes:**
| Size | Height | Font Size | Padding |
| :--- | :--- | :--- | :--- |
| Small | 32px | 13px | `0 16px` |
| **Medium (Default)** | **44px** | **15px** | **`0 24px`** |
| Large | 52px | 17px | `0 32px` |

**Button States:**
| State | Transform | Opacity | Transition |
| :--- | :--- | :--- | :--- |
| Default | None | 1.0 | — |
| Hover | `translateY(-1px)` | 0.92 | `0.15s ease` |
| Active/Pressed | `scale(0.96)` | 1.0 | `0.15s ease` |
| Disabled | None | 0.5 | — |

### 5.2. Badges & Tags
모든 배지는 `border-radius: 9999px`, `font-size: 11px`, `font-weight: 600`.

- **Type Badges**: 배경색 = 일정 유형 컬러의 **12% opacity**, 텍스트 = 해당 컬러
- **Status Badges**: 배경색 = Solid 상태 컬러, 텍스트 = White (완료만 Black)

### 5.3. Glassmorphism Cards
```css
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 132, 204, 0.08);
}
```

**Card Variants:**
| Variant | Background | Usage |
| :--- | :--- | :--- |
| **Glass (Default)** | `rgba(255,255,255,0.65)` + blur | 일정 목록, 알림, 설정 |
| **Dark** | `rgba(26,27,46,0.9)` + blur | 자녀 요약, 강조 정보 |
| **Gradient** | `var(--brand-gradient)` | Hero 카드, 가계부 요약 |

### 5.4. Schedule Item (일정 아이템)
```
[48px 원형 아이콘] [16px gap] [Title 16px Bold + Time 13px SemiBold]
└─ bg: 유형별 컬러 10%            └─ 자녀 일정인 경우 우측에 StatusBadge
└─ icon stroke: 2.5px round
```
- Container: `bg-white`, `border-radius: 20px`, `padding: 16px`
- Shadow: `0 4px 20px rgba(0, 132, 204, 0.04)`

### 5.5. Inputs & Forms
| State | Background | Border | Shadow |
| :--- | :--- | :--- | :--- |
| Default | `#F5F5F3` | Transparent | None |
| **Focus** | `#FFFFFF` | **`2px solid #0CC9B5`** | `0 0 0 4px rgba(12,201,181,0.1)` |
| Error | `#FEF2F2` | `2px solid #EF4444` | None |

- Radius: **16px**
- Padding: `14px 20px`
- Label: `13px`, `font-weight: 600`, `margin-bottom: 6px`

### 5.6. Chip Selector (일정 유형 선택)
- Active: Primary Button (Small) 스타일
- Inactive: `bg: Gray 100`, `color: Gray 600`, Pill shape

---

## 6. Navigation

### 6.1. AppHeader
- Height: **56px**
- Background: `rgba(255, 255, 255, 0.8)` + `backdrop-filter: blur(20px)`
- Border-bottom: `1px solid rgba(0, 132, 204, 0.06)`
- Position: `sticky top-0 z-40`
- Back button: 36×36px 원형 터치 영역

### 6.2. Bottom Navigation (Floating)
- Position: 바닥에서 **32px** 띄움 (`pb-8`)
- Container: `height: 68px`, `border-radius: 32px`, Glass 배경
- Max-width: `430px` (앱 셸 폭에 맞춤)
- Nav icon: Active = `#0084CC`, Inactive = `#8E8E93`
- Nav label: `10px`, `font-weight: 600`

### 6.3. FAB (Floating Action Button)
- Size: **60×60px**, 완벽한 원형
- Position: 네비 바 중앙에서 **위로 26px 돌출** (`absolute -top-7`)
- Background: `var(--brand-gradient)`
- Shadow: `0 8px 24px rgba(12, 201, 181, 0.4)`
- Icon: `+` (28px, stroke-width: 2.8)

---

## 7. Modal & Bottom Sheet

- Overlay: `rgba(26, 27, 46, 0.3)` + `backdrop-filter: blur(4px)`
- Sheet: `bg-white`, `border-radius: 24px 24px 0 0`
- Handle bar: `48×5px`, `bg: Gray 200`, `border-radius: 99px`, 중앙 정렬
- Animation: `slideUp` — `0.3s cubic-bezier(0.16, 1, 0.3, 1)`
- Shadow: `0 -10px 40px rgba(0, 0, 0, 0.1)`

---

## 8. Iconography

- **Style**: Lucide icon set 기반 (Outline, Round)
- **Stroke width**: **2.5px** (BottomNav, 일정 아이콘) / **2.2px** (헤더 내 아이콘)
- **Stroke linecap**: `round`
- **Stroke linejoin**: `round`
- **ViewBox**: `0 0 24 24`
- **Container**: 48×48px 원형 배경 (해당 일정 유형 컬러의 10% opacity)

---

## 9. Animations & Transitions

| Animation | Duration | Easing | Usage |
| :--- | :--- | :--- | :--- |
| `fadeInUp` | 0.3s | `ease` | 페이지 진입, 카드 등장 |
| `fadeIn` | 0.2s | `ease` | 탭 전환 |
| `slideUp` | 0.35s | `cubic-bezier(0.16, 1, 0.3, 1)` | 모달/바텀시트 등장 |
| `float` | 20s | `cubic-bezier(0.4, 0, 0.2, 1)` | 배경 Blob 움직임 |
| Button press | 0.15s | `ease` | `scale(0.96)` |

---

## 10. Accessibility

- **Touch Target**: 모든 클릭 가능 요소는 최소 **44×44px** 터치 영역 확보
- **Scrollbar**: 전역 숨김 (`::-webkit-scrollbar { display: none }`)
- **Korean Line Break**: `word-break: keep-all; overflow-wrap: break-word`
- **App Shell**: `max-width: 430px` 모바일 중심 레이아웃

---

## 11. Shadow System

| Token | Value | Usage |
| :--- | :--- | :--- |
| `shadow-card` | `0 8px 32px rgba(0, 132, 204, 0.08)` | Glass 카드 |
| `shadow-fab` | `0 8px 24px rgba(12, 201, 181, 0.40)` | FAB 버튼 |
| `shadow-modal` | `0 -10px 40px rgba(0, 0, 0, 0.10)` | 바텀시트 |
| `shadow-btn` | `0 4px 14px rgba(0, 132, 204, 0.25)` | Primary 버튼 |

> **⚠️ 절대 검은색(`rgba(0,0,0,...)`) 그림자를 카드나 버튼에 사용하지 마세요.** 브랜드 컬러(Blue/Teal)가 섞인 컬러 그림자만 사용합니다.

---

## 12. Mesh Gradient Backgrounds (Blobs)

앱 배경에 배치되는 3개의 애니메이션 Blob:
```css
.mesh-blob-1 { top: -10%; left: -10%; width: 400px; height: 400px; background: #2EE895; }
.mesh-blob-2 { top: 30%; right: -20%; width: 500px; height: 500px; background: #0CC9B5; }
.mesh-blob-3 { bottom: -10%; left: 0%; width: 450px; height: 450px; background: rgba(0, 132, 204, 0.6); }
/* filter: blur(90px); opacity: 0.5; animation: float 20s infinite alternate; */
```

---

> **To AI Agents**: 새로운 화면이나 컴포넌트를 설계할 때는 이 명세서의 토큰과 규칙을 그대로 복사하여 사용하십시오.
> Tailwind arbitrary values(`[]`)를 사용할 때는 이 문서에 정의된 색상/수치와 100% 일치해야 합니다.
> 시각적 레퍼런스가 필요하면 `design-system-ui.html`을 브라우저에서 열어 확인하세요.
