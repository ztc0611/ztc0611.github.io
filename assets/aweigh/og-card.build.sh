#!/usr/bin/env bash
#
# Regenerates assets/aweigh/og-card.jpg — the 1200x630 social/embed card for the
# Aweigh project page.
#
# WHY THIS EXISTS: the card is a composite (text + iPhone/Watch device mockups).
# The source intermediates live only in /tmp and get wiped, so every time the
# tagline changed we had to reverse-engineer the layout from the flattened JPEG.
# This script is the source of truth instead — edit a line, re-run, done.
#
# USAGE:  ./og-card.build.sh          (run from anywhere; it cd's to its own dir)
#
# REQUIRES:
#   - ImageMagick 7+ (`magick`)
#   - SF Pro Display fonts in /Library/Fonts (Heavy + Semibold). Install the
#     "San Francisco" family from https://developer.apple.com/fonts/ if missing.
#   - Source assets (committed alongside this script):
#       ios-frame.webp, ios-schedule-poster.webp,
#       watchos-frame.webp, watchos-poster.webp
#
# TO EDIT THE CARD: change the three text lines below. Geometry/sizes match the
# live page's hero (bg #05080F, muted #94A3B8, mint #4ADE80).

set -euo pipefail
cd "$(dirname "$0")"

# ---- editable text -----------------------------------------------------------
WORDMARK='Aweigh.'
TAGLINE='Washington State Ferries, made with SwiftUI.'
TAGS='watchOS  ·  iOS  ·  prototype'
# ------------------------------------------------------------------------------

FONT_HEAVY='/Library/Fonts/SF-Pro-Display-Heavy.otf'
FONT_SEMI='/Library/Fonts/SF-Pro-Display-Semibold.otf'
OUT='og-card.jpg'

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 1) iPhone mockup: schedule screenshot seated inside the device frame.
magick -size 1380x2880 xc:none \
  \( ios-schedule-poster.webp -resize 1260x2736 \) -geometry +60+73 -composite \
  ios-frame.webp -compose Over -composite \
  "$work/iphone.png"

# 2) Apple Watch mockup: screenshot seated inside the watch frame.
magick -size 1120x1760 xc:none \
  \( watchos-poster.webp -resize 834x994 \) -geometry +143+384 -composite \
  watchos-frame.webp -compose Over -composite \
  "$work/watch.png"

# 3) Compose the card: flat bg, three text lines, then the two device mockups.
magick -size 1200x630 xc:'#05080F' \
  -font "$FONT_HEAVY" -pointsize 130 -fill white \
  -annotate +80+310 "$WORDMARK" \
  -font "$FONT_SEMI" -pointsize 26 -fill '#94A3B8' \
  -annotate +80+360 "$TAGLINE" \
  -font "$FONT_SEMI" -pointsize 17 -fill '#4ADE80' \
  -annotate +80+412 "$TAGS" \
  \( "$work/iphone.png" -resize x580 \) -geometry +862+25 -compose Over -composite \
  \( "$work/watch.png"  -resize x360 \) -geometry +740+240 -compose Over -composite \
  -quality 92 -strip "$OUT"

echo "Wrote $(pwd)/$OUT"
magick identify "$OUT"
