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
RUN npm install -g serve
COPY --from=build /app/dist/client .

# Move to 8181 to avoid the AMP panel
EXPOSE 8181
CMD ["serve", "-s", ".", "-l", "8181"]
