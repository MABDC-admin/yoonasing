# Stage 1: Build the Vite React App
FROM node:18-alpine as build
WORKDIR /app

# Force NODE_ENV to development so npm installs all devDependencies (like Vite)
# Coolify often forces NODE_ENV=production globally which breaks Vite builds.
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .

# Now switch back to production for the actual build
ENV NODE_ENV=production

ARG VITE_YOUTUBE_API_KEY
ARG VITE_BACKEND_URL
ENV VITE_YOUTUBE_API_KEY=$VITE_YOUTUBE_API_KEY
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
