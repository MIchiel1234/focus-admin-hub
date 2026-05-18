# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static client with nginx
FROM nginx:alpine
COPY --from=build /app/dist/client /usr/share/nginx/html
# SPA fallback so deep links work
RUN printf 'server {\n  listen 8181;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 8181
CMD ["nginx", "-g", "daemon off;"]
