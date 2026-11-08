# ─── Etapa 1: build ────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@12.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ─── Etapa 2: prod deps only ───────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@12.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ─── Etapa 3: runtime ─────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
USER app
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3002/health/live || exit 1

CMD ["node", "dist/main.js"]
