FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
# Use legacy peer deps due to the vite-pwa plugin version strictness
RUN npm install --legacy-peer-deps

# Build the PWA
COPY . .
RUN npm run build

# Serve with lightweight Nginx
FROM nginx:alpine
# Copy custom Nginx configuration to listen on port 8080 and handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run expects 8080 by default
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
