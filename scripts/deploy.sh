#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ MVP - PRODUCTION DEPLOYMENT SCRIPT
# Deploys the application to production
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
echo "                    🚀 WATHEEQ MVP - Production Deploy"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if .env file exists for production
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Production .env file not found!${NC}"
    echo "   Create .env file with production settings."
    exit 1
fi

# Source environment variables
source .env

# Validate required variables
REQUIRED_VARS=(
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required variable ${var} is not set!${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main

# Build images
echo -e "${YELLOW}🏗️  Building images...${NC}"
docker compose -f docker-compose.prod.yml build

# Stop current containers
echo -e "${YELLOW}🛑 Stopping current containers...${NC}"
docker compose -f docker-compose.prod.yml down

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for backend to be healthy
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Check health
echo -e "${YELLOW}🔍 Checking service health...${NC}"
sleep 5

if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

if curl -s http://localhost:80/health > /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Show status
echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  Container Status:"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo "  🌐 Application: http://your-domain.com"
echo "  📋 Logs:        docker compose -f docker-compose.prod.yml logs -f"
echo ""
