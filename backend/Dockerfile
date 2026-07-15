FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

# Copy EVERYTHING, including prisma.config.ts
COPY . .

RUN npx prisma generate

RUN npm run build