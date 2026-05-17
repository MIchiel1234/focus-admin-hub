# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Clean everything
RUN rm -rf /usr/share/nginx/html/*

# Copy the whole dist folder to a temp spot
COPY --from=build /app/dist /tmp/dist

# Manually move contents of client to the right place
RUN cp -r /tmp/dist/client/* /usr/share/nginx/html/

# Final Nginx Config
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
