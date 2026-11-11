// apps/api/src/server.js
import app from './app.js';
import { redisClient } from './config/redis.js';
import { initializeSubscriber } from './services/eventService.js';
import env from './config/index.js';

async function start() {
  try {
    await redisClient.connect();
    console.log('[Redis] Client connected');

    console.log(await redisClient.info("server"));

    await initializeSubscriber();
    console.log('[Redis] Subscriber initialized');
    app.listen(env.PORT, env.HOST, () => {
      console.log(`[Server] Taskwave API running on ${env.HOST}:${env.PORT}`);
    });
  } catch (err) {
    console.error('[Startup] Failed to start:', err);
    process.exit(1);
  }
}

start();
