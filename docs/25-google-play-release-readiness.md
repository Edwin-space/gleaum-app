# 25. Google Play 출시 준비 체크리스트

> 최초 점검: 2026-07-16
>
> 상태의 단일 기준은 `docs/24-project-work-tracker.md`의 `AND-006`이다. 이 문서는 Play Console 입력값과 검증 근거를 보관한다.

## 1. 로컬·운영 검증 결과

| 항목 | 상태 | 근거 / 다음 행동 |
|---|---|---|
| 패키지 | 완료 | `com.gleaum.app` |
| 앱 버전 | 확인 필요 | 로컬 `versionCode 26`, `versionName 1.1.5`; Play Console 최신 versionCode와 충돌 여부 확인 |
| Target API | 완료 | `targetSdk 36`; 2026-08-31부터 일반 앱 업데이트에 필요한 API 36 충족 |
| 민감 권한 | 완료 | 미디어·외부 저장소·카메라 권한 없음. 캘린더·알림·생체인증은 사용자 기능에 사용 |
| 개인정보처리방침 | 완료 | `https://www.gleaum.com/legal/privacy` HTTP 200, 앱 내부 진입 경로 존재 |
| App Links | 부분 완료 | `assetlinks.json` HTTP 200, 패키지와 SHA-256 1개 존재. Play App Signing 인증서와 일치 여부는 Console에서 재확인 |
| 광고 판매자 | 완료 | `https://www.gleaum.com/app-ads.txt` HTTP 200, AdMob publisher ID 확인 |
| R8 | 완료 | `minifyEnabled true`, 서명 전 release package·`mapping.txt` 생성 확인 |
| Native symbols | 부분 완료 | `debugSymbolLevel FULL`; 최종 서명 AAB 생성 후 Play Console 업로드 산출물 확인 |
| 최종 서명 AAB | 차단 | 저장소 외 release keystore password 환경 주입 필요 |

### 등록정보 애셋 준비 상태

| 항목 | 상태 | 근거 / 다음 행동 |
|---|---|---|
| 한국어 등록정보 카피 | 완료 | `store-assets/google-play/store-listing-ko.md`; 앱 이름 15/30자, 간단한 설명 37/80자, 자세한 설명 1032/4000자, 출시 노트 151/500자 |
| 휴대전화 스크린샷 | 제작 완료 | `store-assets/google-play/phone/output-ko/`의 익명화 이미지 6장. 모두 1080×1920 RGB PNG, 알파 채널 없음. Play Console 업로드 확인 필요 |
| 스크린샷 대체 텍스트 | 완료 | `store-assets/google-play/phone/alt-text-ko.txt` |
| 기능 그래픽 | 대기 | 카피와 제작 지침은 등록정보 문서에 확정. 1024×500 최종 이미지 제작·업로드 필요 |

개인정보가 포함될 수 있는 원본 단말 캡처는 저장소에 포함하지 않으며 `.gitignore`의 `store-assets/google-play/phone/raw/` 규칙으로 차단한다.

## 2. Data safety 입력 초안

Play Console 제출 전 실제 SDK 버전과 운영 설정을 다시 대조한다. “수집”과 “공유” 여부는 Google Play 정의에 따라 Console에서 최종 판단한다.

| Play 데이터 유형 | 현재 앱 근거 | 주요 목적 |
|---|---|---|
| 이름·이메일·사용자 ID | Google/이메일 계정, 프로필, 가족·자녀 연결 | 앱 기능, 계정 관리 |
| 사진 | 사용자가 선택한 프로필 이미지 | 앱 기능 |
| 캘린더 일정 | 사용자가 선택한 기기 일정 가져오기 | 앱 기능 |
| 앱 활동 | 화면 조회, 기능·광고 상호작용 | 분석, 광고·마케팅 |
| 앱 정보·성능 / 충돌 로그 | Firebase Crashlytics, 광고 SDK 진단 | 분석, 앱 기능, 부정 이용 방지 |
| 기기 또는 기타 ID | FCM/Firebase installation ID, 광고 ID, App Set ID | 알림, 분석, 광고, 부정 이용 방지 |
| 일반 위치 추정 가능 정보 | 광고 SDK가 수집하는 IP 주소 | 광고, 분석, 부정 이용 방지 |
| 일정·가계부·공간 입력 내용 | Supabase에 저장되는 사용자 콘텐츠 | 앱 기능 |

공통 답변 확인:

- 전송 중 암호화: 예(HTTPS/TLS).
- 계정 삭제 요청: 앱 내 회원 탈퇴 및 `https://www.gleaum.com/legal/delete-account`.
- 데이터 삭제·보유 기간: 개인정보처리방침 제3조·제8조와 실제 30일 복구 정책의 일치 여부를 최종 확인.
- 선택적 데이터: 캘린더·사진은 사용자가 기능을 실행하고 OS 선택기/권한을 승인한 경우에만 처리.
- 광고 SDK: Google Mobile Ads와 Kakao AdFit의 최신 disclosure를 제출 직전 재확인.

## 3. Play Console에서만 완료 가능한 항목

- [ ] 최신 Production/테스트 release의 versionCode 확인
- [ ] App content → 개인정보처리방침 URL 등록 확인
- [ ] App content → Data safety 제출·검토 완료
- [ ] App content → 광고 포함 여부 “예” 확인
- [ ] App content → 타깃 연령 및 Families 정책 적용 여부 결정
- [ ] App content → 콘텐츠 등급(IARC) 설문 완료
- [ ] App access → 심사용 활성 데모 계정과 로그인 절차 입력
- [x] Store listing → 앱 이름·짧은 설명·전체 설명 확정
- [ ] Store listing → 제작된 폰 스크린샷 6장 Console 업로드·노출 순서 확인
- [ ] Store listing → 태블릿 배포 유지 시 7/10인치 스크린샷 업로드
- [ ] Store listing → 1024×500 기능 그래픽 업로드
- [ ] App integrity → Play App Signing SHA-1/SHA-256을 Firebase·`assetlinks.json`과 대조
- [ ] Release → 최종 AAB, R8 mapping, native debug symbols 업로드 상태 확인

## 4. 제출 차단 기준

- 인증이 필요한 화면을 심사할 데모 계정이 없음
- Data safety와 개인정보처리방침 또는 실제 SDK 동작이 불일치
- 스토어 이미지가 현재 앱 UI·기능과 다름
- Play App Signing 인증서가 Firebase OAuth 또는 `assetlinks.json`과 불일치
- 최종 서명 AAB와 mapping/native symbols를 같은 versionCode로 보관하지 않음
