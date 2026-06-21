FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM dependencies AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ENV PORT=80
ENV ENABLE_API_PROXY=false
ENV API_PROXY_URL=

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/05-render-nginx-template.sh /docker-entrypoint.d/05-render-nginx-template.sh
RUN chmod +x /docker-entrypoint.d/05-render-nginx-template.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
