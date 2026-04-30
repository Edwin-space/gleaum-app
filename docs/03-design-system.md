# 03. 디자인 시스템

## 디자인 콘셉트

**"Vibrant Purple & Soft Background"** — 피그마 기반 리뉴얼 완료 (2026-04-30)

- 밝고 부드러운 `#FAFAFD` 배경에 노랑/청록/보라 **블롭 그라디언트**
- 메인 포인트 컬러 **Vibrant Purple `#5A32FA`**
- 둥근 모서리, 부드러운 그림자, 파스텔 아이콘

참고 파일:
- `DESIGN_HANDOFF_TO_CLAUDE.md` — AI 디자인 인수인계 가이드
- `DESIGN_PREVIEW.html` — 인터랙티브 프로토타입 (브라우저에서 열어볼 것)

---

## 컬러 팔레트

### 브랜드 컬러 (`src/styles/tokens.css`)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#5A32FA` | 모든 인터랙티브 요소, 버튼, 활성 상태 |
| `--color-primary-light` | `#EBE5FF` | 보라 연한 배경, 아이콘 배경 |
| `--brand-navy` | `#1A1B2E` | 메인 텍스트 색상 |
| `--color-ink` | `#1A1B2E` | 본문 텍스트 |
| `--color-ink-muted-48` | `#8E8E93` | 보조 텍스트, 플레이스홀더 |
| `--color-canvas-parchment` | `#FAFAFD` | 전체 배경 |
| `--color-hairline` | `#E8E8E4` | 구분선, 테두리 |

### 일정 유형 컬러

| 유형 | 변수 | 값 |
|------|------|-----|
| 공유일정 | `--color-schedule-shared` | `#5A32FA` 보라 |
| 개인일정 | `--color-schedule-personal` | `#06B6D4` 청록 |
| 자녀일정 | `--color-schedule-child` | `#10B981` 에메랄드 |
| 정기지출 | `--color-schedule-expense` | `#F59E0B` 앰버 |

### 상태 컬러

| 상태 | 변수 | 값 |
|------|------|-----|
| 대기중 | `--color-status-pending` | `#AEAEA8` 회색 |
| 진행중 | `--color-status-progress` | `#5A32FA` 보라 |
| 완료 | `--color-status-done` | `#10B981` 에메랄드 |
| 미완료 | `--color-status-missed` | `#EF4444` 빨강 |

---

## 타이포그래피

| 폰트 | 용도 |
|------|------|
| **DM Sans** | 영문, 숫자, 헤드라인 |
| **Noto Sans KR** | 한국어 전용 (`fontFamily: "'Noto Sans KR', sans-serif"`) |

### 텍스트 크기 규칙
- 페이지 타이틀: `text-[26px] font-bold tracking-tight`
- 섹션 타이틀: `text-[18px] font-bold`
- 카드 제목: `text-[16px] font-bold`
- 본문: `text-[14px] font-semibold`
- 보조: `text-[13px]` color `#8E8E93`
- 미세: `text-[11px]` color `#8E8E93`

---

## 컴포넌트 규칙

### 카드
```
bg-white rounded-[20px] p-4
boxShadow: '0 8px 30px rgba(90,50,250,0.06)'
```

### 버튼 (Primary)
```
background: '#5A32FA'
boxShadow: '0 8px 24px rgba(90,50,250,0.35)'
borderRadius: rounded-full 또는 rounded-[20px]
font-bold text-white
```

### 입력 필드
```
bg-gray-50 rounded-2xl px-5 py-4
border border-transparent
focus:border-[#5A32FA]/30
```

### 배지
- `src/components/ui/Badge.tsx` 에 `TypeBadge`, `StatusBadge` 컴포넌트 존재

---

## 배경 블롭 (`globals.css`)

```css
.blob-1 { /* 노란색 — 좌상단 */ background: radial-gradient(circle, rgba(255,235,153,0.45) ...) }
.blob-2 { /* 청록색 — 우측 */ background: radial-gradient(circle, rgba(153,240,255,0.35) ...) }
.blob-3 { /* 보라색 — 좌하단 */ background: radial-gradient(circle, rgba(200,153,255,0.28) ...) }
```

`layout.tsx`에서 `#app-shell` 밖(body)에 배치됨.

---

## 그림자 클래스

| 클래스 | 값 | 용도 |
|--------|-----|------|
| `.shadow-card` | `0 8px 30px rgba(90,50,250,0.06)` | 일반 카드 |
| `.shadow-fab` | `0 8px 24px rgba(90,50,250,0.40)` | FAB 버튼 |
| `.shadow-modal` | `0 -10px 40px rgba(0,0,0,0.10)` | 모달/바텀시트 |

---

## 애니메이션 클래스

| 클래스 | 효과 |
|--------|------|
| `.animate-fade-in-up` | 아래→위 페이드인 (0.3s) |
| `.animate-slide-up` | 아래에서 슬라이드업 (0.35s, 모달용) |
| `.animate-fade-in` | 단순 페이드인 (0.2s) |

---

## BottomNav 구조

- **플로팅 pill** — `bg-white/92 backdrop-blur-20px rounded-[32px]`
- **FAB** — 중앙 상단 돌출, `background: #5A32FA`, `boxShadow: shadow-fab`
- **4개 탭** — 홈, 일정, (FAB), 가계부, 마이
- 활성 색상: `#5A32FA`, 비활성: `#8E8E93`
