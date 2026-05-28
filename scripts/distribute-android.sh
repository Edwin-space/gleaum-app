#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# 글리움 Android — Firebase App Distribution 배포 스크립트
#
# 사전 요건:
#   1. Firebase CLI 설치: npm install -g firebase-tools
#   2. Firebase 로그인:   firebase login
#   3. 환경변수 설정 (키스토어):
#        export ANDROID_KEYSTORE_PATH=~/gleaum-release.keystore
#        export ANDROID_KEYSTORE_PASSWORD=...
#        export ANDROID_KEY_ALIAS=gleaum
#        export ANDROID_KEY_PASSWORD=...
#
# 사용법:
#   ./scripts/distribute-android.sh [릴리즈 노트 (선택)]
#
# 예시:
#   ./scripts/distribute-android.sh "알림 기능 개선, 버그 수정"
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
RELEASE_NOTES_FILE="$ANDROID_DIR/release-notes.txt"

# 릴리즈 노트 업데이트 (인자가 있으면)
if [ $# -ge 1 ]; then
  echo "$1" > "$RELEASE_NOTES_FILE"
  echo "📝 릴리즈 노트: $1"
fi

echo "📦 Next.js 빌드 중..."
cd "$PROJECT_ROOT"
npm run build

echo "🔄 Capacitor sync..."
npx cap sync android

echo "🏗️  Android release APK 빌드 중..."
cd "$ANDROID_DIR"
./gradlew assembleRelease

APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK 파일을 찾을 수 없습니다: $APK_PATH"
  exit 1
fi

echo "🚀 Firebase App Distribution 배포 중..."
firebase appdistribution:distribute "$APK_PATH" \
  --app "1:913127709928:android:c4334b982b98b282febd5d" \
  --groups "internal-testers" \
  --release-notes-file "$RELEASE_NOTES_FILE"

echo "✅ 배포 완료!"
