# 12. 제품 모델 재정의 — Space 기반 개인/연인/가족 토털 서비스

> 작성일: 2026-05-04
> 목적: 글리움을 기존 "가족 일정 관리 앱"에서 **개인, 연인, 가족을 모두 포괄하는 관계 중심 일상 네트워크 서비스**로 확장하기 위한 기준 문서입니다.
> 이 문서는 향후 DB, API, UI, 자동화, 알림 설계의 상위 기준입니다.

---

## 1. 결론 요약

글리움의 중심 개념은 더 이상 `family_group`이 아니라 **Space**여야 합니다.

Space는 사용자가 일상을 기록하고 공유하는 관계 단위입니다.

| Space 유형 | 예시 | 핵심 가치 |
|------------|------|-----------|
| 개인 Space | 나의 일정, 루틴, 개인 지출 | 자기관리, 리마인드, 기록 |
| 연인 Space | 데이트, 기념일, 공동 지출, 서로의 일정 | 관계 동기화, 약속 관리, 배려 |
| 가족 Space | 가족 일정, 자녀 케어, 정기지출 | 공동생활 운영, 보호/케어, 역할 분담 |
| 확장 Space | 친구 모임, 동거인, 반려동물 케어 | 소규모 관계/생활 그룹 관리 |

따라서 앞으로의 기능은 "자녀 일정" 같은 특정 가족 케이스에 하드코딩하지 말고, **Space + Category + Automation Policy** 조합으로 설계해야 합니다.

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

따라서 지금 단계에서 자동화 기준을 일반화해야 합니다.

---

## 3. 핵심 도메인 모델

### 3.1 Space

Space는 일정을 소유하고, 멤버를 갖고, 알림/자동화 정책의 기본 범위를 정하는 단위입니다.

```text
Space
- id
- name
- type: personal | couple | family | group
- owner_id
- invite_code
- created_at
```

현재 `family_groups`는 장기적으로 `spaces`로 확장되어야 합니다.
단기적으로는 테이블명을 바로 변경하지 않더라도, 문서와 신규 로직에서는 `family_groups`를 "legacy space table"로 해석합니다.

### 3.2 Space Member

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

### 3.3 Schedule/Event

일정은 Space 안에 존재합니다.
앞으로 일정의 성격은 단일 `type` 대신 여러 축으로 나뉘어야 합니다.

```text
Schedule
- space_id
- title
- category: event | task | care | expense | anniversary | routine
- visibility: private | space | selected
- status
- start_time
- end_time
- automation_policy
- created_by
```

### 3.4 Assignee / Participant

참여자와 수행자는 분리될 수 있습니다.

- 참여자: 일정을 함께 보는/참석하는 사람
- 수행자: 완료 처리를 해야 하는 사람
- 보호자/관찰자: 미완료나 변경사항을 받아야 하는 사람

예시:

| 상황 | 참여자 | 수행자 | 알림 대상 |
|------|--------|--------|-----------|
| 개인 운동 | 나 | 나 | 나 |
| 데이트 | 나 + 연인 | 없음 또는 둘 다 | 나 + 연인 |
| 자녀 학원 | 자녀 | 자녀 | 부모 |
| 가족 장보기 | 가족 | 특정 멤버 | 가족 또는 요청자 |
| 공동 지출 | 연인/가족 | 결제 담당자 | Space 멤버 |

---

## 4. 자동화 정책 모델

앞으로 자동 상태 전이는 "자녀 일정"이 아니라 `automation_policy`에 따라 동작해야 합니다.

| 정책 | 적용 대상 | 상태 전이 | 알림 |
|------|-----------|-----------|------|
| `reminder_only` | 일반 일정, 기념일 | 상태 자동 변경 없음 | 시작 전 리마인더 |
| `time_window` | 회의, 데이트, 가족 행사 | `pending` → `in_progress` → `completed/ended` | 시작/종료 알림 |
| `completion_required` | 루틴, 할 일, 자녀 케어, 심부름 | `pending` → `in_progress` → `missed` | 미완료 시 담당자/관찰자 알림 |
| `payment_due` | 정기지출, 공동비용 | `pending` → `due` → `overdue/paid` | 결제 전/미납 알림 |
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
space.type = personal
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

