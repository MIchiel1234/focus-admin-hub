FROM node:20-slim
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
