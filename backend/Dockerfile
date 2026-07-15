FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy the project before generating Prisma
COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["npm", "run", "start:prod"]