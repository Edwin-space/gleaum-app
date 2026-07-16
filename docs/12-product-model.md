# 12. 제품 모델 재정의 — 개인 중심 + Space 확장형 토털 서비스

> 작성일: 2026-05-04
> 목적: 글리움을 기존 "가족 일정 관리 앱"에서 **개인을 기본 단위로 시작하고, Space를 통해 친구/연인/가족 등 관계를 확장하는 토털 라이프 관리 서비스**로 재정의하기 위한 기준 문서입니다.
> 이 문서는 향후 DB, API, UI, 자동화, 알림 설계의 상위 기준입니다.

---

## 1. 결론 요약

글리움의 최상위 중심은 **개인 사용자**입니다.

사용자는 먼저 개인 공간에서 자신의 일정, 루틴, 자금, 기록을 관리합니다. 이후 필요에 따라 친구, 연인, 가족, 모임 같은 **Space**를 만들어 관계 맥락을 확장합니다.

즉 글리움은 **Personal-first + Space-expanded** 서비스입니다. Space는 본체가 아니라 개인형 서비스 위에 얹히는 관계 확장 레이어입니다.

| 구간 | 예시 | 핵심 가치 |
|------|------|-----------|
| 개인 기본 구간 | 나의 일정, 루틴, 개인 지출, 메모 | 자기관리, 리마인드, 기록 |
| 친구 Space | 약속, 모임비, 여행 준비, 역할 분담 | 가벼운 공동 관리 |
| 연인 Space | 데이트, 기념일, 공동 지출, 서로의 일정 | 관계 동기화, 약속 관리, 배려 |
| 가족 Space | 가족 일정, 자녀 케어, 정기지출 | 공동생활 운영, 보호/케어, 역할 분담 |
| 기타 Space | 동거인, 반려동물 케어, 프로젝트성 모임 | 생활 맥락별 협업 |

따라서 앞으로의 기능은 먼저 개인 단독 사용이 가능해야 하며, 공유가 필요한 경우에만 **Space + Category + Automation Policy** 조합으로 확장되어야 합니다. "자녀 일정" 같은 특정 가족 케이스에 하드코딩하면 안 됩니다.

---

## 2. 왜 지금 정리가 필요한가

현재 앱은 `personal`, `shared`, `child`, `expense`를 `schedule.type` 하나로 표현합니다.

하지만 이 값들은 같은 축이 아닙니다.

| 현재 값 | 실제 의미 | 문제 |
|---------|----------|------|
| `personal` | 공개 범위 / 개인 소유 | 일정 카테고리가 아님 |
| `shared` | 공유 여부 | Space/visibility에 가까움 |
| `child` | 대상/관계 역할 | 가족 Space의 케어 도메인 |
| `expense` | 기능 도메인 / 지출 | 개인/연인/가족 모두에 해당 가능 |

이 상태에서 `child` 전용 자동 상태 전이를 추가하면 다음 문제가 생깁니다.

- 자동화 로직이 가족/자녀 케이스에 묶여 서비스 확장이 어려워짐
- 개인 루틴, 연인 약속, 공동 지출, 가족 케어가 서로 다른 예외 로직으로 분산됨
- 알림 정책이 "누구에게 왜 보내는지"보다 일정 타입 조건문에 의존하게 됨
- 이후 DB 마이그레이션 비용이 커짐

따라서 지금 단계에서 자동화 기준을 개인 기본 구간과 Space 확장 구간 모두에 적용 가능한 형태로 일반화해야 합니다.

---

## 3. 핵심 도메인 모델

### 3.1 Personal Account / Personal Context

개인 계정은 글리움의 출발점입니다. 모든 사용자는 초대 없이도 자신의 일정, 루틴, 지출, 알림을 관리할 수 있어야 합니다.

```text
PersonalContext
- user_id
- default_visibility: private
- personal_preferences
- notification_preferences
- created_at
```

개인 데이터는 Space에 속하지 않을 수 있습니다. DB 구현상 `space_id`를 nullable로 두거나, 시스템이 자동 생성한 personal Space를 사용할 수 있습니다. 중요한 것은 UX와 제품 개념에서 **개인이 기본값**이라는 점입니다.

현재 구현에서는 호환성을 위해 시스템이 자동 생성한 개인 공간을 사용합니다. 개인 데이터의 저장 대상은 `profiles.preferences.personalSpaceId`이고, 공유 데이터의 저장 대상은 현재 활성 공유 공간인 `sharedSpaceId`입니다. `profiles.family_group_id`는 공유 공간 참여 후 현재 공간 포인터처럼 동작할 수 있으므로, 개인 일정/지출 저장 대상으로 직접 사용하면 안 됩니다.

### 3.2 Space

