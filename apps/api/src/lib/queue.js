import { redisClient } from "../config/redis.js";

const QUEUE_KEY = "taskwave:queue";

export async function enqueueJob(jobId, priority) {
  const score = priority * 1000000000 + Date.now();

  console.log("[API] Adding job:", jobId);
  console.log("[API] Score:", score);

  await redisClient.zAdd(QUEUE_KEY, [
    {
      score,
      value: jobId,
    },
  ]);
  const members = await redisClient.zRange(QUEUE_KEY, 0, -1);
  console.log("QUEUE CONTENTS:", members);

  console.log("[API] Added to Redis successfully");
}

export async function removeJobFromQueue(jobId) {
  await redisClient.zRem(QUEUE_KEY, jobId);
}
