# Stage 1: Build the TanStack Start app
FROM node:22-slim AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# Stage 2: Run the built TanStack server with Vite preview
FROM node:22-slim
WORKDIR /app

COPY --from=build /app ./

EXPOSE 8181
ENV PORT=8181
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8181"]
