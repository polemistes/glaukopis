#!/bin/sh
# The emulator the scripts of e2e/android/ try the app on: started without a
# window, as a capped unit of its own (it takes some gigabytes), on a port
# of its own, so that it is `emulator-5584` whatever else is connected.
#
#   e2e/android/emulator.sh start     starts it and waits until Android is up
#   e2e/android/emulator.sh stop      ends it
#   e2e/android/emulator.sh make      makes its device (once), from the
#                                     system image that is installed
#
# Never run beside another capped unit: they compete for memory.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/../../packaging/android/env.sh"
name=glaukopis
port=5584
serial="emulator-$port"
unit=glaukopis-emulator

case "$1" in
  make)
    image="${2:-system-images;android-36.1;google_apis;x86_64}"
    echo no | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd -n "$name" -k "$image" -d pixel_7
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
    echo "usage: $0 make|start|stop" >&2
    exit 2
    ;;
esac
