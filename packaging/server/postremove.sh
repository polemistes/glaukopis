#!/bin/sh
# After the package is removed: systemd forgets the unit.
if [ -d /run/systemd/system ]; then
  systemctl daemon-reload >/dev/null 2>&1 || true
fi
exit 0
