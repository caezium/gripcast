#!/usr/bin/env bash
# Serve GripCast locally (geolocation + fetch need an http origin, not file://).
set -e
PORT="${1:-4558}"
cd "$(dirname "$0")"
echo "GripCast → http://localhost:${PORT}/gripcast.html"
python3 -m http.server "$PORT"
