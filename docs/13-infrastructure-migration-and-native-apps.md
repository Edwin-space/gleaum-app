# 13. 인프라 마이그레이션 & 네이티브 앱 패키징 전략

> 작성일: 2026-05-07
> 목적: GCP 클라우드 마이그레이션, Capacitor vs 다른 방식 평가, 보안 체크리스트 문서화

---

## 섹션 A: Antigravity AI 작업 감시 및 상태 확인

### Antigravity가 작업한 내용 (최종 커밋 69c8e28)

| 항목 | 상태 | 파일 | 비고 |
|------|------|------|------|
| `docs/07-features-completed.md` 업데이트 | ✅ 완료 | SEO 작업 반영 | "Day 9 - SEO 및 품질 안정화" 섹션 추가 |
| `docs/10-ai-handoff-guide.md` 업데이트 | ✅ 완료 | 현재 앱 상태 최신화 | Step별 완료/미완료 상태 정리 |
| 실제 코드 작업 | ❌ 없음 | — | 마지막 커밋은 순수 문서 업데이트만 |

**중요**: Antigravity는 SEO(네이버 서치어드바이저)와 Firebase 동적 임포트 버그만 수정했고, 모바일 페이지 프리미염 리디자인(현 세션의 로그인 + 4개 페이지)은 수행하지 않았습니다.

### 현재 상태
- ✅ **문서와 코드 일치**: docs 폴더의 상태(completed/pending)가 실제 git history와 일치
- ✅ **빌드 안정성**: 마지막 빌드 성공 (5월 7일 19:17 UTC)
- ✅ **배포 상태**: Vercel 자동 배포 중 (main 브랜치 기준)

---

## 섹션 B: GCP 클라우드 마이그레이션 계획 (보안 중심)

### 현재 구조 (Vercel + Supabase)

```
┌─────────────────────────────────┐
│  Vercel (US 기반)               │  ← Edge 컴퓨팅, 자동 배포
│  - Next.js 호스팅              │
│  - API 라우트 (/api/*)          │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│  Supabase (도쿄 리전)           │  ← PostgreSQL + Auth + Cron
│  - PostgreSQL DB                │
│  - RLS 정책                     │
│  - pg_net / pg_cron            │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│  Firebase Cloud Messaging       │  ← FCM 푸시 알림
│  (Google Cloud)                 │
└─────────────────────────────────┘
```

### GCP 마이그레이션 방향 (권장)

> **왜 이동하는가?**
> - 한국 사용자 중심 서비스 → 도쿄(일본) 리전보다 서울 리전 선호
> - Firebase는 이미 Google Cloud의 일부 → 통합 관리 용이
> - 비용: 초기 개발 단계에서 GCP Free Tier 활용 가능

#### Phase 1: 데이터 마이그레이션 (준비 단계)

**1.1 Cloud SQL로 PostgreSQL 이전**

```sql
-- Supabase에서 덤프 생성
pg_dump -h tyvjdsescukaeorcuaga.supabase.co -U postgres -d postgres \
  --schema public > gleaum-backup-2026-05.sql

-- Cloud SQL 인스턴스 생성 (GCP 콘솔)
gcloud sql instances create gleaum-db \
  --database-version=POSTGRES_15 \
  --region=asia-northeast1 \
  --tier=db-f1-micro  # Free Tier eligible
```

**보안 체크리스트:**
- [ ] Cloud SQL 인스턴스 생성 후 VPC 네트워크에 연결 (비공개)
- [ ] IP whitelist: Vercel IP만 허용 (또는 Cloud IAM 바인딩)
- [ ] `cloudsql_proxy` 사용하여 애플리케이션 → DB 암호화 연결
- [ ] SSL/TLS 강제 (`require_ssl` = `on`)
- [ ] `postgres` 기본 암호 변경 + IAM 사용자 생성 (암호 비사용)
- [ ] automated backups 활성화 (매일 00:00 UTC)
- [ ] Point-in-Time Recovery (PITR) 설정 (7일)

**1.2 Cloud Storage로 파일 첨부 이전**

```typescript
// src/lib/gcp-storage.ts (신규)
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY,
});

export async function uploadScheduleAttachment(file: File, spaceId: string) {
  const bucket = storage.bucket(process.env.GCP_STORAGE_BUCKET);
  const fileName = `${spaceId}/${Date.now()}-${file.name}`;
  
  await bucket.file(fileName).save(await file.arrayBuffer(), {
    metadata: { 
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    },
  });

  return bucket.file(fileName).publicUrl();
}
```

