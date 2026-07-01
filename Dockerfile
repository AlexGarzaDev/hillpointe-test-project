# Railway auto-detects this root Dockerfile and builds a single container
# that serves both the API and the built web frontend.

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json ./

# Copy workspace manifests required for npm workspaces
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/api ./apps/api
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build shared workspace, API, and web frontend
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy root manifests for runtime install
COPY package.json package-lock.json ./

# Copy runtime workspace manifests
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Expose API port (Railway will map this internally)
EXPOSE 3000

# Health check respects Railway's injected PORT value when present
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000; require('http').get('http://localhost:'+p+'/version', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

# Start API
CMD ["npm", "run", "start"]
