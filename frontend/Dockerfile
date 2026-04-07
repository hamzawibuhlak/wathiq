# ═══════════════════════════════════════════════════════════════════
# WATHEEQ FRONTEND - PRODUCTION DOCKERFILE
# Multi-stage: Marketing site + App SPA on Nginx
# Context is root of the monorepo (.)
# ═══════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════
# STAGE 1: Build Marketing Site
# ═══════════════════════════════════════════════════════════════════
FROM node:20-alpine AS marketing-builder

WORKDIR /marketing

COPY marketing/package*.json ./
RUN npm ci

COPY marketing/ .
RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# STAGE 2: Build App (SPA)
# ═══════════════════════════════════════════════════════════════════
FROM node:20-alpine AS app-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

ARG VITE_API_URL=/api
ARG VITE_APP_NAME=Watheeq

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# STAGE 3: Nginx Production Server
# ═══════════════════════════════════════════════════════════════════
FROM nginx:alpine AS production

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy marketing site to /marketing
COPY --from=marketing-builder /marketing/dist /usr/share/nginx/marketing

# Copy app SPA to /app
COPY --from=app-builder /app/dist /usr/share/nginx/app

# Permissions
RUN chown -R nginx:nginx /usr/share/nginx/marketing && \
    chown -R nginx:nginx /usr/share/nginx/app && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

ENV NODE_ENV=production
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
