# =========================
# BUILD STAGE
# =========================

FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build



# =========================
# PRODUCTION STAGE
# =========================

FROM nginx:1.25-alpine

# frontend build
COPY --from=build /app/build /usr/share/nginx/html

# nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
