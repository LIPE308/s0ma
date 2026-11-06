#!/bin/sh
set -eu
umask 077
case "${SOMA_SHA:-}" in ''|*[!a-f0-9]*) exit 1;; esac
test "${#SOMA_SHA}" -eq 40
case "${API_ORIGIN:-}" in https://*.trycloudflare.com) ;; *) exit 1;; esac
cd /var/www/korva
APP=$(docker compose ps -q app)
CADDY=$(docker compose ps -q caddy)
test -n "$APP" && test -n "$CADDY"
ROOT=/var/lib/soma-temporario
mkdir -p "$ROOT"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BEFORE="$ROOT/site-$STAMP.html"
BACKUP="$ROOT/caddy-before-tunel-$STAMP.json"
curl -fsS https://korvy.com.br/ > "$BEFORE"
curl -fsS "$API_ORIGIN/api/saude" > "$ROOT/saude-tunel.json"
docker exec "$CADDY" wget -qO- http://127.0.0.1:2019/config/ > "$BACKUP"
curl -fsS "https://raw.githubusercontent.com/LIPE308/s0ma/$SOMA_SHA/deploy/korvy/rota-caddy.cjs" > "$ROOT/rota.cjs"
docker cp "$ROOT/rota.cjs" "$APP:/tmp/soma-rota.cjs" >/dev/null
docker exec -i "$APP" node /tmp/soma-rota.cjs "$API_ORIGIN" < "$BACKUP" > "$ROOT/caddy-tunel.json"
docker cp "$ROOT/caddy-tunel.json" "$CADDY:/tmp/soma-tunel.json" >/dev/null
docker exec "$CADDY" caddy validate --config /tmp/soma-tunel.json
APPLIED=0
finish() {
  STATUS=$?
  trap - EXIT
  if [ "$STATUS" -ne 0 ] && [ "$APPLIED" -eq 1 ]; then
    docker cp "$BACKUP" "$CADDY:/tmp/soma-anterior.json" >/dev/null
    docker exec "$CADDY" caddy reload --config /tmp/soma-anterior.json || true
  fi
  exit "$STATUS"
}
trap finish EXIT
APPLIED=1
docker exec "$CADDY" caddy reload --config /tmp/soma-tunel.json
curl -fsS https://korvy.com.br/soma/api/saude > "$ROOT/saude-publica.json"
curl -fsS https://korvy.com.br/soma/ > "$ROOT/soma-publico.html"
grep -q '/soma/_expo/' "$ROOT/soma-publico.html"
curl -fsS https://korvy.com.br/ | cmp -s "$BEFORE" -
echo 'SOMA acessível em /soma; homepage institucional preservada.'
