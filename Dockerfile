# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

# Build for Node/Bun environment
ENV DOCKER=true
RUN bun run build

# Stage 2: Production
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production
ENV DOCKER=true

# Copy only the necessary build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lockb ./bun.lockb

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Use a non-root user for security
USER bun

EXPOSE 3000

# Use preview to run the built application
CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
