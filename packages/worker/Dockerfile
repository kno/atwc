FROM node:20-bullseye
WORKDIR /app

# Instalar solo dependencias runtime necesarias
RUN apt-get update && \
    apt-get install -y libssl1.1 && \
    rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias
COPY package.json package-lock.json* .npmrc* ./

# Instalar dependencias (incluye tdl-tdlib-addon con binarios precompilados)
RUN npm install --production=false

# Copiar código fuente y compilar TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# El binario de TDLib viene incluido en node_modules/tdl-tdlib-addon
VOLUME ["/data/tdlib"]
CMD ["node","dist/index.js"]
