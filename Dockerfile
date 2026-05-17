# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:22-slim
WORKDIR /app
RUN npm install -g http-server

# Cloudflare builds put static files in dist/client
# We copy them to the root
COPY --from=build /app/dist/client/. .

# CRITICAL FIX: If TanStack didn't make an index.html, 
# we use the 200.html (which Cloudflare usually uses) as our index.
RUN if [ ! -f index.html ] && [ -f 200.html ]; then cp 200.html index.html; fi

EXPOSE 8181

# --spa is mandatory here because it tells http-server to 
# treat index.html as the entry point for all routes
CMD ["http-server", ".", "-p", "8181", "--spa"]# Stage 1: Build
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
