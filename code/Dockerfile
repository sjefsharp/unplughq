FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# --- Development target (used by docker-compose) ---
FROM base AS dev
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# --- Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- Builder ---
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV SKIP_ENV_VALIDATION=true
RUN pnpm build

# --- Production ---
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
