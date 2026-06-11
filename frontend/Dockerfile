# Stage 1: Build the Angular App
FROM node:20-alpine as build
WORKDIR /app

ENV NODE_ENV=development

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Angular doesn't need these VITE args anymore, but Coolify might pass them
# so we accept them to prevent build arguments errors
ARG VITE_YOUTUBE_API_KEY
ARG VITE_BACKEND_URL

RUN npm run build || (echo "BUILD FAILED. Printing logs:" && cat /root/.npm/_logs/*-debug.log && exit 1)

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Angular 17+ outputs to dist/frontend/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
