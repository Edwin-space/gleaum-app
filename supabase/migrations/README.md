# Gleaum DB 마이그레이션 가이드

## 실행 방법

Supabase CLI 없이 대시보드에서 직접 실행합니다.

```
Supabase 대시보드 → SQL Editor → New Query
해당 .sql 파일 내용 붙여넣기 → Run
```

## 마이그레이션 목록

| 파일 | 내용 | 상태 |
|------|------|------|
| `001_space_members.sql` | space_members 테이블 신설, 역할 기반 RLS 강화 | ⬜ 환경별 확인 필요 |
| `009_fix_one_time_expense_status.sql` | 일회성 지출을 `completed + reminder_only`로 보정 | ⬜ Supabase SQL Editor 실행 필요 |
| `010_move_private_records_to_personal_space.sql` | 공유 공간에 잘못 저장된 private 일정/지출을 개인 공간으로 이동 | ⬜ Supabase SQL Editor 실행 필요 |
| `011_add_expense_reflection_columns.sql` | 공간 지출 → 개인 가계부 반영 연결 컬럼 추가 | ⬜ Supabase SQL Editor 실행 필요 |
| `012_cron_overdue_and_digest.sql` | 고정지출 연체 알림(D+0/3/7) + 주간 소비 다이제스트 크론잡 등록 | ⬜ **실행 전 app_url·cron_secret 수정 필요** |
| `013_ad_system.sql` | 광고 시스템 (ad_slots / ads / ad_events 테이블, RLS, get_active_ad 함수) | ⬜ **Supabase SQL Editor 실행 필요** |
| `014_ad_platforms.sql` | ads.platforms 컬럼 추가 + get_active_ad p_platform 파라미터 보정 | ⬜ **013 실행 후 반드시 이어서 실행** |

> 📖 **SQL 전문 + 실행 순서 + 확인 쿼리** → `backoffice/docs/06-supabase-sql.md` 참조

## 001_space_members.sql 상세

### 변경 내용
- `space_members` 테이블 신설 (공간별 역할 관리)
- 기존 `profiles.role + family_group_id` 데이터를 `space_members`로 이전
- 역할 매핑: `parent→admin`, `child→editor`, `guest→viewer`
- Helper Functions: `my_space_ids()`, `my_role_in_space()`, `is_space_admin()`, `can_edit_in_space()`
- RLS 정책: 역할 기반으로 전면 교체

### 실행 전 확인사항
- [ ] Supabase 프로젝트에 로그인된 상태
- [ ] 기존 데이터 백업 권장 (Supabase → Database → Backups)

### 실행 후 확인사항
```sql
-- space_members 데이터 이전 확인
SELECT sm.*, p.name, p.email, fg.name as space_name
FROM space_members sm
JOIN profiles p ON p.id = sm.user_id
JOIN family_groups fg ON fg.id = sm.space_id;

-- 역할 분포 확인
SELECT role, count(*) FROM space_members GROUP BY role;
```

### 롤백 방법 (문제 발생 시)
```sql
DROP TABLE IF EXISTS space_members CASCADE;

-- RLS 정책 원복 (schema.sql 의 원본 버전 재실행)
```

## 010_move_private_records_to_personal_space.sql 상세

### 변경 내용
- `schedules.visibility = 'private'` 인데 `family_group_id`가 생성자의 `preferences.personalSpaceId`와 다른 기존 데이터를 개인 공간으로 이동
- 대상 개인 공간에 생성자가 `space_members`로 포함되어 있는 경우에만 이동
- 실행 후 `remaining_private_records_outside_personal_space` 검증 카운트를 반환

### 실행 후 확인사항
```sql
SELECT count(*) AS remaining_private_records_outside_personal_space
FROM schedules s
JOIN profiles p ON p.id = s.created_by
WHERE s.visibility = 'private'
  AND p.preferences->>'personalSpaceId' IS NOT NULL
  AND s.family_group_id IS DISTINCT FROM (p.preferences->>'personalSpaceId')::uuid;
```

결과가 `0`이면 공유 공간에 남아 있는 private 일정/지출이 없는 상태입니다.


## 011_add_expense_reflection_columns.sql 상세

### 변경 내용
- `schedules.source_space_expense_id`: 개인 가계부 항목이 어떤 공간 지출에서 반영됐는지 연결
- `schedules.source_space_id`: 원본 공간 ID 보관
- `schedules.expense_reflection_type`: 반영 기준(`actual_paid`, `final_share`, `manual`) 보관
- `schedules.expense_reflected_at`: 개인 가계부 반영 시각 보관
- 같은 사용자가 같은 공간 지출을 중복 반영하지 않도록 partial unique index 추가

### 실행 후 확인사항
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schedules'
  AND column_name IN (
    'source_space_expense_id',
    'source_space_id',
    'expense_reflection_type',
    'expense_reflected_at'
  )
ORDER BY column_name;
```

위 4개 컬럼이 모두 보이면 적용 완료입니다.


## 012_cron_overdue_and_digest.sql 상세

### 변경 내용
- `gleaum-overdue-expenses`: 매일 09:00 KST, 고정지출 미결제 D+0/3/7 알림
- `gleaum-weekly-digest`: 매주 월요일 09:00 KST, 지난 7일 개인 지출 다이제스트

### 실행 전 필수 수정
SQL 파일 내부의 아래 값을 실제 운영값으로 바꾼 뒤 실행해야 합니다.

```sql
app_url     TEXT := 'https://www.gleaum.com';
cron_secret TEXT := 'your-cron-secret-here';
```

### 실행 후 확인사항
```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN ('gleaum-overdue-expenses', 'gleaum-weekly-digest');
```
