# Stage 1: Build the Vite React App
FROM node:18-alpine as build
WORKDIR /app

# Force NODE_ENV to development so npm installs all devDependencies (like Vite)
ENV NODE_ENV=development

# Only copy package.json (NOT package-lock.json) to avoid cross-platform native binary issues (e.g. esbuild musl vs Windows)
COPY package.json ./
RUN npm install

COPY . .

# Now switch back to production for the actual build
ENV NODE_ENV=production

# Increase Node memory limit to prevent OOM kills on small Coolify servers
ENV NODE_OPTIONS="--max-old-space-size=2048"

ARG VITE_YOUTUBE_API_KEY
ARG VITE_BACKEND_URL
ENV VITE_YOUTUBE_API_KEY=$VITE_YOUTUBE_API_KEY
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Run the build command, and if it fails, output the error logs
RUN npm run build || (echo "BUILD FAILED. Printing logs:" && cat /root/.npm/_logs/*-debug.log && exit 1)

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
