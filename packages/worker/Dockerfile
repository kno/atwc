FROM node:20-bullseye AS build
WORKDIR /app
# Dependencias nativas para TDLib
RUN apt-get update && apt-get install -y git cmake g++ make wget zlib1g-dev libssl-dev && rm -rf /var/lib/apt/lists/*

# Construir TDLib
RUN git clone --depth=1 https://github.com/tdlib/td.git && \
    mkdir -p td/build && cd td/build && \
    cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX:PATH=/usr/local .. && \
    cmake --build . --target install -j$(nproc)

# App worker
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV TDJSON_PATH=/usr/local/lib/libtdjson.so
VOLUME ["/data/tdlib"]
CMD ["node","dist/index.js"]
