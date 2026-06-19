# =========================
# BUILD STAGE
# =========================

FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

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
