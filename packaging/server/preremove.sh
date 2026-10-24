#!/bin/sh
# Before the package is removed, not when it is upgraded: the server is
# stopped, and no longer started with the computer. Debian says "remove",
# Fedora 0. The projects it kept stay in /var/lib/glaukopis-server.
case "$1" in
  remove | 0)
    if [ -d /run/systemd/system ]; then
      systemctl disable --now glaukopis-server.service >/dev/null 2>&1 || true
    fi
    ;;
esac
exit 0
