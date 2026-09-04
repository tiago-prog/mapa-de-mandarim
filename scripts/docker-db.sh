#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

case "${1:-up}" in
  up)
    docker compose up -d db
    docker compose run --rm migrate
    ;;
  migrate)
    docker compose run --rm migrate
    ;;
  status)
    docker compose ps
    ;;
  logs)
    docker compose logs -f db
    ;;
  stop)
    docker compose stop db
    ;;
  down)
    docker compose down
    ;;
  reset)
    echo "Isto vai apagar o volume local do MariaDB e todos os dados de desenvolvimento."
    read -r -p "Continuar? [y/N] " answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
      docker compose down -v
    else
      echo "Cancelado."
    fi
    ;;
  *)
    echo "Uso: $0 {up|migrate|status|logs|stop|down|reset}" >&2
    exit 2
    ;;
esac
