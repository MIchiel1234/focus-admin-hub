# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# This creates the .output folder
RUN npm run build

# Stage 2: Run the actual server
FROM node:22-slim
WORKDIR /app

# Copy the build output (the engine)
COPY --from=build /app/.output ./.output
COPY --from=build /app/package*.json ./

# TanStack Start / Nitro usually puts the entry point here:
EXPOSE 8181
ENV PORT=8181
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Start the actual app engine
CMD ["node", ".output/server/index.mjs"]
