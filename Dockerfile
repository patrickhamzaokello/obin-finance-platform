# syntax=docker/dockerfile:1

# ── 1. deps ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install libc compat for native modules (pg, etc.)
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts


# ── 2. builder ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Need devDeps for the build
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Next.js telemetry off in CI
ENV NEXT_TELEMETRY_DISABLED=1

# Build args — these are baked into the static bundle at build time.
# Only non-secret, NEXT_PUBLIC_ values belong here; secrets are injected at runtime.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN npm run build


# ── 3. runner ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what the server needs to run
COPY --from=builder /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# All secrets (DATABASE_URL, BETTER_AUTH_SECRET, AWS_*, etc.) are passed
# via docker-compose env_file or runtime environment — never baked in here.
CMD ["node", "server.js"]
