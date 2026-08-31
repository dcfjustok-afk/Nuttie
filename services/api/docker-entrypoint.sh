#!/bin/sh
set -eu

# Memory mode is intentionally available only for non-production previews.
if [ "${NODE_ENV:-development}" != "production" ] && [ "${ALLOW_IN_MEMORY:-false}" = "true" ]; then
  echo '{"level":"info","message":"database migrations skipped","reason":"ALLOW_IN_MEMORY=true"}'
else
  if [ -z "${DATABASE_URL:-}" ]; then
    echo '{"level":"error","message":"DATABASE_URL is required; refusing to start without persistent storage"}' >&2
    exit 1
  fi

  attempts="${MIGRATION_ATTEMPTS:-30}"
  case "$attempts" in
    ''|*[!0-9]*)
      echo '{"level":"error","message":"MIGRATION_ATTEMPTS must be a positive integer"}' >&2
      exit 1
      ;;
  esac
  if [ "$attempts" -lt 1 ]; then
    echo '{"level":"error","message":"MIGRATION_ATTEMPTS must be a positive integer"}' >&2
    exit 1
  fi

  retry_delay="${MIGRATION_RETRY_DELAY_SECONDS:-2}"
  case "$retry_delay" in
    ''|*[!0-9]*)
      echo '{"level":"error","message":"MIGRATION_RETRY_DELAY_SECONDS must be a non-negative integer"}' >&2
      exit 1
      ;;
  esac

  attempt=1
  while [ "$attempt" -le "$attempts" ]; do
    if node /app/scripts/migrate.mjs; then
      break
    fi
    if [ "$attempt" -eq "$attempts" ]; then
      echo '{"level":"error","message":"database migration did not complete; refusing to start"}' >&2
      exit 1
    fi
    sleep "$retry_delay"
    attempt=$((attempt + 1))
  done
fi

exec "$@"
