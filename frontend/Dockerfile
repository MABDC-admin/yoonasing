# Stage 1: Build the Vite React App
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# The build requires the VITE_YOUTUBE_API_KEY to be available, 
# or injected at runtime. Since Vite compiles it statically, we accept it as an ARG.
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
