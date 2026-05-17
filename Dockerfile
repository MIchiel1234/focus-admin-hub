# Stage 1: Build the client bundle
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Node-based static server with SPA fallback
FROM node:22-slim
WORKDIR /app

# `serve` is a tiny Node static file server. -s enables SPA fallback
# (every unknown path returns index.html) so TanStack client routing works.
RUN npm install -g serve@14

COPY --from=build /app/dist/client ./public

EXPOSE 8181
ENV PORT=8181
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["serve", "-s", "public", "-l", "tcp://0.0.0.0:8181"]
