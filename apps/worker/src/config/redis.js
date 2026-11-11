// apps/worker/src/config/redis.js
import { createClient } from 'redis';
import env from './index.js';

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

export default redisClient;