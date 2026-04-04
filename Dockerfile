# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20.14-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — compile Next.js in standalone mode
# next.config.mjs must set:  output: 'standalone'
# This produces a self-contained .next/standalone directory that bundles
# only the server code needed at runtime — no node_modules copy required.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20.14-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry in CI/CD
ENV NEXT_TELEMETRY_DISABLED=1

# Build args injected at build time for public env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO
ARG NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO=$NEXT_PUBLIC_STRIPE_PRICE_PRO
ENV NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=$NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — minimal production image using standalone output
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20.14-alpine AS runner
RUN apk add --no-cache libc6-compat tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Static assets and public files
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static

# Standalone server bundle (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health 2>/dev/null || wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
