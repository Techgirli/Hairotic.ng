# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

COPY . .

# Build the application
RUN npm run build

# Stage 2: Create production runner image
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Re-generate Prisma Client inside production layer
RUN npx prisma validate

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001

# Run database migrations and start application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
