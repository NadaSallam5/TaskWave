// apps/api/src/config/redis.js
import { createClient } from 'redis';
import env from './index.js';

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

const subscriberClient = createClient({
  url: env.REDIS_URL,
});

subscriberClient.on('error', (err) => {
  console.error('Redis subscriber error:', err);
});

export { redisClient, subscriberClient };