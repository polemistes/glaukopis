#!/bin/sh
# After the package is installed or upgraded. The server is not started on
# installing: a password is to be set first (see
# /usr/share/doc/glaukopis-server/server.md). On an upgrade, a server that
# runs is started again with the new program.
if [ -d /run/systemd/system ]; then
  systemctl daemon-reload >/dev/null 2>&1 || true
  systemctl try-restart glaukopis-server.service >/dev/null 2>&1 || true
fi
exit 0
