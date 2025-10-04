
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
COPY tsconfig.json ./
COPY src ./src
RUN ls -la
RUN npm i
RUN npm run build
EXPOSE 3000
CMD ["node","dist/index.js"]
