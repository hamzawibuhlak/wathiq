#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ MVP - PRODUCTION BUILD SCRIPT
# Builds Docker images for production deployment
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
echo "                    🏗️  WATHEEQ MVP - Production Build"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Get version tag
VERSION=${1:-$(git describe --tags --always 2>/dev/null || echo "latest")}
REGISTRY=${REGISTRY:-""}

echo -e "${YELLOW}📦 Building version: ${VERSION}${NC}"

# Build Backend
echo -e "${BLUE}🔧 Building Backend...${NC}"
docker build \
    -t watheeq-backend:${VERSION} \
    -t watheeq-backend:latest \
    -f backend/Dockerfile \
    backend/

echo -e "${GREEN}✅ Backend image built${NC}"

# Build Frontend
echo -e "${BLUE}🎨 Building Frontend...${NC}"
docker build \
    -t watheeq-frontend:${VERSION} \
    -t watheeq-frontend:latest \
    --build-arg VITE_API_URL=/api \
    --build-arg VITE_APP_NAME=Watheeq \
    -f frontend/Dockerfile \
    frontend/

echo -e "${GREEN}✅ Frontend image built${NC}"

# Show image sizes
echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  📊 Image Sizes:"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep watheeq

# Optional: Push to registry
if [ -n "$REGISTRY" ]; then
    echo -e "${YELLOW}📤 Pushing to registry: ${REGISTRY}${NC}"
    
    docker tag watheeq-backend:${VERSION} ${REGISTRY}/watheeq-backend:${VERSION}
    docker tag watheeq-frontend:${VERSION} ${REGISTRY}/watheeq-frontend:${VERSION}
    
    docker push ${REGISTRY}/watheeq-backend:${VERSION}
    docker push ${REGISTRY}/watheeq-frontend:${VERSION}
    
    echo -e "${GREEN}✅ Images pushed to registry${NC}"
fi

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ Build Complete!"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo "  To deploy locally:"
echo "  docker compose -f docker-compose.prod.yml up -d"
echo ""
