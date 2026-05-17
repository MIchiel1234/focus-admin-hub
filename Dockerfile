# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
# We use Node 22 because your logs showed TanStack wants Node >=22
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# 1. Clean the default directory
RUN rm -rf /usr/share/nginx/html/*

# 2. Copy from the 'dist/client' folder we saw in your logs
COPY --from=build /app/dist/client/. /usr/share/nginx/html/

# 3. Standard Vite/React Nginx config
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# 4. Permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
