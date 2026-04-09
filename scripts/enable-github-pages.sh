#!/usr/bin/env bash
# Enable GitHub Pages for this repo (branch main, site root /).
# Fixes "404 / There isn't a GitHub Pages site here" when the repo has never had Pages turned on.
#
# Usage:
#   export GITHUB_TOKEN=ghp_xxxxxxxx   # classic PAT with "repo" scope, OR fine-grained with Pages: Write
#   ./scripts/enable-github-pages.sh
#
# Optional:
#   GITHUB_OWNER=mirithirsh-web GITHUB_REPO=Murder-Mystery ./scripts/enable-github-pages.sh
#
# Token: https://github.com/settings/tokens
# Fine-grained: repo → Permissions → "Pages" = Read and write, "Contents" = Read.

set -euo pipefail
OWNER="${GITHUB_OWNER:-mirithirsh-web}"
REPO="${GITHUB_REPO:-Murder-Mystery}"
TOKEN="${GITHUB_TOKEN:-}"
API="https://api.github.com/repos/${OWNER}/${REPO}/pages"

if [[ -z "$TOKEN" ]]; then
  echo "Error: set GITHUB_TOKEN to a personal access token (see script header)." >&2
  exit 1
fi

hdr=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
  -H "Authorization: Bearer ${TOKEN}"
)

body_create='{"build_type":"legacy","source":{"branch":"main","path":"/"}}'
body_update='{"build_type":"legacy","source":{"branch":"main","path":"/"}}'

code=$(curl -sS -o /tmp/mm_pages_body.json -w "%{http_code}" "${hdr[@]}" "$API")
echo "GET /pages → HTTP $code"

if [[ "$code" == "404" ]]; then
  echo "Creating Pages site (legacy: main, /)..."
  curl -sS -X POST "${hdr[@]}" "$API" -d "$body_create" | head -c 800 || true
  echo
elif [[ "$code" == "200" ]]; then
  echo "Pages already exists — forcing legacy source main + / ..."
  curl -sS -X PUT "${hdr[@]}" "$API" -d "$body_update" -w "\nHTTP %{http_code}\n"
else
  echo "Unexpected response:" >&2
  cat /tmp/mm_pages_body.json >&2
  exit 1
fi

echo
echo "Next: wait 1–3 minutes, then open:"
echo "  https://${OWNER}.github.io/${REPO}/"
echo "If it still 404s, check Settings → Pages (folder must be / root, not /docs)."
