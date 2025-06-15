# Multi-stage Dockerfile for ROI Labs Chatbot Training
# Enhanced with better error handling and debug logs - v1.0.2

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Add debug information
RUN echo "🏗️  Starting frontend build stage..."

# Copy frontend package files
COPY frontend/package*.json ./

# Show package.json info
RUN echo "📦 Frontend package.json:" && cat package.json | head -20

# Install ALL dependencies (including devDependencies for build tools like Vite)
RUN echo "📦 Installing frontend dependencies..." && \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Verify dependencies installed
RUN echo "✅ Node modules installed:" && ls -la node_modules | head -10

# Copy frontend source
COPY frontend/ ./

# List source files
RUN echo "📁 Frontend source files:" && ls -la

# Build frontend for production with enhanced logging
RUN echo "🏗️  Building frontend for production..." && \
    npm run build && \
    echo "✅ Frontend build completed!" && \
    echo "📁 Build output:" && ls -la dist/

# Verify build output
RUN test -f dist/index.html && echo "✅ index.html found" || echo "❌ index.html NOT found"

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app

# Add debug information
RUN echo "🏗️  Starting backend build stage..."

# Copy backend package files
COPY package*.json ./

# Install dependencies (use npm install if no lock file exists)
RUN echo "📦 Installing backend dependencies..." && \
    if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy backend source
COPY . ./

# Remove frontend directory (already built)
RUN rm -rf frontend

# Show backend structure
RUN echo "📁 Backend structure:" && ls -la

# Stage 3: Production Image
FROM node:18-alpine AS production

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

# Add debug information
RUN echo "🚀 Starting production stage..."

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

# Verify frontend was copied correctly
RUN echo "🔍 Checking frontend files in production:" && \
    ls -la public/ && \
    echo "📁 Dashboard directory:" && \
    ls -la public/dashboard/ && \
    test -f public/dashboard/index.html && echo "✅ Frontend index.html found in production!" || echo "❌ Frontend index.html NOT found in production!"

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R nextjs:nodejs logs uploads

# Copy health check script
COPY --chown=nextjs:nodejs healthcheck.js ./

# Show final app structure
RUN echo "📁 Final app structure:" && ls -la

# Expose port 3001 (matching your configuration)
EXPOSE 3001

# Switch to non-root user
USER nextjs

# Health check (using port 3001)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["npm", "run", "start:prod"]