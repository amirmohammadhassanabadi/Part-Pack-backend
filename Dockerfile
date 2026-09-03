FROM node:alpine
WORKDIR /app
ARG REGISTRY=https://registry.part-pack.ir/repository/npm-group/ 
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund --registry=${REGISTRY}
COPY . ./
CMD ["node", "server.js"]
