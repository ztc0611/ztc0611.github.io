#!/usr/bin/env bash
#
# Regenerates assets/home/og-card.jpg, the 1200x630 social/embed card for the
# homepage (and portfolio.html, which redirects to it).
#
# card.html is the source of truth: it reuses the homepage's claret, bone and
# hairlines, and the same Duo render as the page's opening, so edit it and
# re-run rather than retouching the JPEG. Rendering through Chrome (not
# ImageMagick text) keeps the name's em-based tracking identical to the page.
#
# REQUIRES: Google Chrome, Python 3 with Pillow. Run on a Mac so system-ui
# resolves to SF Pro, as it does for visitors on Apple devices.

set -euo pipefail
cd "$(dirname "$0")"

CHROME='/Applications/Chrome.app/Contents/MacOS/Google Chrome'
[ -x "$CHROME" ] || CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
OUT='../../assets/home/og-card.jpg'

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Headless Chrome can linger after writing the file, hence the timeout.
timeout 90 "$CHROME" --headless=new --hide-scrollbars --allow-file-access-from-files \
  --user-data-dir="$work/profile" --window-size=1200,630 --force-device-scale-factor=1 \
  --virtual-time-budget=4000 --screenshot="$work/card.png" "file://$PWD/card.html" >/dev/null 2>&1 || true

[ -s "$work/card.png" ] || { echo "Chrome produced no screenshot" >&2; exit 1; }
python3 -c "
from PIL import Image
Image.open('$work/card.png').convert('RGB').save('$OUT', quality=88, optimize=True, progressive=True)
"
echo "wrote $OUT"