### 4.4 공동 지출 예시

```text
space.type = couple 또는 family
schedule.category = expense
automation_policy = payment_due
assignee = payer
observer = selected members
```

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
다음 단계부터는 이 API를 `automation_policy` 기반으로 확장하거나, 별도 `/api/cron/automations`로 일반화하는 것이 좋습니다.

---

## 6. 현재 기능의 재해석

| 현재 기능 | 현재 의미 | 확장 모델에서의 의미 |
|-----------|----------|----------------------|
| `family_groups` | 가족 그룹 | legacy `spaces` |
| `profiles.family_group_id` | 사용자의 단일 가족 | 단기 유지, 중기 deprecated |
| `/family` | 가족 관리 | Space/멤버 관리. family Space일 때 가족 UI 노출 |
| `/schedules/children` | 자녀 일정 대시보드 | family Space의 care/completion_required 뷰 |
| `/budget` | 가족 정기지출 | Space 기반 expense 뷰 |
| `/invite/[code]` | 가족 초대 | Space 초대 |
| `notifications` | 알림 기록 | Space/Rule 기반 알림 기록 |
| `schedule_participants` | 참여자 | participant/assignee/observer로 확장 필요 |

---

## 7. 마이그레이션 전략

### Phase 1 — 문서/코드 의미 정렬 (지금)

- `family_group`를 신규 기획/문서에서 Space로 해석
- 신규 자동화는 `child` 전용으로 만들지 않음
- 알림/상태 전이 API 이름과 주석을 일반화
- `docs/`에 본 제품 모델을 기준 문서로 유지

### Phase 2 — 최소 DB 확장

기존 구조를 유지하면서 다음 컬럼을 추가하는 방식이 가장 안전합니다.

```sql
ALTER TABLE family_groups
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'family';

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'space',
  ADD COLUMN IF NOT EXISTS automation_policy text DEFAULT 'reminder_only';
```

이 단계에서는 `family_groups` 이름은 유지하지만 의미는 Space로 확장합니다.

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

### 해야 할 것

- 자동화 API를 `automation_policy` 중심으로 설계
- 현재 `child` 일정은 `completion_required` 정책의 한 사례로 취급
- 개인 루틴, 연인 할 일, 가족 케어가 같은 상태 전이 엔진을 공유하게 만들기
- 문서와 UI 명칭을 점진적으로 `가족`에서 `Space/공간`으로 넓히기

---

## 9. 추천 다음 작업

1. `family_groups.type`을 추가해 기존 그룹을 `family` Space로 표시
2. `schedules.category`, `schedules.visibility`, `schedules.automation_policy` 추가
3. 기존 `type` 값을 임시 매핑
   - `personal` → `visibility = private`, `category = event`
   - `shared` → `visibility = space`, `category = event`
   - `child` → `category = care`, `automation_policy = completion_required`
   - `expense` → `category = expense`, `automation_policy = payment_due`
4. `/api/cron/reminders`를 유지하되, 다음 신규 API는 `/api/cron/automations`로 일반화
5. 자녀 일정 자동 상태 전이는 `completion_required` 정책 처리의 첫 케이스로 구현

---

## 10. AI 작업 지침

다른 AI가 이 프로젝트를 이어받을 때는 다음을 반드시 지켜야 합니다.

1. 글리움은 더 이상 가족 전용 서비스가 아니라 **개인/연인/가족 Space 기반 일상 네트워크**입니다.
2. 신규 기능은 `child`, `family`에 하드코딩하지 말고 Space/Category/Automation Policy로 일반화합니다.
3. 기존 코드의 `family_groups`는 당분간 유지하되, 신규 문서와 설계에서는 Space로 해석합니다.
4. 자동 알림/상태 전이는 `schedule.type`이 아니라 `automation_policy` 중심으로 확장합니다.
5. 구현 후에는 반드시 `docs/`를 업데이트해 다른 AI가 이전 가족 중심 방향으로 되돌아가지 않게 합니다.
