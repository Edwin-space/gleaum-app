#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# 글리움 git hooks 설치 스크립트
#
# 새 환경(집 MacBook 등)에서 clone 후 실행:
#   bash scripts/install-hooks.sh
# ──────────────────────────────────────────────────────────────────────────────

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"
PROJECT_DIR="$(git rev-parse --show-toplevel)"

# NAS 경로: 기기별로 Synology Drive 마운트 위치가 다를 수 있으므로 자동 감지
detect_nas_env_dir() {
  local candidates=(
    "/Users/edwin/Sync-NAS/#1. Personal/Project/Gleaum-env"
    "$HOME/Sync-NAS/#1. Personal/Project/Gleaum-env"
    "$HOME/SynologyDrive/#1. Personal/Project/Gleaum-env"
  )
  for path in "${candidates[@]}"; do
    if [ -d "$(dirname "$path")" ]; then
      echo "$path"
      return
    fi
  done
  echo ""
}

NAS_ENV_DIR=$(detect_nas_env_dir)

echo "🔧 git hooks 설치 중..."

# ── post-push 훅 생성 ────────────────────────────────────────────────────────
cat > "$HOOKS_DIR/post-push" << HOOK
#!/bin/bash
PROJECT_DIR="$PROJECT_DIR"
NAS_ENV_DIR="$NAS_ENV_DIR"

echo ""
if [ -n "\$NAS_ENV_DIR" ] && [ -d "\$(dirname "\$NAS_ENV_DIR")" ]; then
  mkdir -p "\$NAS_ENV_DIR"
  if [ -f "\$PROJECT_DIR/.env.local" ]; then
    cp "\$PROJECT_DIR/.env.local" "\$NAS_ENV_DIR/.env.local"
    cp "\$PROJECT_DIR/.env.local" "\$NAS_ENV_DIR/.env.local.\$(date +%Y%m%d)"
    echo "🔑 [post-push] .env.local → NAS 백업 완료"
  fi
else
  echo "ℹ️  [post-push] NAS 미연결 — .env.local 백업 건너뜀"
fi

echo "✅ [post-push] push 완료 — 다른 기기에서 이어 작업: git pull && npm install"
exit 0
HOOK

chmod +x "$HOOKS_DIR/post-push"
echo "✅ post-push 훅 설치 완료"

if [ -n "$NAS_ENV_DIR" ]; then
  echo "   NAS 경로: $NAS_ENV_DIR"
else
  echo "   ⚠️  NAS 경로 자동 감지 실패 — Synology Drive 연결 후 재실행하세요"
fi
