# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

# Stage 2: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production runner (uses Next.js standalone output)
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output, public assets, and static assets
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
