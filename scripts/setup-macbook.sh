#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# 글리움 — 집 MacBook 초기 세팅 스크립트
#
# 실행 방법 (집 MacBook 터미널):
#   bash setup-macbook.sh
#
# 전제 조건:
#   - Synology Drive 앱 설치 및 NAS 연결 완료
#   - Node.js 설치 (https://nodejs.org)
#   - git 설치
# ──────────────────────────────────────────────────────────────────────────────

set -e

REPO_URL="https://github.com/Edwin-space/gleaum-app.git"
TARGET_DIR="$HOME/Projects/gleaum"
NAS_ENV="$HOME/Sync-NAS/#1. Personal/Project/Gleaum-env/.env.local"

echo ""
echo "🚀 글리움 MacBook 개발 환경 세팅 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. 프로젝트 클론 또는 업데이트 ───────────────────────────────────────────
if [ -d "$TARGET_DIR/.git" ]; then
  echo ""
  echo "📂 기존 프로젝트 발견 → git pull"
  cd "$TARGET_DIR"
  git pull origin main
else
  echo ""
  echo "📥 GitHub에서 클론 중..."
  mkdir -p "$HOME/Projects"
  git clone "$REPO_URL" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

# ── 2. .env.local 복사 (NAS → 로컬) ─────────────────────────────────────────
echo ""
if [ -f "$NAS_ENV" ]; then
  cp "$NAS_ENV" "$TARGET_DIR/.env.local"
  echo "🔑 .env.local 복사 완료 (NAS → 로컬)"
else
  echo "⚠️  NAS에서 .env.local을 찾을 수 없습니다."
  echo "   경로 확인: $NAS_ENV"
  echo "   → Synology Drive가 연결되었는지 확인하거나"
  echo "     회사 Mac에서 git push를 한 번 실행하면 NAS에 백업됩니다."
fi

# ── 3. npm 패키지 설치 ────────────────────────────────────────────────────────
echo ""
echo "📦 npm 패키지 설치 중..."
npm install

# ── 4. git hooks 설치 ────────────────────────────────────────────────────────
echo ""
echo "🔧 git hooks 설치 중..."
bash scripts/install-hooks.sh

# ── 5. 빌드 테스트 ───────────────────────────────────────────────────────────
echo ""
echo "🔨 빌드 테스트 중..."
npm run build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 세팅 완료!"
echo ""
echo "개발 서버 시작: cd $TARGET_DIR && npm run dev"
echo ""
