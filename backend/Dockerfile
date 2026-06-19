# =========================
# BUILD STAGE
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl netcat-openbsd

COPY package*.json ./
#COPY prisma.config.ts ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build


# =========================
# PRODUCTION STAGE
# =========================
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl netcat-openbsd

COPY package*.json ./
COPY prisma.config.ts ./

RUN npm ci --omit=dev

# dist
COPY --from=builder /app/dist ./dist

# prisma client (ВАЖНО)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# schema + migrations (для migrate deploy)
COPY --from=builder /app/infrastructure/database/prisma ./infrastructure/database/prisma

RUN npm cache clean --force

# entrypoint
COPY entrypoint.sh ./entrypoint.sh
# делает файл исполняемым. Иначе: permission denied
RUN chmod +x entrypoint.sh

# security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 7898

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget -qO- http://localhost:7898/api/health || exit 1

CMD ["./entrypoint.sh"]