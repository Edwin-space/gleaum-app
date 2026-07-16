# 가족 공간 자녀 계정 기반

> 상태: 자녀 연결 기반과 플랫폼 공통 session capability 계약·Web/UI·API·RLS 강제 운영 적용 완료
> 기준일: 2026-07-16

## 1. 확정된 원칙

- 자녀는 `space_members.role`이 아니라 가족 관계다.
- 공간 권한은 기존 `admin | editor | viewer`를 유지한다.
- 가족 관계는 `family_relationships`에서 별도로 관리한다.
- 가입 전 자녀 정보는 `family_dependents`에 접근 권한 없는 대기 프로필로 저장한다.
- Google 이메일은 연결 후보 식별자이며, 지속적인 권한 판정은 Supabase `auth.users.id`로 한다.
- 이메일 일치만으로 자동 연결하지 않는다. 보호자 이메일 확인, 항목별 동의, 자녀의 검증된 이메일, 일회성 초대 토큰, 보호자 최종 승인을 모두 확인한다.
- 만 14세 미만은 검증된 보호자 관계와 필수 동의가 완료되기 전 초대를 발급하지 않는다.
- 현재 나이 숫자를 저장하지 않고 생년월일과 서버 날짜로 연령을 계산한다.
- Android, iOS, Web은 `/api/session/context`의 동일한 capability 계약을 사용한다.

## 2. 공간 종류

`family_groups` 테이블명은 하위 호환을 위해 유지하고 `space_type`을 추가한다.

```text
personal = 개인 공간, 초대 불가
general  = 연인·친구·업무·모임 공유 공간
family   = 가족 관계·자녀 계정 기능 활성 공간
```

`settings.purpose`는 화면 표현 목적이며 `space_type`은 저장·권한 판정 기준이다.

## 3. 자녀 등록과 연결 흐름

```text
보호자가 가족 공간에 자녀 기본 정보 등록
→ family_dependents.status = consent_pending
→ 보호자 로그인 이메일로 일회성 확인 메일 발송
→ 보호자가 이메일 링크에서 필수 항목 3종을 각각 동의
→ 관계 verification_status = verified
→ 72시간 일회성 초대 발급
→ 보호자가 휴대폰 공유 시트로 문자·카카오톡 등에 직접 전달
→ 자녀가 초대 링크에서 등록된 Google 이메일로 로그인
→ 이메일 검증 + 초대 토큰 + 보호자 동의 서버 확인
→ family_dependents.status = approval_pending
→ 보호자가 자녀 관리 화면에서 최종 승인
→ space_members.viewer 추가
→ 연령에 맞는 account_mode 적용
```

보호자 최종 승인 전 자녀 프로필은 공간 멤버가 아니며 일정·멤버·가계부·위치 데이터에 접근할 수 없다.

## 4. 데이터 모델

| 테이블 | 역할 |
|---|---|
| `family_dependents` | 보호자가 미리 등록하는 자녀 기본 정보와 계정 연결 상태 |
| `family_relationships` | 보호자-자녀 관계 및 본인확인 상태 |
| `guardian_consents` | 항목별 동의, 정책 버전, 검증 방법과 증적 참조 |
| `guardian_email_verifications` | 보호자 이메일 확인 토큰 해시·이메일 해시·만료/사용 증적 |
| `space_invitations` | 자녀 연결 전용 일회성 초대 토큰 해시 |
| `account_age_profiles` | 생년월일, 계정 모드, 다음 연령 전환일 |

성별은 선택 항목이다. 제품 기능에 필요성이 확정되지 않으면 UI에서 받지 않는다.

## 5. 연령 상태

```text
unknown                  연령 미확인 일반 계정
pending_guardian_consent 보호자 동의 대기
child_managed            만 14세 미만 보호자 관리 계정
teen_consent_pending     만 14세 도달 후 본인 재동의 대기
teen                     만 14세 이상 19세 미만
adult                    만 19세 이상
```

