#!/usr/bin/env bash
# Phase 0 QA — Universal Media UI (build + manual checklist)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Frontend Phase 0 — automated checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ ! -f .env.local && ! -f .env ]]; then
  echo "WARN: No .env or .env.local found. Copy .env.example → .env.local and set Clerk keys."
fi

echo "→ npm run build"
npm run build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Manual UI checklist (do in browser with API on :8080)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat <<'EOF'

Prerequisites:
  • Backend: go run ./cmd/server/main.go  (port 8080)
  • Frontend: npm run dev  (port 3000)
  • .env.local: Clerk keys + BACKEND_URL=http://localhost:8080

[ ] 1. Sign in → lands on /dashboard
[ ] 2. Upload a PNG/JPEG via drop zone → appears in grid
[ ] 3. Rename an item → name updates; refresh keeps new name
[ ] 4. Open viewer → image/video/audio renders
[ ] 5. Delete an item → removed from grid; refresh stays gone
[ ] 6. Visit /upload → redirects to /dashboard
[ ] 7. Image editor: /images/<id> (lowercase) — use Edit on grid card, sliders change preview
[ ] 8. Sign out → /dashboard redirects to home

Backend script (from Go repo, with Clerk token):
  CLERK_TEST_TOKEN="$(node -e '')"  # see below
  ./scripts/phase0-qa.sh

Get Clerk token in browser console (signed in):
  await window.Clerk.session.getToken()

EOF

echo "Done."
