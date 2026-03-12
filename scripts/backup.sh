#!/bin/bash
#
# Penombre Backup Script
# Creates a timestamped backup of both PostgreSQL database and file storage
#
# Usage: ./scripts/backup.sh [backup_directory]
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

# Configuration
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="penombre_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

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

# Create backup directory
mkdir -p "$BACKUP_PATH"
log_info "Creating backup at: $BACKUP_PATH"

# Backup PostgreSQL database
log_info "Backing up PostgreSQL database..."
docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=9 > "${BACKUP_PATH}/database.dump"

if [[ ! -s "${BACKUP_PATH}/database.dump" ]]; then
    log_error "Database backup failed or is empty"
    rm -rf "$BACKUP_PATH"
    exit 1
fi
log_info "Database backup complete: $(du -h "${BACKUP_PATH}/database.dump" | cut -f1)"

# Backup file storage
log_info "Backing up file storage..."

# Create a tar archive of the /data directory from the app container
docker exec "$APP_CONTAINER" tar -cf - -C /data . 2>/dev/null | gzip > "${BACKUP_PATH}/storage.tar.gz"

if [[ ! -s "${BACKUP_PATH}/storage.tar.gz" ]]; then
    log_warn "Storage backup is empty (no files uploaded yet, which is fine)"
fi
log_info "Storage backup complete: $(du -h "${BACKUP_PATH}/storage.tar.gz" | cut -f1)"

# Create backup metadata
cat > "${BACKUP_PATH}/backup.json" << EOF
{
    "version": "1.0",
    "timestamp": "$(date -Iseconds)",
    "database": {
        "file": "database.dump",
        "format": "custom",
        "database": "$POSTGRES_DB"
    },
    "storage": {
        "file": "storage.tar.gz",
        "format": "tar+gzip"
    }
}
EOF

# Create final archive
log_info "Creating final backup archive..."
FINAL_ARCHIVE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
tar -czf "$FINAL_ARCHIVE" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

# Show result
FINAL_SIZE=$(du -h "$FINAL_ARCHIVE" | cut -f1)
log_info "=========================================="
log_info "Backup completed successfully!"
log_info "File: $FINAL_ARCHIVE"
log_info "Size: $FINAL_SIZE"
log_info "=========================================="

# Optional: Show how to restore
echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore.sh $FINAL_ARCHIVE"
