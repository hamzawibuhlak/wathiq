#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ DATABASE RESTORE SCRIPT
# Restore from backup file
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo -e "Example: $0 /var/backups/watheeq/watheeq_backup_20240209_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Database credentials
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-watheeq}"
DB_USER="${DB_USER:-watheeq}"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  WATHEEQ DATABASE RESTORE${NC}"
echo -e "${GREEN}  Started: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo -e "${YELLOW}Database: $DB_NAME on $DB_HOST:$DB_PORT${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Check for password
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: DB_PASSWORD environment variable not set${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Dropping existing database...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

echo -e "${YELLOW}📦 Restoring database from backup...${NC}"
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME"

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DATABASE RESTORED SUCCESSFULLY${NC}"
echo -e "${GREEN}  Finished: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}📋 Note: You may need to restart the backend services${NC}"
