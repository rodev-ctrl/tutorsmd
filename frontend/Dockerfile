# Build stage
FROM node:18 as build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production: NGINX
FROM nginx:1.25
COPY --from=build /app/build /usr/share/nginx/html

# копируем Nginx конфиг если нужно
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
