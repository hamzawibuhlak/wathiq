#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ MVP - DATABASE BACKUP SCRIPT
# Creates timestamped backups of PostgreSQL database
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════════"
echo "                    💾 WATHEEQ MVP - Database Backup"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE=${1:-"docker-compose.prod.yml"}

# Source environment
if [ -f ".env" ]; then
    source .env
fi

POSTGRES_USER=${POSTGRES_USER:-"watheeq"}
POSTGRES_DB=${POSTGRES_DB:-"watheeq"}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="${BACKUP_DIR}/watheeq_backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo -e "${YELLOW}📦 Creating backup...${NC}"
echo "   Database: ${POSTGRES_DB}"
echo "   User: ${POSTGRES_USER}"
echo "   File: ${BACKUP_FILE_GZ}"

# Create backup
docker compose -f ${COMPOSE_FILE} exec -T postgres \
    pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > "${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_FILE}"

# Get file size
BACKUP_SIZE=$(du -h "${BACKUP_FILE_GZ}" | cut -f1)

echo -e "${GREEN}✅ Backup created successfully!${NC}"
echo "   File: ${BACKUP_FILE_GZ}"
echo "   Size: ${BACKUP_SIZE}"

# Cleanup old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 7 days)...${NC}"
find "${BACKUP_DIR}" -name "watheeq_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true

# List recent backups
echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  Recent Backups:"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
ls -lh "${BACKUP_DIR}"/watheeq_backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

echo ""
echo -e "${GREEN}✅ Backup complete!${NC}"
