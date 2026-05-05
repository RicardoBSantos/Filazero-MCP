# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY index.ts ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S mcpgroup && adduser -S mcpuser -G mcpgroup

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV FILAZERO_API_URL=https://api.staging.filazero.net
ENV FILAZERO_APP_ORIGIN=https://app.filazero.net
ENV CACHE_TTL_COMPANIES=300

USER mcpuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
