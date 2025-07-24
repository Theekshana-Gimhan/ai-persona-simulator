# Stage 1: Build the React application
FROM node:20-alpine as builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx public folder
RUN rm -rf ./*

# Copy built assets from the builder stage
COPY --from=builder /app/dist .

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 and start Nginx, substituting PORT environment variable
EXPOSE 8080
CMD ["sh", "-c", "envsubst \"$PORT\" < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf && nginx -g \"daemon off;\""]
