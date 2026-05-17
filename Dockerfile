# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
# We use 'npm install' to handle the dependencies correctly
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-slim
WORKDIR /app
# Only copy the production output and necessary files
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

# TanStack Start / Nitro environment variables
ENV NODE_ENV=production
ENV PORT=3005
ENV HOST=0.0.0.0

EXPOSE 3005

# The actual entry point for TanStack Start production builds
CMD ["node", ".output/server/index.mjs"]FROM node:20-slim
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# We use 3005 to stay away from Coolify's 3000
ENV PORT=3005
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3005

# This starts the Nitro server (the heart of TanStack Start)
CMD ["node", ".output/server/index.mjs"]
