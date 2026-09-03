#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${DB_NAME:-mapa_mandarim_dev}"
DB_USER="${DB_USER:-mapa_dev}"
DB_PASSWORD="${DB_PASSWORD:-mapa_dev_local}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
ENV_FILE="${ROOT_DIR}/.env.local"

log() { printf '[mapa-db] %s\n' "$*"; }
die() { printf '[mapa-db] erro: %s\n' "$*" >&2; exit 1; }

if [[ "${EUID}" -ne 0 ]] && ! command -v sudo >/dev/null 2>&1; then
  die "sudo é necessário para instalar e iniciar o MariaDB."
fi

if ! command -v mysql >/dev/null 2>&1 || ! command -v mariadbd >/dev/null 2>&1; then
  log "MariaDB não encontrado; instalando servidor e cliente."
  sudo DEBIAN_FRONTEND=noninteractive apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server mariadb-client
fi

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl enable --now mariadb 2>/dev/null || sudo systemctl start mariadb
else
  sudo service mariadb start
fi

sudo mysqladmin ping >/dev/null 2>&1 || die "o serviço MariaDB não respondeu ao health check."

log "Criando banco e usuário local (se necessário)."
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

mysql_exec() {
  MYSQL_PWD="${DB_PASSWORD}" mysql --protocol=tcp --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" "$DB_NAME" "$@"
}

mysql_exec -e 'CREATE TABLE IF NOT EXISTS `_mapa_local_migrations` (`name` varchar(255) NOT NULL PRIMARY KEY, `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);'

while IFS= read -r migration; do
  name="$(basename "$migration")"
  if [[ "$(mysql_exec --batch --skip-column-names -e "SELECT COUNT(*) FROM _mapa_local_migrations WHERE name = '${name}'")" == "1" ]]; then
    log "Migração já aplicada: ${name}"
    continue
  fi
  log "Aplicando ${name}"
  mysql_exec < "$migration"
  mysql_exec -e "INSERT INTO _mapa_local_migrations (name) VALUES ('${name}')"
done < <(find "$ROOT_DIR/drizzle" -maxdepth 1 -type f -name '*.sql' -print | sort -V)

mysql_exec -e 'SELECT COUNT(*) AS lesson_activities FROM lesson_activities; SELECT COUNT(*) AS srs_cards FROM srs_cards;'

umask 077
cat > "$ENV_FILE" <<EOF
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
EOF

log "Banco local pronto. Configuração salva em ${ENV_FILE}."
log "A URL não deve ser commitada; use o arquivo somente no ambiente local."
