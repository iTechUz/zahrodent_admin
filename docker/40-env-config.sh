#!/bin/sh
# Runs from the nginx image entrypoint (/docker-entrypoint.d) before nginx starts.
# Writes the runtime config read by src/lib/api/runtime-config.ts, so one image can be
# pointed at any API with `docker run --env-file .env` (no rebuild):
#   window.__ENV__ = {"VITE_API_URL":"https://api.example.uz"};
# Only the variables listed in RUNTIME_ENV_VARS are exposed — everything in this file
# is public (it is served to the browser).
set -eu

TARGET="${ENV_CONFIG_PATH:-/usr/share/nginx/html/env-config.js}"
VARS="${RUNTIME_ENV_VARS:-VITE_API_URL}"

json_escape() {
  # backslash, double quote and "<" (no </script> injection); strip CR/LF
  printf '%s' "$1" | tr -d '\r\n' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g'
}

body=""
for name in $VARS; do
  case "$name" in
    *[!A-Za-z0-9_]* | "") echo "env-config: skipping invalid name '$name'" >&2; continue ;;
  esac
  eval "isset=\${$name+x}"
  [ -n "$isset" ] || continue
  eval "value=\${$name}"
  entry="\"$name\":\"$(json_escape "$value")\""
  if [ -z "$body" ]; then body="$entry"; else body="$body,$entry"; fi
done

printf 'window.__ENV__ = {%s};\n' "$body" > "$TARGET"
echo "env-config: wrote $TARGET ($(printf '%s' "$VARS" | wc -w | tr -d ' ') allowed var(s))"
