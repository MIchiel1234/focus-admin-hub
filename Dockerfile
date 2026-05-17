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
# Use 'http-server' instead of 'serve'
RUN npm install -g http-server
COPY --from=build /app/dist/client .

EXPOSE 8181

# -p is port, -proxy is for SPA routing (redirects 404s to index.html)
CMD ["http-server", ".", "-p", "8181", "--proxy", "http://localhost:8181?"]
