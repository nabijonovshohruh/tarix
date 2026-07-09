# Build context is the repo root (see docker-compose.yml / platform build settings)
# so this stage can reach ../frontend and bake the built static app into the
# same image the backend serves in production (see app.ts's express.static).
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
# Alpine ships no `openssl` CLI by default, which Prisma's engine-detection
# shells out to at generate time — without it, it silently defaults to the
# wrong (OpenSSL 1.1) engine binary, which then fails to load at runtime.
RUN apk add --no-cache openssl
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
# The query engine binary itself dynamically links against libssl, so the
# runtime stage needs it too, not just the build stage.
RUN apk add --no-cache openssl
WORKDIR /app
# Hardcoded, not sourced from .env — cannot be overridden by env file misconfiguration.
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-build /app/frontend/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
