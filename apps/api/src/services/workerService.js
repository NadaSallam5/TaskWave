// apps/api/src/services/workerService.js
import { redisClient } from '../config/redis.js';

const WORKER_PREFIX = 'taskwave:worker:';

export async function getWorkers() {
  let cursor = '0';
  const keys = [];

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `${WORKER_PREFIX}*`,
      COUNT: 100,
    });
    cursor = result.cursor;
    keys.push(...result.keys);
  } while (cursor !== '0');

  console.log("Worker keys:", keys);

  if (keys.length === 0) return [];

  const workers = await Promise.all(
    keys.map(async (key) => {
      const id = key.slice(WORKER_PREFIX.length);
      const data = await redisClient.hGetAll(key);
      const ttl = await redisClient.pTTL(key);

      return {
        id,
        status: ttl === -2 ? 'offline' : 'online',
        lastHeartbeat: data.last_heartbeat
          ? new Date(Number(data.last_heartbeat)).toISOString()
          : null,
        currentJob: data.current_job || null,
        jobsProcessed: parseInt(data.jobs_processed || '0', 10),
        startedAt: data.started_at || null,
        ttl: ttl > 0 ? ttl : 0,
      };
    })
  );

  return workers;
}