Space는 개인 사용자가 특정 관계/생활 맥락을 함께 관리하기 위해 만드는 확장 단위입니다. Space는 일정을 소유하는 최상위 본체가 아니라, 공유와 협업이 필요한 데이터에 연결되는 컨텍스트입니다.

```text
Space
- id
- name
- type: friend | couple | family | group | custom
- owner_id
- invite_code
- created_at
```

현재 `family_groups`는 장기적으로 `spaces`로 확장되어야 합니다.
단기적으로는 테이블명을 바로 변경하지 않더라도, 문서와 신규 로직에서는 `family_groups`를 "legacy shared space table"로 해석합니다. 개인 기본 구간까지 `family_groups`에 강제로 넣는 설계는 피합니다.

### 3.3 Space Member

한 사용자는 여러 Space에 속할 수 있어야 합니다.

```text
SpaceMember
- space_id
- user_id
- role: owner | partner | parent | child | member | guest
- display_name
- notification_enabled
- joined_at
```

현재 `profiles.family_group_id`는 한 사용자를 하나의 가족 그룹에만 묶습니다.
확장형 서비스에서는 병목이 되므로 중기 마이그레이션 대상입니다.

### 3.4 Schedule/Event

일정은 개인 컨텍스트에만 존재할 수도 있고, 특정 Space에 연결될 수도 있습니다.
앞으로 일정의 성격은 단일 `type` 대신 여러 축으로 나뉘어야 합니다.

```text
Schedule
- space_id: nullable for personal-only items
- title
- category: event | task | care | expense | anniversary | routine
- visibility: private | space | selected
- status
- start_time
- end_time
- automation_policy
- created_by
```

### 3.5 Assignee / Participant

참여자와 수행자는 분리될 수 있습니다.

- 참여자: 일정을 함께 보는/참석하는 사람
- 수행자: 완료 처리를 해야 하는 사람
- 보호자/관찰자: 미완료나 변경사항을 받아야 하는 사람

예시:

| 상황 | 참여자 | 수행자 | 알림 대상 |
|------|--------|--------|-----------|
| 개인 운동 | 나 | 나 | 나 |
| 친구 모임 | 친구 Space 멤버 | 없음 또는 담당자 | 선택된 멤버 |
| 데이트 | 나 + 연인 | 없음 또는 둘 다 | 나 + 연인 |
| 자녀 학원 | 자녀 | 자녀 | 부모 |
| 가족 장보기 | 가족 | 특정 멤버 | 가족 또는 요청자 |
| 공동 지출 | 연인/가족 | 결제 담당자 | Space 멤버 |

---

## 4. 자동화 정책 모델

앞으로 자동 상태 전이는 "자녀 일정"이 아니라 개인/Space 어디서든 적용 가능한 `automation_policy`에 따라 동작해야 합니다.

| 정책 | 적용 대상 | 상태 전이 | 알림 |
|------|-----------|-----------|------|
| `reminder_only` | 일반 일정, 기념일 | 상태 자동 변경 없음 | 시작 전 리마인더 |
| `time_window` | 개인 일정, 친구 모임, 데이트, 가족 행사 | `pending` → `in_progress` → `completed/ended` | 시작/종료 알림 |
| `completion_required` | 루틴, 할 일, 자녀 케어, 심부름 | `pending` → `in_progress` → `missed` | 미완료 시 담당자/관찰자 알림 |
| `payment_due` | 정기지출, 예정 공동비용 | `pending` → `due` → `overdue/paid` | 결제 전/미납 알림 |
| `confirmation_required` | 약속 변경, 초대, 중요한 가족 결정 | 응답 대기 → 확인 완료/미응답 | 미응답자 재알림 |

### 4.1 자녀 일정의 새 해석

자녀 일정은 특수한 `schedule.type = child`가 아니라 다음 조합입니다.

```text
space.type = family
schedule.category = care 또는 task
automation_policy = completion_required
assignee = child
observer = parent
```

이렇게 설계하면 같은 자동화가 개인 루틴과 연인/가족 할 일에도 재사용됩니다.

### 4.2 개인 루틴 예시

```text
space_id = null 또는 personal context
schedule.category = routine
automation_policy = completion_required
assignee = me
observer = me
```

### 4.3 연인 기념일 예시

```text
space.type = couple
schedule.category = anniversary
automation_policy = reminder_only
participants = both
```

### 4.4 친구 모임 예시

```text
space.type = friend 또는 group
schedule.category = event 또는 expense
automation_policy = reminder_only 또는 payment_due
participants = selected friends
```

### 4.5 공동 지출 예시

```text
space.type = friend, couple, family 또는 group
schedule.category = expense
automation_policy = payment_due
assignee = payer
observer = selected members
```

### 4.6 일회성 지출 예시

```text
schedule.category = expense
repeat = none
status = completed
automation_policy = reminder_only
```

