#!/usr/bin/env bash
# start.sh

# 1. Launch Redis (if not already running)
if ! pgrep -x redis-server >/dev/null; then
  # Adjust the path if you compiled Redis elsewhere
  ~/redis-stable/src/redis-server --save "" --appendonly no &
fi

# 2. Start your Node server
node ~/www/backend/server.js