- 만 14세 도달: `child_managed → teen_consent_pending`. 위치 공유 등 민감 기능은 본인 재동의 전 활성화하지 않는다.
- 만 19세 도달: `adult`로 자동 전환한다. 가족 멤버십은 유지하지만 보호자 관리 권한은 capability에서 제거한다.
- 로그인 시 `refresh_my_account_age_state()`가 서버 날짜로 상태를 갱신한다.
- 일괄 전환용 Supabase Cron은 재동의 UI와 알림 정책이 구현될 때 추가한다.

## 6. 서버 API 계약

| API | 상태 | 역할 |
|---|---|---|
| `GET /api/spaces/children?spaceId=` | 기반 완료 | 조회 권한이 있는 자녀 프로필 목록 |
| `POST /api/spaces/children` | 기반 완료 | 가족 공간 자녀 대기 프로필 생성 |
| `POST /api/spaces/children/[id]/guardian-verification/start` | 구현 완료 | 보호자 로그인 이메일로 일회성 확인 링크 발송 |
| `POST /api/spaces/children/guardian-verification/complete` | 구현 완료 | 필수 동의 3종과 이메일 확인 증적 기록 |
| `POST /api/spaces/children/[id]/invite` | 기반 완료 | 검증·동의 완료 후 일회성 초대 발급 |
| `POST /api/spaces/children/invitations/claim` | 구현 완료 | 자녀 연결 요청 생성, 공간 접근은 보류 |
| `POST /api/spaces/children/[id]/approve` | 구현 완료 | 보호자 최종 승인 후 viewer 권한 부여 |
| `GET /api/session/context` | 적용 완료 | Cookie·Bearer 인증을 모두 검증하고 플랫폼 공통 accountMode/capabilities 반환 |

초대 발급 API는 보호자 확인과 필수 동의가 없으면 의도적으로 차단된다. 자녀 claim은 `pending_guardian_consent`만 만들고 `space_members`를 생성하지 않는다.

## 7. 현재 capability 기본값

- `child_managed`, `teen_consent_pending`: 공간 관리·초대·가계부·광고 차단
- `teen`: 공간 관리·초대·가계부·광고 차단
- `adult`: 일반 기능 허용
- `unknown`: 기존 일반 기능은 유지하지만 광고는 연령 확인 전 기본 차단
- 위치 권한 capability는 동의 UI와 위치 MVP 구현 전까지 항상 비활성

화면 숨김과 함께 Route Handler와 Data API RLS에서도 같은 capability를 검증한다. 2026-07-16 기준 가계부, 공간 생성·관리, 멤버 초대·참여, 광고는 서버 우회 요청까지 차단된다. 일정 assignee/observer와 위치는 각각 `FAM-003`, `FAM-007` 범위로 남겨 둔다.

Web과 Android는 2026-07-16 `FAM-002`에서 이 계약을 홈·메뉴까지 적용했다. 보호자 관리/동의 대기 계정에는 전용 안내와 일정 중심 문구를 제공하고, Android는 세션 컨텍스트를 fail-closed로 캐시해 가계부 탭·액티비티, 공간 생성/참여/초대/설정, 관련 딥링크, Native Ad와 App Open Ad를 차단한다. iOS 네이티브 동등화는 `IOS-005`에서 이어서 처리한다.

## 8. Supabase 적용

실행 파일:

```text
supabase/migrations/020_family_child_foundation.sql
supabase/migrations/021_family_child_foundation_hardening.sql
supabase/migrations/022_guardian_email_consent_flow.sql
supabase/migrations/20260716055953_enforce_account_capabilities.sql
supabase/migrations/20260716063400_restrict_account_capability_rpc.sql
```

실행 방법:

