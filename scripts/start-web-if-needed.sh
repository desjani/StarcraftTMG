#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

if python3 - <<'PY'
import os
import socket

port = int(os.environ.get("PORT", "3000"))
s = socket.socket()
s.settimeout(0.2)
try:
    s.connect(("127.0.0.1", port))
except OSError:
    raise SystemExit(1)
else:
    raise SystemExit(0)
finally:
    s.close()
PY
then
  echo "Web server already running on http://localhost:${PORT}"
  exit 0
fi

echo "Starting web server on http://localhost:${PORT}"
exec npm run web
