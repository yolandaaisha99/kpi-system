# ── Stage 1: Build React App ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dan install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build argument untuk API URL (diisi saat CI/CD)
ARG VITE_API_URL=https://kpi-backend-xxx-as.a.run.app
ENV VITE_API_URL=$VITE_API_URL

# Build production
RUN npm run build

# ── Stage 2: Serve dengan Nginx ────────────────────────────
FROM nginx:alpine

# Copy hasil build React ke nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx untuk React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run menggunakan port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]