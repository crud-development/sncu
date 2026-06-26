# syntax=docker/dockerfile:1

# ─── 1. Build frontend (React + Vite) ───────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─── 2. Build backend (NestJS) ──────────────────────────────────────────────
FROM node:22-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# ─── 3. Runtime ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend

# Doar dependențele de producție.
COPY backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Backend compilat (include assets/fonts copiate de nest-cli).
COPY --from=backend /app/backend/dist ./dist
# Frontend buildat, servit de NestJS din ../frontend/dist (vezi app.module.ts).
COPY --from=frontend /app/frontend/dist /app/frontend/dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
