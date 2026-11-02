# Multi-stage Dockerfile for Vite React SPA on CapRover
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Compile production bundle
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
