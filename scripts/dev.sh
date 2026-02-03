#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ MVP - DEVELOPMENT STARTUP SCRIPT
# Starts all services for local development
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
echo "                    🏛️  WATHEEQ MVP - Development"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found. Creating from example...${NC}"
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    
    read -p "Do you want to start with Docker? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🐳 Starting Docker services...${NC}"
        docker compose up -d
        
        echo -e "${GREEN}"
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  ✅ All services are running!"
        echo "═══════════════════════════════════════════════════════════════════"
        echo -e "${NC}"
        echo "  📱 Frontend:    http://localhost:5173"
        echo "  🔧 Backend API: http://localhost:3000/api"
        echo "  🗄️  PostgreSQL:  localhost:5432"
        echo "  📦 Redis:       localhost:6379"
        echo ""
        echo "  📋 View logs: docker compose logs -f"
        echo "  🛑 Stop:      docker compose down"
        echo ""
        
        exit 0
    fi
fi

# Start without Docker
echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Backend
echo -e "${YELLOW}📦 Installing Backend dependencies...${NC}"
cd backend
npm install
npx prisma generate

# Check if database is accessible
if npx prisma migrate status &> /dev/null; then
    echo -e "${GREEN}✅ Database is accessible${NC}"
    npx prisma migrate dev
else
    echo -e "${RED}❌ Database is not accessible. Make sure PostgreSQL is running.${NC}"
    echo "   Run: docker compose up -d postgres"
    exit 1
fi

cd ..

# Frontend
echo -e "${YELLOW}📦 Installing Frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"

# Start backend in background
(cd backend && npm run start:dev) &
BACKEND_PID=$!

# Start frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Development servers started!"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo "  📱 Frontend:    http://localhost:5173"
echo "  🔧 Backend API: http://localhost:3000/api"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
