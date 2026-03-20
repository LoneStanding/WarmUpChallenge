# ── Stage 1: Build the Vite frontend ─────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Install frontend dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all source files and build
COPY . .
RUN npm run build

# ── Stage 2: Production Node.js server ───────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# Install backend dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy compiled backend
COPY backend/ ./backend/

# Copy the built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Cloud Run sets PORT env var; default to 8080
ENV PORT=8080
EXPOSE 8080

# Start the backend (which will also serve the frontend)
CMD ["node", "backend/server.js"]
