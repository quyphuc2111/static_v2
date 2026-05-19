# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema first (changes less often → better cache)
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js (increase memory to avoid OOM on low-RAM servers)
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN touch .env && npx next build

# Remove dev dependencies, keep only production deps for runner
RUN npm prune --omit=dev && npx prisma generate

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema for db push
COPY --from=builder /app/prisma ./prisma

# Copy only production node_modules (much smaller than full dev deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy seed scripts
COPY --from=builder /app/scripts ./scripts

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
