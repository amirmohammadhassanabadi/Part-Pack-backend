# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci \
    --omit=dev \
    --no-audit \
    --no-fund \
    --ignore-scripts \
    --registry=https://registry.part-pack.ir/repository/npm-group/


# ---------- Runtime ----------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Run as the unprivileged Node user
USER node

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node instrumentation.js server.js ./
COPY --chown=node:node src ./src

EXPOSE 4000

CMD ["node", "server.js"]