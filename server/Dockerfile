# ── new-hydro-canal API ───────────────────────────────────────────────
# Multi-stage. chartjs-node-canvas butuh native lib (cairo/pango/libgif/librsvg)
# di BUILD (compile node-canvas) DAN di RUNTIME (shared object dimuat saat render PNG).
# Lihat docs/superpowers/specs/2026-06-15-foundation-architecture-design.md § B
# dan PLAN-BE.md "Deployment".

# ── Stage 1: build (TS → dist) ─────────────────────────────────────────
FROM node:20-bullseye AS build
WORKDIR /app

# Native deps untuk compile node-canvas (peer dep chartjs-node-canvas).
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      python3 \
      pkg-config \
      libcairo2-dev \
      libpango1.0-dev \
      libgif-dev \
      librsvg2-dev \
      libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Manifest dulu supaya layer install ke-cache selama deps tak berubah.
COPY package.json ./
COPY tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Pangkas devDependencies → node_modules siap runtime (canvas tetep ada, native).
RUN npm prune --omit=dev

# ── Stage 2: runtime (slim + native runtime lib) ──────────────────────
FROM node:20-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Runtime shared object yang dipakai node-canvas saat render (bukan -dev).
RUN apt-get update && apt-get install -y --no-install-recommends \
      libcairo2 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libgif7 \
      librsvg2-2 \
      libjpeg62-turbo \
      fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Artefak hasil build + node_modules yang sudah di-prune.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Non-root.
USER node

EXPOSE 4000

# Health check sejajar dengan endpoint /health (app.ts).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
