# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the TanStack Start server
FROM node:22-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/docker-server.mjs ./docker-server.mjs
COPY --from=build /app/package*.json ./
EXPOSE 8181
ENV PORT=8181
ENV HOST=0.0.0.0
ENV NODE_ENV=production
CMD ["node", "docker-server.mjs"]
