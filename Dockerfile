# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies with legacy-peer-deps to avoid the TS version conflict
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from stage 1
# Assuming standard Angular 17+ build path: dist/gemini-media-studio/browser
COPY --from=build /app/dist/gemini-media-studio/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
