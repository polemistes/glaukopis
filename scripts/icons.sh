#!/usr/bin/env bash
# Makes the icons of the application from the drawing of its author. The
# drawing and what is made of it are under CC BY-SA 3.0 Unported, and not
# under the licence of the program: see resources/brand/README.md.
#
#     scripts/icons.sh [the drawing]
#
# There are two drawings: the whole owl, resources/brand/owl.png, which is
# the mark where it is shown large, as on the first page; and the owl's head,
# resources/brand/owl-icon.png, drawn to be seen small, which is the icon
# of the application and the mark where it is small. Nothing is drawn here:
# each drawing is cut to what is drawn in it, set in the middle of a square
# of its own ground, and made smaller. Where it is made very small its
# lines are made darker, since lines that are thin grow faint when they are
# made smaller; that is all that is done to it. Needs ImageMagick, and the
# command line of Tauri for the icon of macOS.

set -euo pipefail
cd "$(dirname "$0")/.."

drawing=resources/brand/owl.png
icon_drawing=resources/brand/owl-icon.png
if [ $# -gt 0 ]; then
  cp "$1" "$drawing"
fi
if [ $# -gt 1 ]; then
  cp "$2" "$icon_drawing"
fi
[ -f "$drawing" ] || { echo "There is no drawing at $drawing." >&2; exit 1; }
[ -f "$icon_drawing" ] || { echo "There is no drawing at $icon_drawing." >&2; exit 1; }

work=$(mktemp -d "${TMPDIR:-/tmp}/glaukopis-icons.XXXXXX")
trap 'rm -rf "$work"' EXIT

# What is drawn, without the empty ground around it.
magick "$drawing" -fuzz 8% -trim +repage "$work/drawn.png"
magick "$icon_drawing" -fuzz 8% -trim +repage "$work/head.png"

# A square, with a margin of a twentieth at each side: of the head, for the icons.
magick "$work/head.png" -background white -gravity center \
  -extent "%[fx:max(w,h)*1.1]x%[fx:max(w,h)*1.1]" "$work/square.png"
magick "$work/square.png" -resize 1024x1024 -colorspace sRGB -define png:color-type=6 \
  resources/brand/glaukopis.png

# One size of the icon. The smaller, the darker its lines are made.
icon() {
  local size=$1 out=$2 gamma=1
  if [ "$size" -le 32 ]; then gamma=0.35; elif [ "$size" -le 64 ]; then gamma=0.6; fi
  magick "$work/square.png" -filter Box -resize "${size}x${size}" -level "0%,100%,$gamma" \
    -colorspace sRGB -define png:color-type=6 "$out"
}

icons=src-tauri/icons
for size in 16 24 32 48 64 128 256 512; do
  icon "$size" "$icons/${size}x${size}.png"
done
cp "$icons/256x256.png" "$icons/128x128@2x.png"
cp "$icons/512x512.png" "$icons/icon.png"
magick "$icons/16x16.png" "$icons/24x24.png" "$icons/32x32.png" "$icons/48x48.png" \
  "$icons/64x64.png" "$icons/256x256.png" "$icons/icon.ico"

# The icon of macOS is made by Tauri, which knows its form.
if command -v pnpm >/dev/null && pnpm exec tauri --version >/dev/null 2>&1; then
  pnpm exec tauri icon resources/brand/glaukopis.png -o "$work/tauri" >/dev/null
  cp "$work/tauri/icon.icns" "$icons/icon.icns"
else
  echo "Tauri is not here: $icons/icon.icns is left as it was." >&2
fi

# The marks within the application: the lines alone, on no ground, so that
# they can have the colour of the text in the light and in the dark. The
# whole owl where the mark is large; the head where it is small.
mark() {
  local from=$1 height=$2 out=$3 gamma=$4
  magick "$from" -filter Box -resize "x${height}" -level "0%,100%,$gamma" \
    -colorspace Gray -negate -write mpr:lines +delete \
    \( -size 1x1 xc:black \) -scale "$(magick "$from" -filter Box -resize "x${height}" -format '%wx%h' info:)!" \
    mpr:lines -alpha off -compose CopyOpacity -composite -define png:color-type=6 "$out"
}
mark "$work/head.png" 96 src/lib/shell/owl-small.png 0.4
mark "$work/drawn.png" 512 src/lib/shell/owl.png 1

echo "The icons are made."
