# ── new-hydro-canal FE (static SPA) ───────────────────────────────────
# Produksi: FE static idealnya ke Pages (CF/Vercel) — lihat foundation spec § B.
# Image ini untuk docker-compose lokal/self-host (nginx serve dist).

# ── Stage 1: build (Vite → dist statis) ───────────────────────────────
FROM node:20-bullseye AS build
WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
RUN npm install

# Config + sumber.
COPY index.html ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY src ./src

# /api di-rewrite ke server saat dev; di prod nginx yang proxy (lihat nginx.conf).
RUN npm run build

# ── Stage 2: serve static via nginx ───────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# SPA fallback + proxy /api ke service "server".
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
