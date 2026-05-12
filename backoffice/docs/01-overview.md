# 01. 백오피스 시스템 개요 (Overview)

## 목적

글리움(Gleaum) 서비스의 운영자가 회원/공간 현황을 파악하고, CRM 마케팅을 집행하며, 광고 배너를 통합 관리하는 **전용 관리자 인터페이스**입니다. 기존 사용자 앱(`www.gleaum.com`)과 완전히 분리된 독립 서비스로 운영됩니다.

---

## 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 15.1.6 (App Router) | 기존 사용자 앱(Next.js 16)과 별도 버전 |
| 스타일링 | Tailwind CSS v4 | shadcn/ui 스타일 수동 구현 방식 |
| UI 컴포넌트 | lucide-react (아이콘) | shadcn 패키지 설치 없이 수동 구현 |
| 백엔드/DB | Supabase | 기존 사용자 앱과 동일한 Supabase 프로젝트 공유 |
| 배포 플랫폼 | Vercel | Root Directory: `backoffice` |
| 언어 | TypeScript 5 | |

---

## 레포지토리 내 위치

```
gleaum-app/                     ← GitHub 레포지토리 루트
├── src/                        ← 기존 사용자 앱 소스 (건드리지 말 것!)
├── docs/                       ← 기존 사용자 앱 문서 (건드리지 말 것!)
└── backoffice/                 ← 백오피스 서브프로젝트 (이 폴더가 전부)
    ├── docs/                   ← 백오피스 전용 문서 (현재 폴더)
    └── src/
        ├── app/                ← Next.js App Router 페이지들
        ├── components/         ← 공통 컴포넌트 (Sidebar 등)
        └── lib/                ← 유틸 및 DB 클라이언트
```

---

## 메뉴 구조 및 라우트

```
/           → 대시보드 (KPI 카드, 차트)
/users      → 회원 관리 (Supabase profiles 테이블)
/spaces     → 공간 관리 (Supabase family_groups 테이블)
/campaigns  → CRM 캠페인 빌더 (5채널 발송 + 초개인화)
/ads        → 광고 매니저 (GAM 전략 + 딥링크 + 앱 목업)
/settings   → 시스템 설정 (외부 API 키 관리)
```

---

## 핵심 설계 결정 사항

1. **공유 DB**: 기존 사용자 앱과 동일한 Supabase 프로젝트를 사용. 별도 DB 생성 없음.
2. **shadcn/ui 패키지 미설치**: 백오피스 UI는 Tailwind CSS 클래스를 이용해 shadcn/ui 스타일을 수동으로 구현함. `shadcn add` 명령어를 쓰면 구조가 깨질 수 있으므로 금지.
3. **독립 배포**: Vercel에서 `gleaum-app` 레포지토리를 `Root Directory: backoffice`로 별도 Import하여 독립 프로젝트로 배포.
4. **관리자 인증 미구현(현재)**: 현재 인증 없이 URL 직접 접근 가능. Phase 4에서 Supabase Auth + `is_super_admin` 기반 인증 추가 예정.
