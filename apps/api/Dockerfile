FROM node:22-alpine
WORKDIR /app

COPY apps/api/package*.json ./
RUN npm ci --omit=dev

COPY apps/api/ .

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]