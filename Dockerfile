# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Remove default Nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy ONLY the contents of dist/client into the root
# The /. tells Docker to copy the files, not the folder itself
COPY --from=build /app/dist/client/. /usr/share/nginx/html/

# Vite/TanStack SPA Config
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
