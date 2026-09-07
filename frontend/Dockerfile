# =========================
# BUILD STAGE
# =========================

FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

# npm, идущий в текущем node:22-alpine (10.9.8), падает на резолвинге
# зависимостей этого проекта:
#   npm error Cannot read properties of null (reading 'edgesOut')
# Баг arborist, не наш граф: воспроизводится на голом package.json без
# lock-файла и одинаково у frontend и backend. Тег node:22-alpine плавающий,
# поэтому образ доехал до этой версии npm сам, без единой правки в коде —
# сборка, работавшая месяц назад, перестала собираться.
RUN npm install -g npm@11.19.1

RUN npm install

COPY . .

RUN npm run build



# =========================
# PRODUCTION STAGE
# =========================

FROM nginx:1.25-alpine

# frontend build
# Vite пишет в dist, а не в build
COPY --from=build /app/dist /usr/share/nginx/html    

# nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
