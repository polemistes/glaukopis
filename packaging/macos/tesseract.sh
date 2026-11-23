#!/usr/bin/env bash
# Tesseract for the installers of macOS, built from its sources for the
# oldest macOS Glaukopis runs on (minimumSystemVersion in
# src-tauri/tauri.conf.json), with Leptonica and libpng built into it, so
# that it needs nothing but what every macOS has. Homebrew's is built for the
# macOS it is built on, and an older Mac refuses to run it.
#
# Pictures reach Tesseract as PNG (the core reads every other kind itself),
# and the PDFs it makes hold text only, so PNG is the one kind of picture it
# is made to read; and TIFF, with nothing but zlib, in which Leptonica keeps
# a font of its own, and says so each time it starts where it cannot, and
# JPEG, without which Leptonica reads no TIFF. Its data are those Homebrew gives it: English and the
# orientation of pages, from tessdata_fast, with its configurations and the
# font of its PDFs.
#
#   packaging/macos/tesseract.sh <folder>
#
# makes <folder>/tesseract and <folder>/tessdata. It runs on Linux as well,
# to try it, where nothing is said of macOS.
set -euo pipefail

least=11.0
mkdir -p "$1"
out=$(cd "$1" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
prefix="$work/prefix"
jobs=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)

if command -v sha256sum > /dev/null; then sum() { sha256sum "$@"; }; else sum() { shasum -a 256 "$@"; }; fi

# Fetched and checked against what was fetched when this was written.
fetch() {
  local url=$1 expected=$2 file="$work/$(basename "$1")"
  curl -fsSL --retry 3 -o "$file" "$url"
  echo "$expected  $file" | sum -c - > /dev/null || { echo "$url is not what was expected" >&2; exit 1; }
  echo "$file"
}

common=(
  -DCMAKE_BUILD_TYPE=Release
  -DCMAKE_INSTALL_PREFIX="$prefix"
  -DCMAKE_PREFIX_PATH="$prefix"
  -DCMAKE_INSTALL_LIBDIR=lib
  -DBUILD_SHARED_LIBS=OFF
  -DCMAKE_POSITION_INDEPENDENT_CODE=ON
  -DCMAKE_FIND_FRAMEWORK=NEVER
  # Homebrew's libraries, which GitHub's Macs have, are never taken.
  -DCMAKE_IGNORE_PREFIX_PATH="/opt/homebrew;/usr/local"
)
if [ "$(uname)" = Darwin ]; then
  export MACOSX_DEPLOYMENT_TARGET=$least
  common+=(-DCMAKE_OSX_DEPLOYMENT_TARGET=$least)
fi

build() {
  local source=$1
  shift
  cmake -S "$source" -B "$source/out" "${common[@]}" "$@" > "$work/$(basename "$source").log" ||
    { cat "$work/$(basename "$source").log" >&2; exit 1; }
  cmake --build "$source/out" --parallel "$jobs" > /dev/null
  cmake --install "$source/out" > /dev/null
}

cd "$work"
tar -xzf "$(fetch https://github.com/pnggroup/libpng/archive/refs/tags/v1.6.59.tar.gz \
  2540302a1844ad2b2b501977abecfa850f265f97b78f065a712ab4074a89f5b5)"
tar -xzf "$(fetch https://github.com/DanBloomberg/leptonica/releases/download/1.87.0/leptonica-1.87.0.tar.gz \
  c73363397f96eb1295602bf44d708a994ad42046c791bf03ea0505d829bdb6a7)"
tar -xzf "$(fetch https://github.com/tesseract-ocr/tesseract/archive/refs/tags/5.5.4.tar.gz \
  a8dbf8b8c8ee427ff6ad1d99116502feaf59440af1adb893caf60a6576826cf4)"
tar -xzf "$(fetch https://download.osgeo.org/libtiff/tiff-4.7.1.tar.gz \
  f698d94f3103da8ca7438d84e0344e453fe0ba3b7486e04c5bf7a9a3fabe9b69)"
tar -xzf "$(fetch https://github.com/libjpeg-turbo/libjpeg-turbo/releases/download/3.1.3/libjpeg-turbo-3.1.3.tar.gz \
  075920b826834ac4ddf97661cc73491047855859affd671d52079c6867c1c6c0)"

