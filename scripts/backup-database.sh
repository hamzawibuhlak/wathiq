#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ DATABASE BACKUP SCRIPT
# Automated backup with S3 upload and retention
# ═══════════════════════════════════════════════════════════════════

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/watheeq}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="watheeq_backup_${DATE}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Database credentials
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-watheeq}"
DB_USER="${DB_USER:-watheeq}"

# S3 Configuration (optional)
S3_BUCKET="${S3_BUCKET:-watheeq-backups}"
S3_PREFIX="${S3_PREFIX:-database}"
ENABLE_S3="${ENABLE_S3:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  WATHEEQ DATABASE BACKUP${NC}"
echo -e "${GREEN}  Started: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Creating database backup...${NC}"

# Create backup
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: DB_PASSWORD environment variable not set${NC}"
    exit 1
fi

PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --format=plain \
    --no-owner \
    --no-acl \
    2>/dev/null | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR/$BACKUP_FILE (${BACKUP_SIZE})${NC}"

# Upload to S3 (if enabled)
if [ "$ENABLE_S3" = "true" ]; then
    if command -v aws &> /dev/null; then
        echo -e "${YELLOW}☁️  Uploading backup to S3...${NC}"
        aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/$S3_PREFIX/$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup uploaded to S3: s3://$S3_BUCKET/$S3_PREFIX/$BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  AWS CLI not installed, skipping S3 upload${NC}"
    fi
fi

# Delete old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "watheeq_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "${GREEN}✅ Deleted $DELETED_COUNT old backups${NC}"

# List current backups
echo -e "${YELLOW}📋 Current backups:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -10

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  BACKUP COMPLETED SUCCESSFULLY${NC}"
echo -e "${GREEN}  Finished: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
