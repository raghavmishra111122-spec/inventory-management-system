# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy all frontend files and execute build
COPY . .
RUN npm run build

# Stage 2: Serve the compiled static assets with Nginx
FROM nginx:alpine

# Copy custom build outputs to default Nginx root directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