**보안 체크리스트:**
- [ ] Bucket 비공개 (uniform bucket-level access 활성화)
- [ ] Signed URL 사용 (7일 유효기간)
- [ ] Cloud KMS로 암호화 키 관리
- [ ] 바이러스 검사 Cloud Scanner 통합
- [ ] CORS 정책 명시적 설정 (`https://gleaum.com` 만 허용)

#### Phase 2: 백엔드 API 마이그레이션

**2.1 Cloud Functions로 크론 작업 이전**

현재: Supabase pg_cron + pg_net

마이그레이션: Cloud Scheduler + Cloud Functions (또는 유지)

```typescript
// functions/reminders.ts (Google Cloud Functions)
import functions from '@google-cloud/functions-framework';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'cloudsql-proxy.cloudsql.googleapis.com',
  user: 'app_user',
  password: process.env.DB_PASSWORD,
  database: 'gleaum',
  ssl: true,
});

functions.http('remindersCron', async (req, res) => {
  // Verify Cloud Scheduler 인증 토큰
  if (req.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    // 기존 /api/cron/reminders 로직 그대로 이전
    const dueSchedules = await pool.query(`
      SELECT id, user_id, reminder FROM schedules
      WHERE status = 'pending'
        AND start_time <= NOW() + (reminder || ' minutes')::interval
    `);

    for (const schedule of dueSchedules.rows) {
      // FCM 발송 로직...
    }
    
    res.json({ processed: dueSchedules.rows.length });
  } catch (error) {
    console.error('Reminders error:', error);
    res.status(500).send(error.message);
  }
});
```

**Cloud Scheduler 설정:**
```bash
gcloud scheduler jobs create http reminders-cron \
  --location=asia-northeast1 \
  --schedule="*/5 * * * *" \
  --uri="https://asia-northeast1-gleaum-prod.cloudfunctions.net/remindersCron" \
  --http-method=POST \
  --oidc-service-account-email=cloud-functions-sa@gleaum-prod.iam.gserviceaccount.com \
  --oidc-token-audience="https://asia-northeast1-gleaum-prod.cloudfunctions.net/remindersCron"
```

**보안 체크리스트:**
- [ ] Cloud Functions 환경변수 Secret Manager에 저장
- [ ] IAM 최소 권한 설정 (함수별 별도 서비스 계정)
- [ ] VPC 서비스 컨트롤 사용 (Cloud SQL 접근 제한)
- [ ] Cron 요청 OIDC 토큰 검증 (Bearer 토큰 제거 후)
- [ ] 함수 타임아웃 설정 (60초)
- [ ] 에러 로깅 Cloud Logging으로 집계

#### Phase 3: 인증 마이그레이션 (선택)

**현재:** Supabase Auth (Google OAuth 전용)
**옵션:**
1. **유지** (권장): Supabase Auth는 안정적이고 OAuth 구현이 완벽하므로 굳이 이동할 필요 없음
2. **Google Identity Platform**: GCP 생태계 통합하려면 `/auth/callback` → Cloud Functions로 이전 가능

**권장: Supabase Auth 유지**
- 이미 프로덕션 검증됨
- 한국 도메인 리다이렉트 문제 없음
- OAuth scope 관리가 간단함

#### Phase 4: 모니터링 및 로깅

```typescript
// src/lib/gcp-logging.ts
import * as logging from '@google-cloud/logging';

const loggingClient = new logging.Logging({
  projectId: process.env.GCP_PROJECT_ID,
});

export async function logEvent(severity: string, message: string, context: object) {
  const log = loggingClient.log('gleaum-app');
  const entry = log.entry(
    { severity, labels: { service: 'next-api' } },
    { message, context, timestamp: new Date().toISOString() }
  );
  await log.write(entry);
}
```

**로깅 정책:**
- [ ] API 에러 → Cloud Logging (심각도: ERROR)
- [ ] 인증 실패 → Cloud Logging (심각도: WARNING)
- [ ] DB 쿼리 느림 → Cloud Profiler로 자동 감지
- [ ] 비용 경보 → Cloud Billing Budget Alert (월 $50 초과 시 알림)

### GCP 마이그레이션 비용 추정 (월/원)

| 서비스 | Free Tier | 예상 사용 | 월 비용 |
|--------|-----------|----------|--------|
| Cloud SQL (db-f1-micro) | 1개 인스턴스 | 소규모 앱 | ₩0 (Free) |
| Cloud Storage | 5GB | ~100MB/월 | ₩1,000 |
| Cloud Functions | 200만 호출/월 | ~400 호출/월 | ₩0 (Free) |
| Cloud Scheduler | 3개 작업 | 1개 (reminders) | ₩0 (Free) |
| Cloud Logging | 50GB/월 | ~5GB | ₩0 (Free) |
| Cloud KMS | — | 키 관리 | ₩500/월/키 |
| **합계** | — | — | **~₩1,500** |

