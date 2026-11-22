#!/bin/sh
# The emulators the scripts of e2e/android/ try the app on: started without a
# window, each as a capped unit of its own (it takes some gigabytes), on a
# port of its own, so that it is known by its name whatever else is
# connected. There are two devices:
#
#   new   Android 16, as a phone bought now: `emulator-5584`
#   old   Android 8.0, the oldest the app runs on (Tauri's own part for
#         Android does not start on 7), with the web view that came with
#         it, which is older than the page can use: `emulator-5586`. It
#         runs programs of 32 bits too.
#
#   e2e/android/emulator.sh start [new|old]   starts it, waits until Android is up
#   e2e/android/emulator.sh stop [new|old]    ends it
#   e2e/android/emulator.sh make [new|old]    makes the device (once), from its
#                                             system image, which must be installed
#
# A script is told which one by ANDROID_SERIAL; without it, the new one.
# Never run beside another capped unit: they compete for memory.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/../../packaging/android/env.sh"
case "${2:-new}" in
  new) name=glaukopis; port=5584; image="system-images;android-36.1;google_apis;x86_64"; profile=pixel_7 ;;
  old) name=glaukopis-8; port=5586; image="system-images;android-26;default;x86_64"; profile=pixel_5 ;;
  *) echo "the device is new or old" >&2; exit 2 ;;
esac
serial="emulator-$port"
unit="glaukopis-emulator-$port"

case "$1" in
  make)
    echo no | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd -n "$name" -k "$image" -d "$profile"
    ;;
  start)
    systemd-run --user --unit="$unit" --collect -q \
      -p MemoryHigh=5G -p MemoryMax=7G -p OOMPolicy=stop \
      --setenv=HOME="$HOME" --setenv=ANDROID_HOME="$ANDROID_HOME" --setenv=ANDROID_SDK_ROOT="$ANDROID_HOME" \
      "$ANDROID_HOME/emulator/emulator" -avd "$name" -port "$port" \
      -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect
    adb -s "$serial" wait-for-device
    until [ "$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 2; done
    echo "$serial is up"
    ;;
  stop)
    adb -s "$serial" emu kill 2>/dev/null || true
    systemctl --user stop "$unit" 2>/dev/null || true
    ;;
  *)
    echo "usage: $0 make|start|stop [new|old]" >&2
    exit 2
    ;;
esac
