#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install JS dependencies so typecheck, tests, lint, and build work in-session.
# Prefer `npm install` (idempotent; benefits from the cached container state).
npm install --no-audit --no-fund
