# 01. 프로젝트 개요

## 서비스 정보

| 항목 | 내용 |
|------|------|
| **서비스명** | 글리움 (Gleaum) |
| **슬로건** | 나, 그리고 연인/가족의 일상 네트워크 |
| **플랫폼** | **PC Web / Mobile Web / PWA** (iOS, Android 앱 전환 가능) |
| **타겟** | 개인, 연인, 가족 모두를 아우르는 일상 네트워크 관리자 |
| **런타임** | 실서비스 목표 |

---

## 핵심 가치

글리움은 **개인과 관계 중심**의 일상 네트워크 서비스입니다. 단순한 캘린더가 아니라:

- 개인의 루틴, 일정, 지출을 한 공간에서 관리
- 연인 또는 가족 전체가 공유하는 일정과 개인 일정을 프리미엄 UI에서 한 화면에 관리
- 관계별 Space(개인/연인/가족/그룹)를 통해 누가 무엇을 함께 보고 관리할지 분리
- 교육비·공과금·공동 지출 등 정기지출을 개인/연인/가족 Space별로 정리
- 완료 확인이 필요한 일정을 자동 추적하고 필요한 사람에게 재알림
- **프리미엄 디자인**: Glassmorphism과 Mesh Gradient를 통한 감성적이고 세련된 사용자 경험

> 상세 제품 모델은 `docs/12-product-model.md`를 기준으로 합니다.

---

## 현재 일정 유형 4가지

| 유형 | 설명 | 테마 |
|------|------|------|
| **공유일정** (shared) | 관계 전체가 함께하는 일정 (여행, 외식 등) | `#0084CC` 블루 |
| **개인일정** (personal) | 개인 일정 (치과, 미용실 등) | `#0CC9B5` 틸 |
| **자녀일정** (child) | 자녀 학원·활동 일정 (부모가 등록, 완료 확인) | `#2EE895` 그린 |
| **정기지출** (expense) | 매월 반복되는 지출 (학원비, 공과금, 구독료 등) | `#F59E0B` 앰버 |

---

## 향후 일정 모델 방향

현재 `schedule.type`은 호환성을 위해 유지하지만, 장기적으로는 아래 축으로 분리합니다.

| 축 | 예시 | 의미 |
|----|------|------|
| Space | personal, couple, family, group | 일정이 속한 관계/공간 |
| Category | event, task, care, expense, anniversary, routine | 일정의 성격 |
| Visibility | private, space, selected | 누가 볼 수 있는지 |
| Automation Policy | reminder_only, completion_required, payment_due | 자동 알림/상태 전이 방식 |

---

## 완료 확인 일정 상태 흐름

```
대기중(pending) → 진행중(in_progress) → 완료(completed)
                                       → 미완료(missed)
```

- 개인 루틴, 가족 케어, 자녀 일정, 심부름처럼 완료 확인이 필요한 일정에 적용
- 일정 시작 시각이 되면 자동으로 `in_progress`
- 담당자가 완료 처리하지 않으면 `missed`
- 미완료 시 담당자/관찰자/Space 멤버 등 규칙에 맞는 대상에게 재알림 발송

---

## 사용자 / Space 역할

| 역할 | 설명 |
|------|------|
| `owner` | Space 생성/관리자 |
| `partner` | 연인 Space 구성원 |
| `parent` | 가족 Space 보호자 |
| `child` | 가족 Space 자녀 — 본인 일정 확인 및 완료 처리 |
| `member` | 일반 그룹 구성원 |
| `guest` | 제한 접근 사용자 |

---

## 수익 모델 (계획)

- 무료: 개인 Space + 기본 공유 Space
- 프리미엄 (월 3,900원): 복수 Space, Google Calendar 완전 동기화, 파일 첨부, 고급 자동화/통계

---

## 인프라 비용 (현재 무료)

| 서비스 | 플랜 | 비용 |
|--------|------|------|
| Vercel | Hobby | 무료 |
| Supabase | Free | 무료 |
| Google APIs | 무료 할당량 내 | 무료 |
| GitHub | Free | 무료 |

---

## 현재 구현 현황 (2026-05-04 기준)

| 분류 | 내용 |
|------|------|
| 배포 URL | https://gleaum-app.vercel.app |
| 인증 | Google OAuth 2.0 ✅ |
| 데이터 | Supabase 실 DB 연동 ✅ |
| 일정 CRUD | 생성 / 조회 / 수정 / 삭제 / 상태변경 ✅ |
| 캘린더 뷰 | 월간 / 주간(타임라인) / 일간 ✅ |
| 알림 | FCM 푸시 + Supabase pg_cron 리마인더 ✅ |
| PWA | Service Worker + 설치 배너 (iOS/Android) ✅ |
| 토스트 시스템 | sonner 기반 전체 적용 ✅ |
| **PC 대시보드** | **1024px 이상 → 사이드바 + 멀티컬럼 그리드 자동 전환 ✅** |
