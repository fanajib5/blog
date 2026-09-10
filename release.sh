#!/usr/bin/env bash
# release.sh — rilis satu-perintah series Hijrah Frontend
# Jalankan dari root repo:  ./release.sh
# Paksa rilis sebelum tanggal target (hati-hati, langsung live):  ./release.sh --force
set -euo pipefail

TARGET_DATE="2026-09-24"
FILES=(
  content/writing/2026/hijrah-frontend-01/index.md
  content/writing/2026/hijrah-frontend-01/index.en.md
  content/writing/2026/hijrah-frontend-02/index.md
  content/writing/2026/hijrah-frontend-02/index.en.md
  content/writing/2026/hijrah-frontend-03/index.md
  content/writing/2026/hijrah-frontend-03/index.en.md
  content/writing/2026/hijrah-frontend-04/index.md
  content/writing/2026/hijrah-frontend-04/index.en.md
  content/writing/2026/hijrah-frontend-05/index.md
  content/writing/2026/hijrah-frontend-05/index.en.md
)
FORCE="${1:-}"

# ── 0. Guard tanggal ─────────────────────────────────────────────
TODAY=$(date +%F)
if [[ "$TODAY" < "$TARGET_DATE" && "$FORCE" != "--force" ]]; then
  echo "⏳  Hari ini $TODAY, target rilis $TARGET_DATE."
  echo "    Jalankan './release.sh --force' kalau benar-benar mau rilis lebih awal."
  exit 1
fi

# ── 1. Buka draft ────────────────────────────────────────────────
remaining=$(grep -l "^draft: true" "${FILES[@]}" 2>/dev/null | wc -l)
if [[ "$remaining" -eq 0 ]]; then
  echo "ℹ️  Semua artikel sudah draft:false."
else
  perl -pi -e 's/^draft: true$/draft: false/' "${FILES[@]}"
  echo "✅  $remaining artikel dibuka draftnya"
fi

# ── 2. Build sanity (verifikasi 10 halaman ter-render) ──────────
BUILD_FLAGS=""
if [[ "$TODAY" < "$TARGET_DATE" ]]; then
  BUILD_FLAGS="--buildFuture"   # rilis dipaksa lebih awal → paksa render
fi
rm -rf public
hugo $BUILD_FLAGS >/dev/null 2>&1 || echo "⚠️  hugo exit non-zero (biasanya WEB3FORMS_KEY lokal; tidak fatal di Cloudflare)"
rendered=$(find public/writing/2026 public/en/writing/2026 -path "*hijrah-frontend*" -name "index.html" 2>/dev/null | wc -l)
echo "📄  Halaman Hijrah Frontend ter-render: $rendered (harusnya 10)"
if [[ "$rendered" -lt 10 ]]; then
  echo "❌  Ada artikel yang tidak ter-render. Push dibatalkan."
  exit 1
fi

# ── 3. Commit + push ─────────────────────────────────────────────
git add "${FILES[@]}"
if git diff --cached --quiet; then
  echo "ℹ️  Tidak ada perubahan baru untuk di-commit."
else
  git commit --quiet -m "release: Hijrah Frontend series ($TARGET_DATE)"
fi

git push origin main
echo "🚀  Pushed! Cloudflare Pages sedang build."
echo "    Cek: https://najib.id/writing/2026/hijrah-frontend-01/"