일회성 지출은 이미 발생한 소비 기록이므로 결제 예정/미납 자동화 대상이 아니다. `payment_due`는 앞으로 결제할 정기/예정 지출에만 적용한다.

---

## 5. 알림 모델

알림은 "일정 타입"이 아니라 "규칙"에서 생성되어야 합니다.

```text
NotificationRule
- schedule_id
- trigger: before_start | at_start | after_end | missed | overdue | manual_renotify
- offset_minutes
- recipients: assignees | observers | participants | space_members | creator
- channel: in_app | push | email_future
- dedupe_key
```

현재 구현된 `/api/cron/reminders`는 `before_start` 리마인더의 첫 버전입니다.
다음 단계부터는 이 API를 개인 컨텍스트와 Space 컨텍스트 모두를 처리하는 `automation_policy` 기반 API로 확장하거나, 별도 `/api/cron/automations`로 일반화하는 것이 좋습니다.

---

## 6. 현재 기능의 재해석

| 현재 기능 | 현재 의미 | 확장 모델에서의 의미 |
|-----------|----------|----------------------|
| `family_groups` | 가족 그룹 | legacy shared Space. 개인 기본 구간과 분리 필요 |
| `profiles.family_group_id` | 사용자의 단일 가족 | 단기 유지, 중기 deprecated |
| `/family` | 가족 관리 | Space/멤버 관리. family Space일 때 가족 UI 노출 |
| `/schedules/children` | 자녀 일정 대시보드 | family Space의 care/completion_required 뷰 |
| `/budget` | 가족 정기지출 | 개인 지출 + Space 확장형 공동 expense 뷰 |
| `profiles.preferences.personalSpaceId` | 자동 생성 개인 공간 | 개인 일정/지출의 안정적 저장 경계 |
| `sharedSpaceId` | 현재 공유 공간 | 공간 일정/공동 지출의 저장/조회 경계 |
| `/invite/[code]` | 가족 초대 | Space 초대 |
| `notifications` | 알림 기록 | Space/Rule 기반 알림 기록 |
| `schedule_participants` | 참여자 | participant/assignee/observer로 확장 필요 |

---

## 7. 마이그레이션 전략

### Phase 1 — 문서/코드 의미 정렬 (지금)

- 제품 표현을 Personal-first + Space-expanded로 통일
- `family_group`를 신규 기획/문서에서 legacy shared Space로 해석
- 신규 자동화는 `child` 전용으로 만들지 않음
- 알림/상태 전이 API 이름과 주석을 일반화
- `docs/`에 본 제품 모델을 기준 문서로 유지

### Phase 2 — 최소 DB 확장

기존 구조를 유지하면서 다음 컬럼을 추가하는 방식이 가장 안전합니다. 개인 기본 구간을 위해 `schedules.space_id` nullable 또는 personal context 전략을 별도로 결정해야 합니다.

```sql
ALTER TABLE family_groups
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'family'; -- friend | couple | family | group | custom

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'space',
  ADD COLUMN IF NOT EXISTS automation_policy text DEFAULT 'reminder_only';
```

이 단계에서는 `family_groups` 이름은 유지하지만 의미는 공유 Space로 확장합니다. 다만 개인 기본 데이터까지 무리하게 이 테이블에 종속시키지 않습니다.

### Phase 3 — 멀티 Space 정규화

중기적으로 다음 테이블을 도입합니다.

```text
spaces
space_members
schedule_assignees
schedule_observers
notification_rules
```

이후 `profiles.family_group_id`와 `schedule_participants`는 호환 레이어로 남기거나 점진 제거합니다.

---

## 8. 다음 구현 방향

### 하지 말아야 할 것

- `schedule.type === 'child'` 조건에 직접 묶인 자동 상태 전이 구현
- 가족/자녀 전용 알림 로직을 `/api/cron/reminders`에 계속 누적
- `profiles.family_group_id`를 전제로 새 기능을 강하게 결합
- 모든 사용 흐름을 Space 생성 이후에만 가능하게 만들기

### 해야 할 것

- 개인 단독 사용을 기본값으로 두고 Space는 선택적 확장으로 설계
- 개인 데이터는 `personalSpaceId`, 공유 데이터는 `sharedSpaceId`에 저장하고 서로 섞지 않기
- 공유 공간 화면에서는 `visibility='private'` 데이터를 노출하지 않기
- 자동화 API를 `automation_policy` 중심으로 설계
- 현재 `child` 일정은 `completion_required` 정책의 한 사례로 취급
- 개인 루틴, 연인 할 일, 가족 케어가 같은 상태 전이 엔진을 공유하게 만들기
- 문서와 UI 명칭을 점진적으로 `가족`에서 `Space/공간`으로 넓히기

