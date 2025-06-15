# Multi-stage Dockerfile for ROI Labs Chatbot Training
# Optimized for production with React frontend build

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies (use npm install if no lock file exists)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install dependencies (use npm install if no lock file exists)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy backend source
COPY . ./

# Remove frontend directory (already built)
RUN rm -rf frontend

# Stage 3: Production Image
FROM node:18-alpine AS production

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy backend from builder stage
COPY --from=backend-builder --chown=nextjs:nodejs /app ./

# Copy built frontend to public directory
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/dist ./public/dashboard

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R nextjs:nodejs logs uploads

# Copy health check script
COPY --chown=nextjs:nodejs healthcheck.js ./

# Expose port 3001 (matching your configuration)
EXPOSE 3001

# Switch to non-root user
USER nextjs

# Health check (using port 3001)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["npm", "run", "start:prod"]