build libpng-1.6.59 -DPNG_SHARED=OFF -DPNG_STATIC=ON -DPNG_TESTS=OFF -DPNG_TOOLS=OFF -DPNG_FRAMEWORK=OFF
build tiff-4.7.1 -Dtiff-static=ON -Dtiff-tools=OFF -Dtiff-tests=OFF -Dtiff-contrib=OFF -Dtiff-docs=OFF \
  -Dtiff-cxx=OFF -Dtiff-opengl=OFF -Dzlib=ON -Dlibdeflate=OFF -Djpeg=OFF -Dold-jpeg=OFF -Djbig=OFF -Dlerc=OFF \
  -Dlzma=OFF -Dzstd=OFF -Dwebp=OFF
build libjpeg-turbo-3.1.3 -DENABLE_SHARED=OFF -DENABLE_STATIC=ON -DWITH_SIMD=OFF -DWITH_TURBOJPEG=OFF \
  -DWITH_TOOLS=OFF -DWITH_TESTS=OFF
# The libraries are named to Leptonica: libtiff's description for CMake names
# a target of its own build (CMath::CMath), which Leptonica cannot find, and
# without it a system's own would be taken. Leptonica links zlib and the
# mathematics itself.
build leptonica-1.87.0 -DCMAKE_DISABLE_FIND_PACKAGE_Tiff=ON \
  -DTIFF_LIBRARY_RELEASE="$prefix/lib/libtiff.a" -DTIFF_INCLUDE_DIR="$prefix/include" \
  -DJPEG_LIBRARY_RELEASE="$prefix/lib/libjpeg.a" -DJPEG_INCLUDE_DIR="$prefix/include" \
  -DPNG_LIBRARY_RELEASE="$prefix/lib/libpng16.a" -DPNG_PNG_INCLUDE_DIR="$prefix/include" \
  -DBUILD_PROG=OFF -DSTRICT_CONF=ON -DENABLE_ZLIB=ON -DENABLE_PNG=ON -DENABLE_TIFF=ON \
  -DENABLE_JPEG=ON -DENABLE_GIF=OFF -DENABLE_WEBP=OFF -DENABLE_OPENJPEG=OFF
build tesseract-5.5.4 -DLeptonica_DIR="$prefix/lib/cmake/leptonica" -DBUILD_TRAINING_TOOLS=OFF \
  -DBUILD_TESTS=OFF -DGRAPHICS_DISABLED=ON -DOPENMP_BUILD=OFF -DENABLE_NATIVE=OFF -DENABLE_CCACHE=OFF \
  -DDISABLE_TIFF=ON -DDISABLE_ARCHIVE=ON -DDISABLE_CURL=ON -DINSTALL_CONFIGS=ON

cp "$prefix/bin/tesseract" "$out/"
strip "$out/tesseract"
mkdir -p "$out/tessdata"
cp -R "$prefix/share/tessdata/." "$out/tessdata/"
cp "$(fetch https://github.com/tesseract-ocr/tessdata_fast/raw/4.1.0/eng.traineddata \
  7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2)" "$out/tessdata/"
cp "$(fetch https://github.com/tesseract-ocr/tessdata_fast/raw/4.1.0/osd.traineddata \
  9cf5d576fcc47564f11265841e5ca839001e7e6f38ff7f7aacf46d15a96b00ff)" "$out/tessdata/"
mkdir -p "$out/licenses"
cp tesseract-5.5.4/LICENSE "$out/licenses/tesseract-LICENSE"
cp leptonica-1.87.0/leptonica-license.txt "$out/licenses/leptonica-LICENSE"
cp libpng-1.6.59/LICENSE "$out/licenses/libpng-LICENSE"
cp tiff-4.7.1/LICENSE.md "$out/licenses/libtiff-LICENSE.md"
cp libjpeg-turbo-3.1.3/LICENSE.md "$out/licenses/libjpeg-turbo-LICENSE.md"

if [ "$(uname)" = Darwin ]; then
  # Stripped, it is signed anew, as Apple silicon needs every program to be.
  codesign --force -s - "$out/tesseract"
  # Nothing of the system's but what every macOS has.
  if otool -L "$out/tesseract" | tail -n +2 | grep -vE '^\s*(/usr/lib/|/System/Library/)'; then
    echo "Tesseract needs libraries macOS does not have" >&2
    exit 1
  fi
  made=$(otool -l "$out/tesseract" | awk '/LC_BUILD_VERSION/ {b=1} b && $1 == "minos" {print $2; exit}')
  echo "Tesseract is made for macOS $made and newer"
  [ "$made" = "$least" ] || { echo "not for macOS $least" >&2; exit 1; }
fi

# What it says of itself, with nothing said as an error.
TESSDATA_PREFIX="$out/tessdata" "$out/tesseract" --version 2> "$work/said"
TESSDATA_PREFIX="$out/tessdata" "$out/tesseract" --list-langs 2>> "$work/said"
if grep -i error "$work/said"; then exit 1; fi
