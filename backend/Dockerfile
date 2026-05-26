
# =========================
# BUILD STAGE
# =========================

FROM node:22-alpine AS builder

WORKDIR /app

# Prisma needs OpenSSL
RUN apk add --no-cache openssl

COPY package*.json ./

# deterministic install
RUN npm ci

COPY . .

# Prisma Client generation
RUN npx prisma generate

# Build TypeScript
RUN npm run build



# =========================
# PRODUCTION STAGE
# =========================

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Prisma/OpenSSL runtime dependency
RUN apk add --no-cache openssl

COPY package*.json ./

# only production deps
RUN npm ci --omit=dev

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
CMD wget --spider http://localhost:7898 || exit 1

# dist
COPY --from=builder /app/dist ./dist

# prisma schema + migrations
COPY --from=builder /app/prisma ./prisma

# generated prisma engine
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# generated prisma client
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

EXPOSE 7898

CMD ["node", "dist/index.js"]
