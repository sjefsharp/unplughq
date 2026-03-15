FROM node:22-alpine AS builder
WORKDIR /build
COPY package.json ./
RUN npm install --omit=dev
COPY agent.mjs ./

# --- Production ---
FROM node:22-alpine AS production

RUN addgroup --system --gid 1001 agent && \
    adduser --system --uid 1001 agent

WORKDIR /app
COPY --from=builder --chown=agent:agent /build/node_modules ./node_modules
COPY --from=builder --chown=agent:agent /build/agent.mjs ./
COPY --from=builder --chown=agent:agent /build/package.json ./

USER agent

# Read-only root filesystem — set at container run time via:
#   --read-only --security-opt=no-new-privileges --cap-drop=ALL
# The Dockerfile itself cannot enforce read-only; the docker run flags do.

ENV NODE_ENV=production
ENV AGENT_INTERVAL_MS=30000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "process.exit(0)"

CMD ["node", "agent.mjs"]
