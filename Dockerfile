# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static client with nginx
FROM nginx:alpine
# Wipe nginx defaults (welcome page + default server config)
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*
COPY --from=build /app/dist/client /usr/share/nginx/html
# Listen on both 80 and 8181 so any host port mapping works; SPA fallback for deep links
RUN printf 'server {\n  listen 80 default_server;\n  listen 8181;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80 8181
CMD ["nginx", "-g", "daemon off;"]
