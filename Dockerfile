# syntax=docker/dockerfile:1

# Ubuntu sunucular (x86_64) için varsayılan: linux/amd64
# Mac'te build: docker build --platform linux/amd64 ...
ARG TARGETPLATFORM=linux/amd64

FROM --platform=$TARGETPLATFORM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG APP_ENV=prod
ARG API_BASE_URL=https://prod.qrapi.algorycode.com
ENV APP_ENV=${APP_ENV}
ENV API_BASE_URL=${API_BASE_URL}

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
