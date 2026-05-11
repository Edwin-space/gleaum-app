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
| `001_space_members.sql` | space_members 테이블 신설, 역할 기반 RLS 강화 | ⬜ 미실행 |

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