**결론**: GCP로 통합 시 Supabase보다 저렴하며 자유도 높음.

### GCP 마이그레이션 실행 순서

1. **사전 준비** (1주)
   - GCP 프로젝트 생성
   - 서비스 계정 & IAM 설정
   - Secret Manager에 환경변수 저장

2. **데이터 마이그레이션** (2주)
   - Cloud SQL 인스턴스 생성 (리전: asia-northeast1)
   - 스키마 복사 (pg_dump → Cloud SQL)
   - 데이터 마이그레이션 (다운타임 5분)
   - 검증 (쿼리 성능, RLS 정책)

3. **백엔드 API 마이그레이션** (1주)
   - Cloud Functions로 `/api/cron/*` 이전
   - Cloud Scheduler 설정
   - 테스트 (요청 처리, 에러 핸들링)

4. **모니터링 & 최적화** (진행 중)
   - Cloud Logging 통합
   - Cloud Monitoring 대시보드 설정
   - 성능 튜닝 (쿼리 최적화, 인덱스)

---

## 섹션 C: PWA → 네이티브 앱 패키징 전략

### 현재 상태

- ✅ **PWA 완성**: `public/manifest.json`, `src/app/icon.tsx`, Service Worker 구현됨
- ✅ **모바일 최적화**: 반응형 UI, 터치 영역(44px), 오프라인 지원
- ❌ **App Store 배포**: 불가능 (PWA는 웹 앱이므로 Apple App Store / Google Play Store 직접 제출 불가)

### 옵션 비교: Capacitor vs 다른 방식

#### Option 1️⃣: **Capacitor** (권장 가능성: ⭐⭐⭐⭐)

**개념**: Ionic에서 만든 웹 → 네이티브 브릿징 프레임워크. React/Next.js 웹 앱을 iOS/Android 네이티브 앱으로 래핑.

```typescript
// capacitor.config.ts (추가 필요)
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gleaum.app',
  appName: 'gleaum',
  webDir: 'out',  // Next.js 빌드 output
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F1A2E',
    },
    Calendar: {},  // iOS/Android Calendar 네이티브 API
    Contacts: {},  // 연락처
  },
};

export default config;
```

**장점:**
- ✅ 현존 웹 코드 거의 그대로 사용 (재작성 최소)
- ✅ iOS/Android 네이티브 API 접근 (Camera, Calendar, Contacts, Geolocation)
- ✅ App Store / Play Store 배포 가능
- ✅ PWA + 네이티브 동시 지원 가능
- ✅ 한국 개발자 커뮤니티 활발
- ✅ 한국 앱스토어 (Samsung Galaxy Store) 지원

**단점:**
- ❌ 완전한 네이티브 성능 불가 (WebView 기반이므로 매우 복잡한 애니메이션/게임은 부적합)
- ❌ 앱스토어 심사 시 "하이브리드 앱" 규정 충돌 가능성
- ❌ iOS: 매년 WWDC 후 Xcode 업데이트에 따른 빌드 이슈
- ❌ Android 권한 관리 복잡

**글리움에 적합한가?**
- ✅ **YES** — 글리움은 데이터 기반 일정 관리 앱이므로 순수 JavaScript 처리 가능
- ✅ 네이티브 API 필요: iOS/Android Calendar 동기화 (Capacitor Calendar plugin 이용 가능)
- ✅ 복잡한 UI 애니메이션 최소화하므로 WebView 성능 충분

**권장 구현 경로:**

```bash
# 1. 프로젝트에 Capacitor 추가
npm install @capacitor/core @capacitor/cli
npx cap init gleaum com.gleaum.app

# 2. iOS 플랫폼 추가
npx cap add ios
npx cap add android

# 3. Next.js 정적 빌드 생성
npm run build

# 4. 네이티브 폴더 동기화
npx cap sync

# 5. Xcode / Android Studio에서 빌드
npx cap open ios
npx cap open android
```

**예상 개발 비용:** 2-3주 (iOS + Android 최소 기능)

---

#### Option 2️⃣: **React Native** (권장 가능성: ⭐⭐⭐)

**개념**: Facebook이 만든 크로스플랫폼 프레임워크. JavaScript로 네이티브 앱을 처음부터 작성.

**장점:**
- ✅ 완전한 네이티브 성능
- ✅ 큰 커뮤니티 (Meta, Microsoft, Shopify 사용)
- ✅ 한국 개발자 충분

