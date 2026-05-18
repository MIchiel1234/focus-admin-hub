# Stage 1: Build (prerenders every route to static HTML)
FROM node:22-slim AS build
WORKDIR /app
# Give Node enough heap for the Vite SSR + prerender pass — small containers
# (≤1GB) OOM-kill the build silently otherwise.
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package*.json ./
# Use `npm ci` when a lockfile exists for reproducible installs; fall back to
# `npm install` if it's missing so the build still works.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# Stage 2: Tiny Node static server
FROM node:22-slim
WORKDIR /app

# `serve` is a small Node static file server. We do NOT use -s (SPA rewrite)
# because every route is prerendered to its own /route/index.html — `serve`
# resolves directory requests to index.html automatically, so deep links and
# refreshes work natively without rewriting everything to /.
RUN npm install -g serve@14

COPY --from=build /app/dist/client ./public

EXPOSE 8181
ENV PORT=8181
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["serve", "public", "-l", "tcp://0.0.0.0:8181"]
