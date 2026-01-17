# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve (using simple http-server or nginx, let's use serve for simplicity in MERN context, or just vite preview)
# For production readiness, Nginx is better, but allow 'serve' for now or Vite preview.
# Let's stick to a simple Node serve for the build folder or Nginx.
# Nginx is standard.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
