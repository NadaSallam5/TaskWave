// apps/api/src/lib/pubsub.js
import { redisClient } from '../config/redis.js';

const EVENTS_CHANNEL = 'taskwave:events';

export async function publishEvent(event) {
  await redisClient.publish(EVENTS_CHANNEL, JSON.stringify(event));
}