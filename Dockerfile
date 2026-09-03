FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund --registry=https://registry.part-pack.ir/repository/npm-group/
COPY . ./
CMD ["node", "server.js"]
