// apps/api/src/services/eventService.js
import { subscriberClient } from '../config/redis.js';

const CHANNEL = 'taskwave:events';
const clients = new Set();
let initialized = false;

export async function initializeSubscriber() {
  if (initialized) return;

  await subscriberClient.connect();
  await subscriberClient.subscribe(CHANNEL, (message) => {
    try {
      const event = JSON.parse(message);
      broadcast(event);
    } catch {
      // ignore malformed messages
    }
  });

  initialized = true;
}

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcast(event) {
  const data = JSON.stringify(event);
  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}