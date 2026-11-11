// apps/worker/src/worker.js
import { nanoid } from "nanoid";
import redisClient from "./config/redis.js";
import pool from "./config/database.js";
import { startConsumer } from "./queue/consumer.js";
import env from "./config/index.js";

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
  const now = Date.now().toString();

  await redisClient.hSet(key, {
    last_heartbeat: now,
    current_job: currentJob || "",
    jobs_processed: jobsProcessed.toString(),
    started_at: now,
  });

  await redisClient.expire(key, HEARTBEAT_TTL);
}

async function registerShutdown() {
  const shutdown = async (signal) => {
    console.log(`\n[Worker] Received ${signal}, shutting down...`);

    if (stopConsumer) stopConsumer();
    clearInterval(heartbeatTimer);

    try {
      await redisClient.del(`${WORKER_PREFIX}${workerId}`);
      await pool.end();
      await redisClient.quit();
      console.log("[Worker] Clean shutdown complete");
    } catch (err) {
      console.error("[Worker] Error during shutdown:", err.message);
    }

    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("uncaughtException", (err) => {
    console.error("[Worker] Uncaught exception:", err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[Worker] Unhandled rejection:", reason);
    shutdown("unhandledRejection");
  });
}

async function start() {
  workerId = nanoid(10);
  console.log(`[Worker] Starting worker ${workerId}`);

  try {
    await redisClient.connect();
    console.log("[Worker] Redis connected");
    console.log(
      "Worker queue:",
      await redisClient.zRange("taskwave:queue", 0, -1),
    );
    console.log(await redisClient.info("server"));

    await sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    console.log(
      `[Worker] Heartbeat started (every ${HEARTBEAT_INTERVAL / 1000}s, TTL ${HEARTBEAT_TTL}s)`,
    );

    stopConsumer = startConsumer(workerId);
    console.log("[Worker] Consumer started (polling every 500ms)");

    await registerShutdown();

    console.log("[Worker] Ready");
  } catch (err) {
    console.error("[Worker] Failed to start:", err);
    process.exit(1);
  }
}

start();
