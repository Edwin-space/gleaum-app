# 🎨 Gleaum (글리움)

> **"나의 일상부터, 우리가 연결되는 순간까지"**
> 개인의 스마트한 일정 관리부터 1회성 모임, 연인, 가족과의 실시간 동기화까지 지원하는 유연한 일상 네트워크 플랫폼

## 1. 프로젝트 비전 (Project Vision)

과거의 '글리움'이 가족을 위한 단순 기록 보관소(Archive)였다면, 새로운 글리움은 **관계의 밀도를 높이는 실시간 연결 플랫폼**입니다.

- **개인 사용자**: 나의 일상을 관리하고, 지인/친구에게 특정 모임 일정을 **1회성 공유 링크**로 간편하게 전달합니다.
- **연인 및 가족**: 복잡한 일상을 선명하게 시각화하여, 서로의 상황을 묻기 전에 아는 "시차 없는 동기화"를 제공합니다.

### 🌟 Brand Identity
- **Gleam (비춤)**: 복잡한 일상을 선명하게 시각화 (Visibility)
- **글 (Writing)**: 정성스럽게 기록하고 확정하는 신뢰의 언어 (Commitment)
- **-ium (공간)**: 우리의 시간이 하나로 연결되어 머무는 디지털 광장 (Synchronized Space)

---

## 2. 핵심 기능 (Core Features)

1. **관계형 일정 네트워크**
   - 개인 일정, 1회성 초대(친구/모임), 연인/가족 공유 일정의 완벽한 분리 및 통합 뷰
2. **프리미엄 UI/UX (Glassmorphism)**
   - Green / Teal / Blue 톤의 생동감 있는 오리지널 컬러 시스템
3. **확장된 동기화 솔루션 (예정)**
   - Google Calendar 클라우드 동기화
   - **OS Native Calendar (스마트폰 기본 캘린더)** 권한 획득을 통한 로컬 캘린더 연동
4. **알림 및 리마인더**
   - 일정 상태(대기/진행/완료)에 따른 FCM 푸시 알림 및 재알림

---

## 3. 기술 스택 (Tech Stack)

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend & DB**: Supabase (PostgreSQL), Prisma (옵션)
- **Deployment**: Vercel
- **Design System**: 자체 구축 (Green/Teal/Blue Token)

---

## 4. 개발자 가이드 (Developer Guide)

> 🚨 이 프로젝트에 참여하는 모든 개발자 및 AI 에이전트는 기여 전 반드시 아래 문서를 확인해야 합니다.

- `DESIGN.md` : 프로젝트 마스터 디자인 명세서 (CSS/UI 토큰 SSOT)
- `docs/10-ai-handoff-guide.md` : 프로젝트 DB 원칙 및 인수인계 가이드라인
- `design-system-ui.html` : 로컬 브라우저에서 실행 가능한 UI 컴포넌트 시각 레퍼런스

## 5. 실행 방법 (Getting Started)

```bash
# 종속성 설치
npm install

# 환경 변수 설정 (.env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 로컬 서버 실행
npm run dev
```

열기: [http://localhost:3000](http://localhost:3000)
