FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . ./
CMD ["node", "server.js"]