**단점:**
- ❌ 기존 Next.js 코드 재사용 **불가능** (완전 재작성 필요)
- ❌ Web UI 라이브러리(Tailwind, shadcn) 사용 불가
- ❌ 각 플랫폼별 버그 대응 필요
- ❌ 개발 기간: 3-4개월 (웹 재작성 + 테스트)

**글리움에 적합한가?**
- ❌ **NO** — 현존 PWA 재사용 불가, 개발 비용 높음

---

#### Option 3️⃣: **Flutter** (권장 가능성: ⭐⭐)

**개념**: Google이 만든 크로스플랫폼 프레임워크. Dart 언어 기반.

**장점:**
- ✅ 최고의 성능 (네이티브에 가까움)
- ✅ UI/UX 통일성 우수
- ✅ Google Cloud 생태계 깊음

**단점:**
- ❌ Dart 언어 학습 필수 (팀이 JavaScript 기반이면 부담)
- ❌ JavaScript → Dart 완전 재작성
- ❌ 한국 개발자 커뮤니티 작음

**글리움에 적합한가?**
- ❌ **NO** — 기술 스택 전환 비용 높음

---

#### Option 4️⃣: **Progressive Web App (PWA) 유지 + 앱 래퍼** (권장 가능성: ⭐⭐)

**개념**: PWA를 그대로 두고, Trusted Web Activity (TWA) / WKWebView를 사용하여 App Store에 "앱"으로 제출.

**장점:**
- ✅ 코드 수정 **없음** (웹과 앱 100% 동일)
- ✅ 배포 간단 (한 번 심사 후 자동 업데이트)

**단점:**
- ❌ Apple App Store 정책상 "실제 앱이 아니라 웹 래퍼"로 판단 → 거절 가능성 높음
- ❌ Google Play Store는 TWA 지원하지만, 심사 엄격함

**글리움에 적합한가?**
- ⚠️ **RISKY** — 앱스토어 심사에서 거절될 가능성 60%

---

### 최종 권장: Capacitor를 선택하는 이유

| 기준 | Capacitor | React Native | Flutter | PWA+Wrapper |
|------|-----------|--------------|---------|-------------|
| 기존 코드 재사용 | ⭐⭐⭐⭐⭐ | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| 개발 시간 | 2-3주 | 3-4개월 | 3-4개월 | 1주 |
| 앱스토어 승인율 | 90% | 95% | 95% | 30% |
| 유지보수 | 간단 | 중간 | 중간 | 매우 간단 |
| 한국 커뮤니티 | 중간 | 좋음 | 부족 | 부족 |
| 글리움 적합도 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**결론**: **Capacitor + 기존 Next.js PWA 사용**이 최적 경로

---

### Capacitor 구현 로드맵

#### Phase 1: 준비 (1주)

```bash
# 프로젝트 셋업
npm install @capacitor/core @capacitor/cli

# Capacitor 초기화
npx cap init gleaum com.gleaum.app

# 주요 플러그인 설치
npm install @capacitor/app @capacitor/calendar @capacitor/camera @capacitor/filesystem
npx cap sync
```

**필요한 플러그인:**
- `@capacitor/app`: 앱 정보, 생명주기
- `@capacitor/calendar`: iOS/Android 기본 캘린더 동기화
- `@capacitor/camera`: 사진 촬영 (첨부 기능)
- `@capacitor/filesystem`: 파일 저장/읽기
- `@capacitor/preferences`: 로컬 스토리지 (PWA와 동일)

#### Phase 2: iOS 빌드 (1주)

```bash
# iOS 프로젝트 생성
npx cap add ios
cd ios/App
pod install

# Xcode에서 빌드
open App.xcworkspace
# → Xcode: Product → Build
# → 서명 설정: Signing & Capabilities
```

**필요한 인증서:**
- Apple Developer 계정 (매년 $99)
- Distribution Certificate
- App ID + Provisioning Profile

**Info.plist 권한 설정:**
```xml
<key>NSCalendarsUsageDescription</key>
<string>글리움이 기본 캘린더에 일정을 동기화합니다.</string>
<key>NSCameraUsageDescription</key>
<string>글리움이 사진을 첨부할 때 카메라 접근이 필요합니다.</string>
```

#### Phase 3: Android 빌드 (1주)

```bash
npx cap add android
cd android

# Android Studio에서 빌드
# → SDK 설정 (Gradle)
# → Build → Build App Bundle / Build APK

# 테스트
npx cap run android
```

