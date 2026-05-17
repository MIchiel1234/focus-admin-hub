# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Force delete the default nginx html files first
RUN rm -rf /usr/share/nginx/html/*
# Copy your built files into the standard nginx folder
COPY --from=build /app/dist /usr/share/nginx/html
# Standard Nginx config for Single Page Apps (Vite/Lovable)
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
