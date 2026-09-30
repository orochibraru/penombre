#!/bin/sh
# Renders every app icon from the logo: the moon on a white tile for light
# mode, on a black one for dark. Run it after the logo or its colours change:
#
#   mise run icons
#
# Needs rsvg-convert (brew install librsvg) and ffmpeg.
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
command -v rsvg-convert >/dev/null || { echo "rsvg-convert is missing: brew install librsvg" >&2; exit 1; }

# The logo's drawing, from desktop/assets/logo-{light,dark}.svg: only the
# gradient's first stop differs between the two.
moon() {
  cat <<SVG
<defs><linearGradient id="l" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="$1"/><stop offset="1" stop-color="#b94082"/></linearGradient><radialGradient id="s" cx="31" cy="17" r="20" gradientUnits="userSpaceOnUse"><stop offset="0.72" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient><mask id="e"><rect width="48" height="48" fill="#fff"/><circle cx="31" cy="17" r="20" fill="url(#s)"/></mask></defs><g transform="translate($2 $2) scale($3)"><circle cx="24" cy="24" r="20" fill="none" stroke="$1" stroke-opacity="0.3" stroke-width="2"/><circle cx="24" cy="24" r="21" fill="url(#l)" mask="url(#e)"/></g>
SVG
}

# icon <light|dark> <tile> <moon offset> <moon scale>: a 1024 canvas.
icon() {
  if [ "$1" = dark ]; then ground="#000"; ink="#d8516a"; else ground="#fff"; ink="#911f43"; fi
  printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">%s%s</svg>\n' "$2" "$(moon "$ink" "$3" "$4")" |
    sed "s/GROUND/$ground/"
}

# macOS draws its icons as a rounded tile inside a margin.
tile='<rect x="100" y="100" width="824" height="824" rx="185" fill="GROUND"/>'
# iOS and Android cut the shape themselves: the ground runs to the edges.
bleed='<rect width="1024" height="1024" fill="GROUND"/>'

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

desktop="$root/desktop/assets"
ios="$root/mobile/iosApp/Penombre/Assets.xcassets/AppIcon.appiconset"
android="$root/mobile/androidApp/src/main/res"
mkdir -p "$ios" "$android/drawable-nodpi" "$android/drawable-night-nodpi"

for mode in light dark; do
  icon "$mode" "$tile" 224 12 > "$desktop/icon-$mode.svg"
  # No alpha channel: the App Store refuses an icon that has one.
  icon "$mode" "$bleed" 176 14 > "$tmp/ios-$mode.svg"
  rsvg-convert -w 1024 "$tmp/ios-$mode.svg" -o "$tmp/ios-$mode.png"
  ffmpeg -v error -y -i "$tmp/ios-$mode.png" -pix_fmt rgb24 "$ios/$mode.png"
  # Android's foreground: the moon alone, inside the adaptive icon's safe zone.
  icon "$mode" "" 272 10 > "$tmp/android-$mode.svg"
done
rsvg-convert -w 432 "$tmp/android-light.svg" -o "$android/drawable-nodpi/ic_launcher_foreground.png"
rsvg-convert -w 432 "$tmp/android-dark.svg" -o "$android/drawable-night-nodpi/ic_launcher_foreground.png"
# What the .app, the AppImage and the docs carry: one file, so the dark one.
rsvg-convert -w 1024 "$desktop/icon-dark.svg" -o "$desktop/icon.png"