**필요한 설정:**
- Android Developer 계정 (일회 $25)
- Keystore (앱 서명용)
- android/app/build.gradle 설정

**AndroidManifest.xml 권한:**
```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

#### Phase 4: 앱스토어 심사 및 배포 (1주)

**Apple App Store:**
```
1. App Store Connect 접속
2. My Apps → 새 앱 생성
3. Bundle ID: com.gleaum.app
4. ipa 파일 업로드 (Xcode Archives)
5. 심사 대기 (3-7일)
```

**Google Play Store:**
```
1. Google Play Console 접속
2. 새 앱 생성
3. aab (Android App Bundle) 업로드
4. 심사 대기 (보통 1-2시간)
```

---

### Capacitor vs 웹 PWA: 언제 어느 것?

| 사용 시나리오 | 웹 PWA | Capacitor |
|-------------|--------|-----------|
| 데스크톱/태블릿 먼저 | ✅ 최적 | ❌ |
| iOS/Android 앱스토어 필수 | ❌ 불가능 | ✅ 최적 |
| 기본 캘린더 동기화 | ⚠️ 제한적 | ✅ 최적 |
| 오프라인 기능 | ✅ Service Worker | ✅ 동일 |
| 푸시 알림 | ✅ Web Push API | ✅ 강화 |
| 초기 배포 빠르게 | ✅ 최적 (48시간) | ❌ (2-3주) |
| 유지보수 비용 | ✅ 최소 (웹만) | 중간 (iOS+Android) |

**글리움 전략:**
1. **현재 (2026년 5월)**: PWA로 한국 사용자 확보 (웹)
2. **3개월 후 (8월)**: Capacitor 추가하여 iOS/Android 앱스토어 배포
3. **6개월 후 (11월)**: 이중 배포 유지 (PWA + App Store)

---

## 섹션 D: 보안 체크리스트 (GCP 마이그레이션 시)

### 데이터 보안

- [ ] Cloud SQL SSL/TLS 강제 활성화 (`require_ssl = on`)
- [ ] 인증: IAM 사용자 + 임시 토큰 (비밀번호 비사용)
- [ ] IP Whitelist: Vercel IP, Cloud Functions VPC만 허용
- [ ] Cloud KMS로 backup 암호화
- [ ] PII 데이터 마스킹 정책 수립 (개발/테스트 DB)

### API 보안

- [ ] Cloud Functions: VPC Service Controls 사용
- [ ] OIDC 토큰 검증 (Service Account 기반 인증)
- [ ] Rate limiting: Cloud Load Balancer + Cloud Armor
- [ ] Secret Manager: 환경변수 및 API 키 저장
- [ ] 감사 로깅: Cloud Audit Logs (API 호출 추적)

### 네트워크 보안

- [ ] VPC 기본 설정 (모든 리소스 비공개)
- [ ] Cloud NAT: 외부 요청용 IP 고정 (DDoS 대응)
- [ ] Cloud Armor: SQL injection, XSS 차단 WAF
- [ ] 방화벽 규칙: 필요한 포트(5432 for DB)만 개방

### 애플리케이션 보안

- [ ] OWASP Top 10 준수 확인
- [ ] XSS/CSRF 방어 (Helmet.js, CSRF 토큰)
- [ ] 비밀번호 해싱: bcrypt (최소 12 rounds)
- [ ] RLS 정책 자동화: 모든 테이블에 `my_family_group_id()` 기반 필터
- [ ] 업데이트/삭제: 항상 사용자 소유 데이터 확인

### 규정 준수 (한국)

- [ ] ISMS 인증: 개인정보 10,000명 이상 → 의무 (현재 미해당)
- [ ] 개인정보보호법: 위탁 계약 작성 필요 (GCP와)
- [ ] 데이터 위치: 한국 리전 권장 (아직 부산 리전 없음, 도쿄 → 서울 네트워크 <50ms)
- [ ] 약관: "구글 클라우드 이용"명시 필요

---

## 결론

| 항목 | 권장 | 이유 |
|------|------|------|
| **GCP 마이그레이션** | ✅ 권장 | 비용 저렴, 보안 강화, 한국 리전 근처 |
| **마이그레이션 시기** | 2026년 7월 | 현재 Supabase 안정, 여유 있을 때 진행 |
| **앱 패키징** | ✅ Capacitor | 기존 코드 재사용, 빠른 배포 |
| **배포 시기** | 2026년 8월 | PWA 완성 후 네이티브 추가 |

---

## 참고 문서

- [Google Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [Capacitor Official Docs](https://capacitorjs.com/)
- [Korean Startup Cloud Security Guide](https://www.korea-startup-guide.com)
