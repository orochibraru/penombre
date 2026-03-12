#!/bin/bash
#
# Penombre Restore Script
# Restores a backup created by backup.sh
#
# Usage: ./scripts/restore.sh <backup_file.tar.gz>
#
# WARNING: This will REPLACE all existing data. Make sure you have a backup
# of the current data before running this script.
#
# Environment variables (optional):
#   COMPOSE_PROJECT_NAME - Docker Compose project name (default: auto-detected)
#   POSTGRES_USER        - PostgreSQL user (default: postgres)
#   POSTGRES_DB          - PostgreSQL database (default: penombre)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check arguments
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    echo ""
    echo "Restores an Penombre backup created by backup.sh"
    echo ""
    echo "WARNING: This will REPLACE all existing data!"
    exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Configuration
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-penombre}"

# Detect docker compose command
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    log_error "Neither 'docker compose' nor 'docker-compose' found. Please install Docker Compose."
    exit 1
fi

# Get container names
get_container_name() {
    local service=$1
    $DOCKER_COMPOSE ps -q "$service" 2>/dev/null | head -1
}

DB_CONTAINER=$(get_container_name "db")
APP_CONTAINER=$(get_container_name "app")

if [[ -z "$DB_CONTAINER" ]]; then
    log_error "Database container not found. Is the stack running?"
    exit 1
fi

if [[ -z "$APP_CONTAINER" ]]; then
    log_error "App container not found. Is the stack running?"
    exit 1
fi

# Confirm restoration
echo ""
log_warn "=========================================="
log_warn "THIS WILL REPLACE ALL EXISTING DATA!"
log_warn "=========================================="
echo ""
echo "Backup file: $BACKUP_FILE"
echo "Database: $POSTGRES_DB"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    log_info "Restore cancelled."
    exit 0
fi

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d)
trap 'rm -rf $TEMP_DIR' EXIT

log_info "Extracting backup archive..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup directory (it's the only dir inside)
BACKUP_DIR=$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -1)

if [[ -z "$BACKUP_DIR" ]]; then
    log_error "Invalid backup archive: no backup directory found"
    exit 1
fi

# Verify backup contents
if [[ ! -f "${BACKUP_DIR}/database.dump" ]]; then
    log_error "Invalid backup: database.dump not found"
    exit 1
fi

if [[ ! -f "${BACKUP_DIR}/storage.tar.gz" ]]; then
    log_error "Invalid backup: storage.tar.gz not found"
    exit 1
fi

if [[ -f "${BACKUP_DIR}/backup.json" ]]; then
    log_info "Backup metadata:"
    cat "${BACKUP_DIR}/backup.json"
    echo ""
fi

# Stop the app container to prevent writes during restore
log_info "Stopping app container..."
docker stop "$APP_CONTAINER" >/dev/null

# Restore PostgreSQL database
log_info "Restoring PostgreSQL database..."

# Drop and recreate database
docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" postgres
docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;" postgres

# Restore from dump
docker exec -i "$DB_CONTAINER" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --role="$POSTGRES_USER" < "${BACKUP_DIR}/database.dump"

log_info "Database restore complete"

# Restore file storage
log_info "Restoring file storage..."

# Start app container briefly to access the volume
docker start "$APP_CONTAINER" >/dev/null
sleep 2

# Get fresh container ID after restart
APP_CONTAINER=$(get_container_name "app")

# Clear existing storage and restore
docker exec "$APP_CONTAINER" sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null || true"

# Restore storage from backup
cat "${BACKUP_DIR}/storage.tar.gz" | docker exec -i "$APP_CONTAINER" sh -c "cd /data && tar -xzf -"

log_info "Storage restore complete"

# Restart the app to pick up changes
log_info "Restarting services..."
$DOCKER_COMPOSE restart app

log_info "=========================================="
log_info "Restore completed successfully!"
log_info "=========================================="
echo ""
log_info "Please verify that everything is working correctly."
