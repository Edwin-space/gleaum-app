#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# 글리움 git hooks 설치 스크립트
#
# 새 환경에서 clone 후, 또는 훅이 사라진 경우 실행:
#   bash scripts/install-hooks.sh
# ──────────────────────────────────────────────────────────────────────────────

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

echo "🔧 git hooks 설치 중..."

# ── post-push: NAS 동기화 ───────────────────────────────────────────────────
cat > "$HOOKS_DIR/post-push" << 'HOOK'
#!/bin/bash
SRC="/Volumes/WD_BLACK/Ai Works/gleaum/"
DEST="/Users/edwin/Sync-NAS/#1. Personal/Project/Gleaum/"

if [ ! -d "$DEST" ]; then
  echo "⚠️  [post-push] NAS 경로 없음: $DEST (NAS 연결 확인 필요)"
  exit 0
fi

echo ""
echo "🔄 [post-push] NAS 동기화 중..."

rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='out/' \
  --exclude='.env*' \
  --exclude='*.local' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='android/.gradle/' \
  --exclude='android/app/build/' \
  --exclude='android/build/' \
  --exclude='android/local.properties' \
  --exclude='ios/App/Pods/' \
  --exclude='ios/.xcode.env.local' \
  --exclude='*.keystore' \
  --exclude='*.jks' \
  "$SRC" "$DEST"

[ $? -eq 0 ] && echo "✅ [post-push] NAS 동기화 완료" || echo "❌ [post-push] NAS 동기화 실패"
exit 0
HOOK

chmod +x "$HOOKS_DIR/post-push"
echo "✅ post-push 훅 설치 완료 → $HOOKS_DIR/post-push"
echo ""
echo "📋 설치된 훅:"
ls -la "$HOOKS_DIR" | grep -v sample | grep -v "^total" | grep -v "^d"
