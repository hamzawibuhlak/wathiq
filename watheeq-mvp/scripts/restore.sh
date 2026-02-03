#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ MVP - DATABASE RESTORE SCRIPT
# Restores PostgreSQL database from backup
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════════"
echo "                    🔄 WATHEEQ MVP - Database Restore"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check arguments
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file.sql.gz>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/watheeq_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
COMPOSE_FILE=${2:-"docker-compose.prod.yml"}

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Source environment
if [ -f ".env" ]; then
    source .env
fi

POSTGRES_USER=${POSTGRES_USER:-"watheeq"}
POSTGRES_DB=${POSTGRES_DB:-"watheeq"}

echo -e "${YELLOW}⚠️  WARNING: This will overwrite the current database!${NC}"
echo "   Database: ${POSTGRES_DB}"
echo "   Backup: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

echo -e "${YELLOW}🔄 Restoring database...${NC}"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}📦 Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" > /tmp/restore_backup.sql
    RESTORE_FILE="/tmp/restore_backup.sql"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Drop and recreate database
echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
docker compose -f ${COMPOSE_FILE} exec -T postgres \
    psql -U ${POSTGRES_USER} -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

docker compose -f ${COMPOSE_FILE} exec -T postgres \
    psql -U ${POSTGRES_USER} -c "CREATE DATABASE ${POSTGRES_DB};"

# Restore backup
echo -e "${YELLOW}📥 Restoring from backup...${NC}"
cat "${RESTORE_FILE}" | docker compose -f ${COMPOSE_FILE} exec -T postgres \
    psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# Cleanup temp file
if [ -f "/tmp/restore_backup.sql" ]; then
    rm /tmp/restore_backup.sql
fi

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Database Restored Successfully!"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo "  You may need to restart the backend service:"
echo "  docker compose -f ${COMPOSE_FILE} restart backend"
echo ""
