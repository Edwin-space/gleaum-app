# 03. 디자인 시스템 (Design System)

> **🚨 Single Source of Truth (SSOT)**
> 본 문서는 요약본입니다. 실제 CSS 변수 및 구체적인 디자인 토큰(Hex 코드, 패딩, 그림자 등)은 루트 디렉토리의 **`DESIGN.md`** 및 **`design-system-ui.html`**을 최우선으로 준수해야 합니다.
> 구버전의 테마였던 'Vibrant Purple(`#5A32FA`)'은 완전히 폐기되었습니다.

---

## 1. 디자인 콘셉트

**"Premium Glassmorphism & Vibrant Network"** 

- **글래스모피즘 (Glassmorphism)**: 앱 전반에 걸쳐 반투명한 블러 효과(`backdrop-filter: blur(24px)`)와 흰색 반투명 테두리(`rgba(255, 255, 255, 0.5)`)를 사용하여 맑고 투명한 느낌을 줍니다.
- **부드러운 곡선**: 모든 카드(`24px`), 모달(`32px`), 버튼(`9999px`)에 큰 곡률을 적용하여 부드럽고 친근한 사용자 경험(UX)을 제공합니다.
- **오리지널 컬러**: 낡은 단색 테마를 벗어나 Brand Green, Teal, Blue가 융합된 생동감 있는 그래디언트 기반 환경을 제공합니다.

---

## 2. 핵심 컬러 시스템 (요약)

자세한 Hex 코드 및 CSS 변수(`var(...)`)는 `DESIGN.md` 참조.

| 명칭 | 용도 및 의미 |
|------|-------------|
| **Brand Green** | 완료 상태, 긍정 피드백, 자녀/그룹 목표 일정 (성장과 달성) |
| **Brand Teal** | 포커스 상태, 개인 일정, 보조 액션 (차분함과 집중) |
| **Brand Blue** | **Primary Action**, 공유 일정, 1회성 초대 모임 (연결과 신뢰) |
| **Brand Gradient** | 앱 히어로 영역, 메인 플로팅 액션 버튼(FAB) 등 핵심 하이라이트 |

---

## 3. 타이포그래피

현대적이고 가독성 높은 폰트 스택을 사용합니다.

| 폰트 | CSS 변수 | 용도 |
|------|-----------|------|
| **Outfit** | `var(--font-sans)` | 영문, 숫자, 헤더 타이틀, 시간 표기 (모던함) |
| **Pretendard** | `var(--font-kr)` | 한국어 본문, 설명 텍스트 (완벽한 가독성) |

- **가독성 계층**:
  - `Header 1`: `28px` / `Font Weight: 700`
  - `Body 1`: `16px` / `Font Weight: 500`
  - `Caption`: `13px` / `Font Weight: 400` / Color: `var(--gray-4)`

---

## 4. 핵심 UI 컴포넌트

모든 컴포넌트는 `DESIGN.md`의 스펙을 따라 CSS로 직접 구현되어야 합니다. (Tailwind를 사용할 경우에도 임의의 값을 넣지 않고 토큰을 활용합니다.)

1. **글래스 카드 (Glass Card)**
   - 배경: `rgba(255, 255, 255, 0.7)`
   - 블러: `blur(24px)`
   - 라운딩: `24px`
2. **Pill 버튼 (Primary/Secondary)**
   - 높이 `56px` (또는 `48px`), 완벽한 반원 라운딩 (`9999px`)
3. **입력 필드 (Input)**
   - 배경 `#F5F5F3`, 포커스 시 테두리 `var(--teal)`
4. **Bottom Navigation & FAB**
   - 하단 네비게이션은 플로팅된 글래스모피즘 바(`max-width: 400px`)
   - FAB(Floating Action Button)는 중앙 상단으로 돌출되며 Brand Blue 배경 사용

---

## 5. 애니메이션 및 인터랙션

화면 전환과 요소 등장에 부드럽고 생동감 있는 애니메이션을 적용합니다.

- **`slideUp`**: 0.4초 / 모달 및 바텀 시트 등장
- **`fadeIn`**: 0.3초 / 페이지 전환 및 리스트 아이템 순차 등장
- **버튼 Hover/Active**: 클릭 시 살짝 작아지는 스케일 애니메이션(`transform: scale(0.96)`) 적용
