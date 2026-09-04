#!/usr/bin/env bash
set -euo pipefail

# Trigger automatic production deploy.
# Priority:
# 1) VERCEL_DEPLOY_HOOK_URL (Vercel Deploy Hook)
# 2) vercel CLI with VERCEL_TOKEN + linked project

if [[ -n "${VERCEL_DEPLOY_HOOK_URL:-}" ]]; then
  echo "Triggering Vercel Deploy Hook..."
  curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"
  echo
  echo "Deploy hook triggered."
  exit 0
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "Deploying with Vercel CLI..."
  npx --yes vercel@latest pull --yes --environment=production --token="$VERCEL_TOKEN"
  npx --yes vercel@latest build --prod --token="$VERCEL_TOKEN"
  npx --yes vercel@latest deploy --prebuilt --prod --token="$VERCEL_TOKEN"
  exit 0
fi

cat <<'EOF'
No deploy trigger configured.

Option A — Vercel Git auto-deploy (recommended)
1. Claim/open your Vercel project
2. Settings → Git → Connect repository
3. Every push to main deploys automatically

Option B — Deploy Hook
1. Vercel → Project → Settings → Git → Deploy Hooks
2. Create hook for Production / main
3. export VERCEL_DEPLOY_HOOK_URL='https://api.vercel.com/v1/integrations/deploy/...'
4. npm run deploy:auto

Option C — GitHub Actions secrets
Add VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
then push to main (workflow: Auto Deploy)
EOF
exit 1
