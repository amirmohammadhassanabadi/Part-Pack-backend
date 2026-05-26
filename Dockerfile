FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN  npm config --global set registry https://mirror.abrha.net/repository/npm/ && npm ci --only=production
COPY . ./
CMD ["node", "server.js"]
