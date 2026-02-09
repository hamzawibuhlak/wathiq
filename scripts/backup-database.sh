#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ DATABASE BACKUP SCRIPT
# Automated backup - Saves locally on Hostinger VPS
# ═══════════════════════════════════════════════════════════════════

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/watheeq}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="watheeq_db_${DATE}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Database credentials (from Docker or environment)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-watheeq}"
DB_USER="${DB_USER:-watheeq}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  WATHEEQ DATABASE BACKUP (Hostinger Local)${NC}"
echo -e "${GREEN}  Started: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Creating database backup...${NC}"

# Check for password
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: DB_PASSWORD environment variable not set${NC}"
    echo -e "${YELLOW}Usage: DB_PASSWORD=your_password ./backup-database.sh${NC}"
    exit 1
fi

# Create backup using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    2>/dev/null | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR/$BACKUP_FILE (${BACKUP_SIZE})${NC}"

# Delete old backups (keep last 30 days)
echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "watheeq_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Deleted $DELETED_COUNT old backups${NC}"

# Show current backups
echo -e "${YELLOW}📋 Current backups in $BACKUP_DIR:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"

# Show disk usage
echo -e "${YELLOW}💿 Backup directory size:${NC}"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "0"

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ BACKUP COMPLETED SUCCESSFULLY${NC}"
echo -e "${GREEN}  📁 Location: $BACKUP_DIR/$BACKUP_FILE${NC}"
echo -e "${GREEN}  📦 Size: ${BACKUP_SIZE}${NC}"
echo -e "${GREEN}  ⏰ Finished: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"

# Note about Hostinger backups
echo -e "${YELLOW}💡 Note: Hostinger also creates full VPS backups automatically.${NC}"
echo -e "${YELLOW}   This script provides additional database-only backups.${NC}"
