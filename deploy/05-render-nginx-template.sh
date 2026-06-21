#!/bin/sh
set -eu

template="/etc/nginx/templates/default.conf.template"

if [ "${ENABLE_API_PROXY:-false}" != "true" ] || [ -z "${API_PROXY_URL:-}" ]; then
  sed -i '/# BEGIN API PROXY/,/# END API PROXY/d' "$template"
fi
