# 08-b. 향후 구현 예정 기능 메모

> 현재 미구현이지만 서비스 고도화 시 반드시 추가해야 할 기능 목록.
> 작성일: 2026-05-14

---

## Android 권한 복원 필요 항목

> 현재 `AndroidManifest.xml`에서 제거된 권한들. 아래 기능 개발 시 복원 필요.

### 카메라 (`android.permission.CAMERA`)
- **용도**: 일정/가계부 첨부파일 촬영, 프로필 사진 변경
- **복원 시 추가할 권한**: `CAMERA`, `READ_MEDIA_IMAGES`
- **함께 필요한 작업**:
  - `@capacitor/camera` 플러그인 설치 및 연동
  - iOS: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` Info.plist 항목 확인
  - Play Console 데이터 안전 섹션 업데이트

### 생체인증 (`USE_BIOMETRIC`, `USE_FINGERPRINT`)
- **용도**: 앱 잠금 해제, 가계부 민감 데이터 접근 보호, 로그인 간편 인증
- **복원 시 추가할 권한**: `USE_BIOMETRIC`, `USE_FINGERPRINT`
- **함께 필요한 작업**:
  - `@capacitor-community/biometric-auth` 플러그인 설치
  - iOS: `NSFaceIDUsageDescription` Info.plist 항목 추가
  - LocalAuthentication 프레임워크 연동

### 파일 접근 (`READ/WRITE_EXTERNAL_STORAGE`)
- **용도**: 첨부파일 로컬 저장 및 불러오기
- **복원 시 추가할 권한**:
  ```xml
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
      android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
      android:maxSdkVersion="29" />
  ```
- **주의**: Android 13+(API 33) 이상은 `READ_MEDIA_IMAGES`로 대체됨. 버전별 분기 처리 필수.

---

## Android 정식 출시 전 빌드 개선

### R8 난독화 활성화
`android/app/build.gradle`의 release `minifyEnabled true` 적용 완료. 아래 설정 변경 작업은 과거 TODO이며, 현재는 매 릴리즈의 `mapping.txt` 생성·Play Console 업로드 여부를 확인한다.

```groovy
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true  // false → true 변경
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release
    }
}
```

활성화 후 Play Console에 `mapping.txt` 업로드하면 크래시 리포트에서 실제 함수명 확인 가능.

---

## 기기 캘린더 연동 (향후 구현)

Google Calendar 연동을 제거하고 스마트폰 기기 내장 캘린더와 직접 연동하는 방식으로 전환 예정.

- **플러그인**: `@capacitor-community/calendar` (또는 직접 네이티브 브릿지 구현)
- **iOS**: `EventKit` 프레임워크, `NSCalendarsUsageDescription` Info.plist 추가
- **Android**: `READ_CALENDAR`, `WRITE_CALENDAR` 권한 추가
- **현재 상태**: `/settings/calendar` 페이지에 "업데이트 준비 중" 안내 표시 중

---

## iOS 앱 출시 준비 잔여 항목

| 항목 | 내용 |
|------|------|
| Push Notifications Capability | Xcode → Signing & Capabilities에서 추가 |
| Background Modes Capability | Remote notifications 체크 |
| APNs Auth Key | Apple Developer Center → Keys → 생성 후 Firebase Console 업로드 |
| App Store Connect | 앱 등록, 스크린샷, 심사 제출 |
| Supabase Redirect URL | `gleaum://auth/callback` 등록 |
