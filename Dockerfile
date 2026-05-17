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

# Install 'serve' - a better tool for modern apps
RUN npm install -g serve

# Copy ONLY the built client files
COPY --from=build /app/dist/client .

# Use Port 8080 to stay far away from Coolify (3000) and Nginx (80)
EXPOSE 8080

# Start the server with SPA routing support (-s)
CMD ["serve", "-s", ".", "-l", "8080"]
