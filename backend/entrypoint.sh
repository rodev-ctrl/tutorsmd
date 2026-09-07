#!/bin/sh

echo "⏳ Waiting for database..."

until nc -z postgres 5432; do
  sleep 1
done

echo "🚀 Running migrations..."
# Версия закреплена намеренно и должна совпадать с devDependencies.prisma
# в package.json.
#
# В продовом образе стоит `npm install --omit=dev`, а prisma лежит в
# devDependencies — то есть CLI внутри контейнера НЕТ, и `npx prisma` каждый
# раз тянет из сети ПОСЛЕДНЮЮ версию. Пока последней была 6.x, всё работало.
# Сейчас последняя — Prisma 7, а она запрещает `url` в блоке datasource и
# падает с P1012 на нашей схеме:
#
#   Error: Prisma schema validation - (get-config wasm)
#   error: The datasource property `url` is no longer supported in schema files
#
# Без пина любой свежий контейнер (новый деплой, пересборка, docker compose run)
# перестаёт мигрировать — при том, что код и схема не менялись.
npx --yes prisma@6.18.0 migrate deploy

echo "✅ Starting server..."
node dist/index.js