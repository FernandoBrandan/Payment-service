#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# PROJECT CONFIGURATION
# Cambiar únicamente esta variable para reutilizar el script.
# ============================================================

PROJECT_NAME="payment"

# ============================================================
# CONFIGURATION
# ============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Project-specific configuration
DB_NAME="${DB_NAME:-$PROJECT_NAME}"
DB_USER="${DB_USER:-postgres}"
APP_PORT="${APP_PORT:-3000}"

# Docker Compose project names
DEV_PROJECT="${PROJECT_NAME}-dev"
PROD_PROJECT="${PROJECT_NAME}-prod"

COMPOSE_DEV=(
  docker compose
  --project-name "$DEV_PROJECT"
  --env-file .env.dev
  -f .docker/docker-compose.yml
)

COMPOSE_PROD=(
  docker compose
  --project-name "$PROD_PROJECT"
  --env-file .env.docker
  -f .docker/docker-compose.prod.yml
)

# Colors
B=$'\e[1m'
G=$'\e[32m'
Y=$'\e[33m'
R=$'\e[31m'
D=$'\e[2m'
N=$'\e[0m'

# ============================================================
# HELPERS
# ============================================================

which_stack() {
  if docker ps \
    --filter "label=com.docker.compose.project=$PROD_PROJECT" \
    --format '{{.ID}}' | grep -q .; then
    echo prod
    return
  fi

  if docker ps \
    --filter "label=com.docker.compose.project=$DEV_PROJECT" \
    --format '{{.ID}}' | grep -q .; then
    echo dev
    return
  fi

  echo none
}

usage() {
  cat <<EOF
${B}${PROJECT_NAME}${N} — Project Runner

${B}Environments:${N}
  dev        Levanta Postgres + Redis (para pnpm start:dev)
  prod       Build + levanta todo containerizado
  down       Baja ambos stacks
  nuke       Baja todo y borra volúmenes (⚠️)

${B}Utilities:${N}
  ps           Estado de containers (dev + prod)
  logs [svc]   Logs en vivo (auto-detecta el stack activo)
  sh <svc>     Shell dentro de un container (app | postgres | redis)
  db           Abre psql en el Postgres del stack activo
  smoke        Corre .scripts/smoke-test.sh

${B}Migrations${N} (NODE_ENV=dev):
  migrate      Corre migraciones pendientes
  revert       Revierte la última
  show         Lista aplicadas/pendientes
  seed         Carga datos de demo

${B}Other:${N}
  help         Este mensaje

${D}Project: ${PROJECT_NAME}${N}
${D}Dev:     ${DEV_PROJECT}${N}
${D}Prod:    ${PROD_PROJECT}${N}
EOF
}

# ============================================================
# COMMANDS
# ============================================================

cmd="${1:-help}"
shift || true

case "$cmd" in

  dev)
    "${COMPOSE_PROD[@]}" down --remove-orphans >/dev/null 2>&1 || true

    "${COMPOSE_DEV[@]}" up -d

    echo "${G}✔${N} ${PROJECT_NAME} Dev arriba."
    echo "${D}→ pnpm start:dev${N}"
    ;;

  prod)
    # 1. Build first: if it fails, dev remains intact.
    if ! "${COMPOSE_PROD[@]}" build; then
      echo "${R}✘ Build falló. Dev sigue como estaba.${N}"
      exit 1
    fi

    # 2. Stop dev only after successful build.
    "${COMPOSE_DEV[@]}" down --remove-orphans >/dev/null 2>&1 || true

    # 3. Start prod.
    "${COMPOSE_PROD[@]}" up -d

    echo "${G}✔${N} ${PROJECT_NAME} Prod-local arriba."
    echo "  ${D}→ App:     http://localhost:${APP_PORT}${N}"
    echo "  ${D}→ Logs:    ./run.sh logs${N}"
    echo "  ${D}→ Status:  ./run.sh ps${N}"
    ;;

  down)
    "${COMPOSE_DEV[@]}" down --remove-orphans >/dev/null 2>&1 || true
    "${COMPOSE_PROD[@]}" down --remove-orphans >/dev/null 2>&1 || true

    echo "${G}✔${N} Containers de ${PROJECT_NAME} bajados."
    ;;

  nuke)
    read -p "${R}⚠️ Borra los volúmenes de ${PROJECT_NAME}. ¿Seguro? [y/N] ${N}" -n 1 -r
    echo

    [[ "$REPLY" =~ ^[Yy]$ ]] || exit 1

    "${COMPOSE_DEV[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
    "${COMPOSE_PROD[@]}" down -v --remove-orphans >/dev/null 2>&1 || true

    echo "${G}✔${N} Volúmenes de ${PROJECT_NAME} eliminados."
    ;;

  atomic)
        echo "${R}⚠️ Eliminando absolutamente TODOS los contenedores del sistema...${N}"

        # Se verifica si hay contenedores antes de ejecutar el comando para evitar errores en cascada
        if [ -n "$(docker ps -aq)" ]; then
            docker rm -f $(docker ps -aq) >/dev/null 2>&1
        fi

        echo "${G}✔${N} Todos los contenedores de Docker han sido eliminados."
        ;;

  ps)
    echo "${B}— Dev —${N}"
    "${COMPOSE_DEV[@]}" ps || true

    echo
    echo "${B}— Prod-local —${N}"
    "${COMPOSE_PROD[@]}" ps || true
    ;;

  logs)
    case "$(which_stack)" in
      prod)
        "${COMPOSE_PROD[@]}" logs -f "$@"
        ;;
      dev)
        "${COMPOSE_DEV[@]}" logs -f "$@"
        ;;
      *)
        echo "${Y}Ningún stack arriba.${N}"
        echo "Corré './run.sh dev' o './run.sh prod'."
        ;;
    esac
    ;;

  sh)
    svc="${1:-app}"

    case "$(which_stack)" in
      prod)
        "${COMPOSE_PROD[@]}" exec "$svc" sh
        ;;
      dev)
        case "$svc" in
          postgres|redis)
            "${COMPOSE_DEV[@]}" exec "$svc" sh
            ;;
          app)
            echo "${Y}El servicio app solo existe en prod.${N}"
            exit 1
            ;;
          *)
            echo "${R}Servicio desconocido: $svc${N}"
            exit 1
            ;;
        esac
        ;;
      *)
        echo "${Y}Ningún stack arriba.${N}"
        exit 1
        ;;
    esac
    ;;

  db)
    case "$(which_stack)" in
      prod)
        "${COMPOSE_PROD[@]}" exec postgres \
          psql -U "$DB_USER" -d "$DB_NAME"
        ;;
      dev)
        "${COMPOSE_DEV[@]}" exec postgres \
          psql -U "$DB_USER" -d "$DB_NAME"
        ;;
      *)
        echo "${Y}Ningún stack arriba.${N}"
        exit 1
        ;;
    esac
    ;;

  migrate)
    NODE_ENV=dev pnpm migration:run:dev
    ;;

  revert)
    NODE_ENV=dev pnpm migration:revert
    ;;

  show)
    NODE_ENV=dev pnpm migration:show
    ;;

  seed)
    NODE_ENV=dev pnpm seed:dev
    ;;

  smoke)
    bash .scripts/smoke-test.sh
    ;;

  help|*)
    usage
    ;;

esac
