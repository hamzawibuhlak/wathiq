#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# WATHEEQ KUBERNETES DEPLOYMENT SCRIPT
# One-command production deployment
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  WATHEEQ PRODUCTION DEPLOYMENT${NC}"
echo -e "${BLUE}  Started: $(date)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check cluster connectivity
echo -e "${YELLOW}📡 Checking cluster connectivity...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Cluster connected${NC}"

# Step 1: Create namespace
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}✅ Namespace created${NC}"

# Step 2: Create ConfigMap and Secrets
echo -e "${YELLOW}🔐 Creating ConfigMap and Secrets...${NC}"
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
echo -e "${GREEN}✅ ConfigMap and Secrets created${NC}"

# Step 3: Deploy Database
echo -e "${YELLOW}🗄️ Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres-deployment.yaml
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n watheeq --timeout=120s
echo -e "${GREEN}✅ PostgreSQL ready${NC}"

# Step 4: Deploy Redis
echo -e "${YELLOW}📮 Deploying Redis...${NC}"
kubectl apply -f k8s/redis-deployment.yaml
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=redis -n watheeq --timeout=60s
echo -e "${GREEN}✅ Redis ready${NC}"

# Step 5: Deploy Backend
echo -e "${YELLOW}🚀 Deploying Backend (3 replicas)...${NC}"
kubectl apply -f k8s/backend-deployment.yaml
echo -e "${YELLOW}⏳ Waiting for Backend to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=backend -n watheeq --timeout=180s
echo -e "${GREEN}✅ Backend ready${NC}"

# Step 6: Deploy Frontend
echo -e "${YELLOW}🎨 Deploying Frontend (2 replicas)...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml
echo -e "${YELLOW}⏳ Waiting for Frontend to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=frontend -n watheeq --timeout=120s
echo -e "${GREEN}✅ Frontend ready${NC}"

# Step 7: Deploy Ingress
echo -e "${YELLOW}🌐 Deploying Ingress...${NC}"
kubectl apply -f k8s/ingress.yaml
echo -e "${GREEN}✅ Ingress created${NC}"

# Step 8: Deploy HPA
echo -e "${YELLOW}📈 Deploying Auto-scaling (HPA)...${NC}"
kubectl apply -f k8s/hpa.yaml
echo -e "${GREEN}✅ Auto-scaling configured${NC}"

# Step 9: Deploy Backup CronJob
echo -e "${YELLOW}💾 Deploying Backup CronJob...${NC}"
kubectl apply -f k8s/backup-cronjob.yaml
echo -e "${GREEN}✅ Backup CronJob created${NC}"

# Print status
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}📋 Deployment Status:${NC}"
kubectl get all -n watheeq

echo -e "\n${YELLOW}🌐 Ingress:${NC}"
kubectl get ingress -n watheeq

echo -e "\n${YELLOW}📈 HPA Status:${NC}"
kubectl get hpa -n watheeq

echo -e "\n${GREEN}🎉 Watheeq is now running on Kubernetes!${NC}"
echo -e "${YELLOW}Access the application at: https://bewathiq.com${NC}"
