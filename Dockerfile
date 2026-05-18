# Stage 1: Build the TanStack Start app
FROM node:22-slim AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# Stage 2: Run the built server bundle
FROM node:22-slim
WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 8181
ENV PORT=8181
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", "dist/server/index.js"]