1. 위 파일을 코드 편집기로 연다.
2. 파일 내부 SQL 전체를 복사한다. 파일 경로 문자열을 SQL Editor에 입력하지 않는다.
3. Supabase Dashboard → SQL Editor → New query에 붙여넣는다.
4. Run을 누른다.
5. `020` 결과에 테이블 5개, `family_groups.space_type`, 함수 4개가 표시되는지 확인한다.
6. 이어서 `021` 파일 전체를 같은 방식으로 실행해 인덱스와 RLS 성능 보강을 적용한다.
7. `022` 파일 전체를 실행해 이메일 확인 증적, 연결 승인 대기 상태, 보호자 최종 승인 함수를 적용한다.

운영 `gleaum_app` 프로젝트에는 위 migration을 모두 적용했다. `has_account_capability(text)`는 `SECURITY INVOKER`, `anon` 실행 불가, `authenticated`·`service_role` 실행 가능으로 검증했고, `ledger_entries`·`family_groups`·`space_members`에 제한형 RLS 7개가 적용되었다. Supabase Security Advisor에서 신규 capability 경고는 0건이다.

운영 환경 필수 설정:

```text
NEXT_PUBLIC_APP_URL=https://www.gleaum.com
Supabase Auth Redirect URL=https://www.gleaum.com/auth/callback
```

Supabase Authentication 이메일 템플릿에는 `{{ .ConfirmationURL }}` 링크가 반드시 포함되어야 한다. 보호자 확인 메일은 기존 Custom SMTP(`helper@gleaum.com`)를 통해 발송된다.

## 9. 비용 최적화형 보호자 확인의 운영 한계와 전환 기준

현재 방식은 초기 이용자 규모에서 SMS 발송비를 줄이기 위한 임시 모델이다.

- Supabase Auth와 연결된 보호자 로그인 이메일로 일회성 확인 링크를 보낸다.
- 필수 동의는 `service_registration`, `personal_data_processing`, `family_data_sharing` 3종만 각각 받는다.
- 위치 수집·위치 공유·마케팅 동의는 묶지 않으며 기본 비활성이다.
- 보호자 휴대폰의 OS 공유 기능을 사용하므로 글리움 서버는 SMS를 발송하거나 자녀 전화번호를 저장하지 않는다.
- 이메일 확인만으로 법정대리인 신원을 강하게 보증할 수 없으므로 공개 운영 전 국내 개인정보 전문 검토를 거친다.

아래 조건 중 하나라도 충족하면 이메일 확인을 보조 수단으로 내리고 SMS OTP 또는 PASS/NICE/KCB 등 본인확인으로 전환한다.

1. 만 14세 미만 활성 자녀 계정 1,000개 도달
2. 월간 자녀 연결 요청 500건 도달
3. 보호자 관계 분쟁·사칭·민원 1건 이상 발생
4. 실시간 또는 백그라운드 위치 수집 기능 도입
5. 유료 결제, 금전 보상 또는 자녀 대상 광고 기능 도입
6. 법령·스토어 정책·개인정보보호위원회 가이드가 더 강한 확인을 요구

전환 시 `verification_method`를 버전별로 유지하고 과거 이메일 확인 증적을 덮어쓰지 않는다.

## 10. 다음 구현 순서

1. 운영 약관·개인정보처리방침 개정 사전 고지 및 시행일 관리
2. ~~자녀 전용 홈 및 메뉴 capability 차단 (`FAM-002`, Android 포함)~~ — 2026-07-16 완료
3. iOS 네이티브 메뉴·홈·광고 capability 동등화 (`IOS-005`)
4. 일정 assignee/observer 모델과 RLS (`FAM-003`)
5. 만 14세 본인 재동의 UI
6. 연령 전환 알림 및 일괄 Cron
7. 외부 본인확인 사업자 선정과 전환 어댑터 구현
8. 수동 위치 체크인 MVP와 별도 위치 동의

## 11. 현재 제외 범위

- iOS 자녀 전용 홈·메뉴 capability 동등화
- 위치 저장·공유
- 자녀 일정 assignee/observer
- 유료 결제 보호자 승인

위치 기능은 별도 법률 검토·동의·본인확인이 구현되기 전에는 노출하지 않는다.
