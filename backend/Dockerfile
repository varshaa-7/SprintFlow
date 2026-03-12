FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