---

## 9. 추천 다음 작업

1. 개인 기본 구간과 공유 Space 구간의 UX/DB 전략 결정 (`space_id = null` vs system personal Space)
2. `family_groups.type`을 추가해 기존 그룹을 `family` shared Space로 표시
3. `schedules.category`, `schedules.visibility`, `schedules.automation_policy` 추가
4. 기존 `type` 값을 임시 매핑
   - `personal` → `visibility = private`, `category = event`
   - `shared` → `visibility = space`, `category = event`
   - `child` → `category = care`, `automation_policy = completion_required`
   - `expense` → `category = expense`, `repeat='none'`은 `completed + reminder_only`, 정기/예정 지출은 `payment_due`
5. `/api/cron/reminders`를 유지하되, 다음 신규 API는 `/api/cron/automations`로 일반화
6. 개인 루틴 또는 자녀 일정 중 하나를 `completion_required` 정책 처리의 첫 케이스로 구현

---

## 10. AI 작업 지침

다른 AI가 이 프로젝트를 이어받을 때는 다음을 반드시 지켜야 합니다.

1. 글리움은 더 이상 가족 전용 서비스가 아니라 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**입니다.
2. 신규 기능은 `child`, `family`에 하드코딩하지 말고 Space/Category/Automation Policy로 일반화합니다.
3. 기존 코드의 `family_groups`는 당분간 유지하되, 신규 문서와 설계에서는 shared Space로 해석합니다. 개인 기본 구간을 여기에 강제로 묶지 않습니다.
4. 자동 알림/상태 전이는 `schedule.type`이 아니라 `automation_policy` 중심으로 확장합니다.
5. 구현 후에는 반드시 `docs/`를 업데이트해 다른 AI가 이전 가족 중심 방향으로 되돌아가지 않게 합니다.

---

## 11. 가족 공간·자녀 계정 모델

상세 구현 기준은 `docs/21-family-child-account-foundation.md`를 단일 기준으로 사용합니다.

### 확정 구조

```text
family_groups.space_type = personal | general | family
space_members.role       = admin | editor | viewer
family_relationships     = 보호자-자녀 관계와 검증 상태
family_dependents        = 가입 전 자녀 대기 프로필
account_age_profiles     = 생년월일 기반 계정 모드
```

자녀는 공간 권한이 아니라 관계입니다. `space_members.role`이나 `profiles.role`에 `child`를 새로 추가하지 않습니다. 또한 한 명의 자녀에게 복수 보호자가 존재할 수 있으므로 `space_members.relationship` 단일 컬럼도 사용하지 않습니다.

### 안전한 연결 원칙

```text
보호자가 자녀 기본 정보와 Google 이메일 등록
→ 보호자 본인확인 및 필수 동의
→ 자녀 전용 일회성 초대 발급
→ 자녀가 해당 링크에서 Google 로그인
→ 검증 이메일 + 초대 토큰 + 동의 상태 확인
→ user_id 연결 및 viewer 멤버십 생성
```

이메일 일치만으로 자동 합류시키지 않습니다. 이메일은 후보 식별용이고 지속적인 권한 판정은 Supabase `auth.users.id`를 사용합니다. 보호자 검증 전 자녀 프로필에는 공간 접근 권한이 없습니다.

### 연령 전환

- 만 14세 미만: `child_managed`, 검증된 법정대리인 동의 필수
- 만 14세 도달: `teen_consent_pending`, 본인 재동의 전 민감 기능 비활성
- 만 14세 이상 19세 미만: `teen`
- 만 19세 도달: `adult`, 보호자 관리 capability 자동 종료

가족 관계와 가족 공간 멤버십은 성년 이후에도 유지할 수 있지만 위치·개인 일정 등 보호자 접근 권한은 성인 사용자가 직접 다시 허용해야 합니다.

### 구현 상태

- migration `020_family_child_foundation.sql`, `021_family_child_foundation_hardening.sql`: 운영 Supabase 적용 완료
- migration `022_guardian_email_consent_flow.sql`: 운영 Supabase 적용 완료
- 자녀 프로필/관계/동의/초대/연령 상태/RLS: 기반 구현 완료
- `/api/session/context`: 플랫폼 공통 capability 계약 추가
- 보호자 로그인 이메일 확인·필수 동의·자녀 초대 랜딩·최종 승인 Web/API: 구현 완료
- 공통 capability의 플랫폼별 적용, 자녀 전용 홈, 일정 할당, 연령 전환 UI·Cron: 후속 구현
- 외부 본인확인 사업자 전환과 위치 체크인: 도입 조건 충족 전까지 보류

보호자 동의가 완료되고 자녀의 초대 수락 후 보호자가 최종 승인하기 전에는 `space_members`를 생성하지 않습니다.
