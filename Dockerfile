# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# This line will show us in the logs if 'dist' actually exists
RUN ls -la /app/dist

# Stage 2: Serve
FROM nginx:alpine
# Ensure the directory exists and is clean
RUN rm -rf /usr/share/nginx/html/*
# Copy from build stage
COPY --from=build /app/dist /usr/share/nginx/html
# Set permissions so Nginx can read the files
RUN chmod -R 755 /usr/share/nginx/html

# Custom Nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
