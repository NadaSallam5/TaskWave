// apps/worker/src/startWorker.js

import { nanoid } from "nanoid";
import redisClient from "./config/redis.js";
import pool from "./config/database.js";
import { startConsumer } from "./queue/consumer.js";

const WORKER_PREFIX = "taskwave:worker:";
const HEARTBEAT_INTERVAL = 10000;
const HEARTBEAT_TTL = 30;

let workerId;
let heartbeatTimer;
let stopConsumer;
let jobsProcessed = 0;
let currentJob = null;

async function sendHeartbeat() {
  const key = `${WORKER_PREFIX}${workerId}`;

  await redisClient.hSet(key, {
    last_heartbeat: Date.now().toString(),
    current_job: currentJob || "",
    jobs_processed: jobsProcessed.toString(),
    started_at: Date.now().toString(),
  });

  await redisClient.expire(key, HEARTBEAT_TTL);
}

export async function startWorker() {
  workerId = nanoid(10);

  await redisClient.connect();

  await sendHeartbeat();

  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  stopConsumer = startConsumer(workerId);

  console.log("[Worker] Started inside API process");
}