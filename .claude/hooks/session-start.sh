#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

claude plugin marketplace add typesafe-ai/skills >/dev/null 2>&1 || true
claude plugin install typesafe@typesafe-ai >/dev/null 2>&1 || true
