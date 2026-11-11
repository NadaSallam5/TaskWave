FROM node:22-alpine
WORKDIR /app

COPY apps/worker/package*.json ./
RUN npm ci --omit=dev

COPY apps/worker/ .

USER node
CMD ["npm", "start"]