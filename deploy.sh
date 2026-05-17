#!/bin/bash
# =============================================================
# وسم الثقة — Production Deploy Script
# Run on the VPS: bash deploy.sh
# =============================================================
set -e

APP_DIR="/opt/watheeq"
REPO="https://github.com/hamzawibuhlak/wathiq.git"
BRANCH="main"

echo "==> Deploying وسم الثقة to production..."

# Pull latest code
if [ -d "$APP_DIR/.git" ]; then
    echo "==> Pulling latest changes..."
    git -C "$APP_DIR" fetch origin
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
    echo "==> Cloning repository..."
    git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

cd "$APP_DIR"

# Check .env.production exists
if [ ! -f "backend/.env.production" ]; then
    echo "ERROR: backend/.env.production not found. Please create it first."
    exit 1
fi

# Check POSTGRES_PASSWORD and REDIS_PASSWORD are set
source <(grep -E "^POSTGRES_PASSWORD|^REDIS_PASSWORD" backend/.env.production | sed 's/ //g')
export POSTGRES_PASSWORD REDIS_PASSWORD

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "CHANGE_ME" ]; then
    echo "ERROR: POSTGRES_PASSWORD not set in backend/.env.production"
    exit 1
fi

echo "==> Building Docker images (this may take 5-10 minutes)..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "==> Starting services..."
docker compose -f docker-compose.prod.yml up -d postgres redis

echo "==> Waiting for database to be ready..."
sleep 10

echo "==> Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm \
    -e DATABASE_URL="$(grep DATABASE_URL backend/.env.production | cut -d= -f2-)" \
    backend sh -c "npx prisma migrate deploy"

echo "==> Seeding database (owner account)..."
docker compose -f docker-compose.prod.yml run --rm \
    -e DATABASE_URL="$(grep DATABASE_URL backend/.env.production | cut -d= -f2-)" \
    backend sh -c "npx prisma db seed" || echo "Seed already done or skipped."

echo "==> Starting all services..."
docker compose -f docker-compose.prod.yml up -d

echo "==> Checking service status..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"
echo "   App: http://$(curl -s ifconfig.me)"
echo "   API: http://$(curl -s ifconfig.me)/api/health"
echo ""
echo "   Login: marketing.wasm@gmail.com / Wasm123Wasm@#"
