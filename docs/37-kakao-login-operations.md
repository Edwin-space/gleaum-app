# Kakao 로그인 도입·운영 가이드

> 상태: Android/iOS 네이티브 로그인 코드와 자녀 초대 계정 연결 DB 변경 작성 완료. Kakao Developers·Supabase Auth 외부 설정, 운영 migration, 실계정 회귀 전에는 출시하지 않는다.
> 기준일: 2026-08-04

## 1. 확정 구조

```text
Android/iOS 네이티브 로그인 화면
→ Supabase `/auth/v1/authorize?provider=kakao`
→ Kakao 계정 인증
→ Supabase Auth callback
→ `gleaum://auth/callback`
→ 기존 Native SessionManager 저장
→ 온보딩 또는 보존된 자녀 초대 경로로 이동
```

- Kakao Native SDK를 앱에 추가하지 않는다. 초기 버전은 Supabase 공식 Kakao OAuth를 사용해 Android/iOS 인증 계약을 하나로 유지한다.
- Android는 Chrome Custom Tab, iOS는 `ASWebAuthenticationSession`을 사용한다.
- Apple 로그인은 iOS에서 계속 제공한다. Kakao 추가를 이유로 제거하지 않는다.
- 자녀 초대는 이메일이 없는 Kakao 계정도 `auth.identities.provider = 'kakao'`로 확인한다.
- 보호자가 계정 제한용 이메일을 입력한 초대는 제공자와 관계없이 확인된 동일 이메일을 계속 요구한다.
- 로그인 제공자는 최초 인증 수단일 뿐 공간 권한·자녀 권한 판정에는 사용하지 않는다. 지속 권한의 기준은 `auth.users.id`와 서버 capability다.

## 2. Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 `글리움`을 생성하거나 기존 앱을 연다.
2. 앱 기본 정보의 대표 도메인은 `https://www.gleaum.com`으로 입력한다.
3. **앱 설정 → 앱 → 플랫폼 키**에서 `REST API 키`를 확인한다. 이 값이 Supabase의 Client ID다.
4. REST API 키 편집 화면의 **Kakao Login Redirect URI**에 아래 주소를 정확히 등록한다.

```text
https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback
```

5. 같은 화면에서 **Kakao Login Client Secret**을 생성하고 활성화한다. 이 값이 Supabase의 Client Secret이다.
6. **제품 설정 → 카카오 로그인 → 일반**에서 카카오 로그인을 `ON`으로 바꾼다.
7. **제품 설정 → 카카오 로그인 → 동의항목**을 다음 기준으로 설정한다.

| 항목 | 설정 | 이유 |
|---|---|---|
| 닉네임 | 필수 또는 선택 동의 | 신규 프로필 기본 표시명 |
| 프로필 사진 | 선택 동의 | 프로필 이미지 |
| 이메일 | 선택 동의 또는 미사용 | Biz App이 아니어도 가입 가능해야 하며 자녀 초대는 이메일 없는 검증 Kakao identity를 지원 |

이메일을 필수로 만들지 않는다. 이메일이 반드시 필요한 보호자 초대만 보호자가 `계정 제한용 이메일`을 입력해 별도로 제한한다.

## 3. Supabase Dashboard 설정

1. Supabase Dashboard에서 프로젝트 `tyvjdsescukaeorcuaga`를 연다.
2. **Authentication → Sign In / Providers → Kakao**를 연다.
3. `Kakao Enabled`를 `ON`으로 바꾼다.
4. `Client ID`에 Kakao `REST API 키`를 입력한다.
5. `Client Secret`에 활성화한 Kakao Login Client Secret을 입력한다.
6. `Allow users without an email`을 `ON`으로 바꾼다.
7. 저장한다.
8. **Authentication → URL Configuration → Redirect URLs**에 아래 주소가 있는지 확인하고 없으면 추가한다.

```text
gleaum://auth/callback
```

Client Secret은 앱 소스, Git, Vercel 공개 환경변수에 넣지 않는다. Supabase Auth Provider 설정에만 저장한다.

## 4. 운영 DB migration

적용 파일:

```text
/Volumes/Portable SSD/AI/gleaum/supabase/migrations/20260804024853_support_kakao_child_identity.sql
```

Codex의 Supabase 연결로 `support_kakao_child_identity` migration을 적용하는 것이 기본이다. 수동 적용이 필요할 때만 다음 순서로 실행한다.

1. 위 파일을 텍스트 편집기로 연다.
2. 파일 경로를 SQL Editor에 입력하지 말고, 파일 **안의 SQL 전체**를 복사한다.
3. Supabase Dashboard → **SQL Editor → New query**에 붙여넣는다.
4. **Run**을 누른다.
5. 아래 검증 SQL을 새 쿼리에서 실행한다.

```sql
select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'family_dependents_provider_check';

select
  p.proname,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'claim_family_child_invitation',
    'approve_family_child_link'
  )
order by p.proname;
```

정상 결과:

- constraint 정의에 `'kakao'`가 포함된다.
- 두 함수 모두 `anon_execute = false`, `authenticated_execute = true`다.

## 5. 출시 전 회귀 체크

### 일반 로그인

- [ ] Android에서 Kakao 로그인 버튼이 노란 공식 패턴으로 표시된다.
- [ ] iOS에서 Apple·Google·Kakao·이메일 버튼이 작은 iPhone에서도 잘리지 않는다.
- [ ] Kakao 로그인 취소 시 로딩이 해제되고 기존 로그인 화면으로 돌아온다.
- [ ] 기존 Kakao 계정 로그인 후 홈으로 이동한다.
- [ ] 신규 Kakao 계정 로그인 후 네이티브 온보딩으로 이동한다.
- [ ] 앱 종료·재실행 후 세션이 유지된다.
- [ ] 로그아웃 후 다른 Kakao 계정으로 로그인할 수 있다.

### 자녀 초대

- [ ] 로그인 전 자녀 초대 링크를 연 뒤 Kakao 로그인해도 초대 경로가 보존된다.
- [ ] 이메일 미제공 Kakao 계정은 계정 제한 이메일이 없는 초대를 claim할 수 있다.
- [ ] 계정 제한 이메일이 있는 초대는 동일한 확인 이메일이 없으면 거절된다.
- [ ] claim 직후에는 공간 멤버십이 생성되지 않는다.
- [ ] 보호자 최종 승인 후에만 `viewer` 멤버십과 연령 capability가 생성된다.
- [ ] 보호자 계정으로 자녀 초대를 수락하면 차단된다.

## 6. 이번 범위와 후속 범위

이번 범위:

- Android/iOS Kakao 로그인
- 기존 세션·온보딩·딥링크 연결
- 이메일 없는 Kakao 계정의 자녀 초대 연결
- 개인정보처리방침과 운영 문서 정합화

후속 범위:

- 마이페이지에서 기존 Apple·Google·이메일 계정에 Kakao identity 연결/해제
- Kakao 계정 탈퇴 시 연결 해제 정책과 재인증 UX
- 로그인 제공자별 전환율·실패율 Analytics 이벤트

기존 계정에 같은 이메일의 Kakao 로그인을 시도한다고 자동으로 동일 사용자로 병합된다고 가정하지 않는다. 계정 연결 기능을 구현하기 전에는 서로 다른 `auth.users.id`가 생성될 수 있으므로, 기존 사용자는 원래 로그인 수단을 유지하도록 안내한다.

## 7. 외부 기준

- [Supabase Kakao 로그인 공식 가이드](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
- [Kakao Developers](https://developers.kakao.com/)

