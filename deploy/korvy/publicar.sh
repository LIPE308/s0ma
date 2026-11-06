#!/bin/sh
set -eu
umask 077
case "${SOMA_SHA:-}" in ''|*[!a-f0-9]*) exit 1;; esac
test "${#SOMA_SHA}" -eq 40
KORVY_DIR=/var/www/korva
cd "$KORVY_DIR"
APP=$(docker compose ps -q app)
CADDY=$(docker compose ps -q caddy)
test -n "$APP" && test -n "$CADDY"
NETWORK=$(docker inspect --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$CADDY" | head -n1)
test -n "$NETWORK"
# Guarda de recursos: não pressionar o serviço institucional com um build pesado.
test "$(awk '/MemAvailable/ {print $2}' /proc/meminfo)" -ge 1300000
test "$(df -Pk /var | awk 'NR==2 {print $4}')" -ge 6000000
ROOT=/var/lib/soma-temporario
mkdir -p "$ROOT/releases"
PREVIOUS=$(cat "$ROOT/versao" 2>/dev/null || true)
BEFORE=$(mktemp)
curl -fsS https://korvy.com.br/ > "$BEFORE"
if [ ! -f "$ROOT/ambiente" ]; then
  printf 'SOMA_MYSQL_PASSWORD=%s\nSOMA_MYSQL_ROOT_PASSWORD=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > "$ROOT/ambiente"
fi
printf 'KORVY_NETWORK=%s\n' "$NETWORK" > "$ROOT/rede"
set -a
. "$ROOT/ambiente"
. "$ROOT/rede"
set +a
RELEASE="$ROOT/releases/$SOMA_SHA"
if [ ! -d "$RELEASE/.git" ]; then
  git clone --quiet https://github.com/LIPE308/s0ma.git "$RELEASE"
fi
cd "$RELEASE"
git fetch --quiet origin "$SOMA_SHA"
git checkout --quiet --detach "$SOMA_SHA"
test "$(git rev-parse HEAD)" = "$SOMA_SHA"
compose() { docker compose -p soma-temporario -f deploy/korvy/compose.yml "$@"; }
compose config --quiet
CHANGED=0
ROUTE_APPLIED=0
CONFIG="$ROOT/caddy-before-$SOMA_SHA.json"
finish() {
  STATUS=$?
  trap - EXIT
  if [ "$STATUS" -ne 0 ]; then
    if [ "$ROUTE_APPLIED" -eq 1 ]; then
      docker cp "$CONFIG" "$CADDY:/tmp/soma-anterior.json" >/dev/null
      docker exec "$CADDY" caddy reload --config /tmp/soma-anterior.json || true
    fi
    if [ "$CHANGED" -eq 1 ]; then
      if [ -n "$PREVIOUS" ] && [ -f "$ROOT/releases/$PREVIOUS/deploy/korvy/compose.yml" ]; then
        SOMA_SHA="$PREVIOUS" docker compose -p soma-temporario -f "$ROOT/releases/$PREVIOUS/deploy/korvy/compose.yml" up -d --no-build soma || true
      else
        compose stop || true
      fi
    fi
  fi
  rm -f "$BEFORE"
  exit "$STATUS"
}
trap finish EXIT
compose build soma
CHANGED=1
compose up -d
READY=0
for attempt in $(seq 1 60); do
  if compose exec -T soma node -e "fetch('http://127.0.0.1:3001/api/saude').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then READY=1;break;fi
  sleep 2
done
test "$READY" -eq 1
compose exec -T -e SOMA_SEED_ISOLADO=soma-temporario soma node backend/campanhas-exemplos.js
docker exec "$CADDY" wget -qO- http://127.0.0.1:2019/config/ > "$CONFIG"
compose exec -T soma node deploy/korvy/rota-caddy.cjs < "$CONFIG" > "$ROOT/caddy-soma.json"
docker cp "$ROOT/caddy-soma.json" "$CADDY:/tmp/soma-temporario.json" >/dev/null
docker exec "$CADDY" caddy validate --config /tmp/soma-temporario.json
ROUTE_APPLIED=1
docker exec "$CADDY" caddy reload --config /tmp/soma-temporario.json
if ! curl -fsS https://korvy.com.br/soma/api/saude > "$ROOT/saude.json" || ! curl -fsS https://korvy.com.br/ | cmp -s "$BEFORE" -; then
  echo 'Falha de verificação; restaurando a configuração anterior.'
  exit 1
fi
printf '%s\n' "$SOMA_SHA" > "$ROOT/versao"
rm -f "$BEFORE"
echo 'SOMA publicado; homepage preservada byte a byte. Nenhum arquivo do site alterado.'
