# DOCKERFILE - Bauanleitung(инструкция по сборке) для Image 

# =========================
# BUILD STAGE
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl netcat-openbsd

COPY package*.json ./

# npm 10.9.8, который сейчас лежит в node:22-alpine, падает на резолвинге
# зависимостей этого проекта:
#   npm error Cannot read properties of null (reading 'edgesOut')
# Это баг arborist, а не наш граф — воспроизводится на голом package.json,
# без lock-файла, и одинаково у backend и frontend. Проверено: на npm 11
# оба резолвятся успешно.
#
# Причина того, что сборка сломалась «сама»: node:22-alpine — плавающий тег.
# Образ уехал на патч Node с этой версией npm, код при этом не менялся.
RUN npm install -g npm@11.19.1

RUN npm install

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

# То же самое во второй стадии: она собирается с нуля и берёт npm из образа.
RUN npm install -g npm@11.19.1

RUN npm install --omit=dev

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