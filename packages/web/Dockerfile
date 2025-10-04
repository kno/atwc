
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm ci
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
