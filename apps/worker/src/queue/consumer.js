// apps/worker/src/queue/consumer.js
import { nanoid } from "nanoid";
import redisClient from "../config/redis.js";
import pool from "../config/database.js";
import { process as processEmail } from "../processors/email.js";
import { process as processImageResize } from "../processors/imageResize.js";
import { process as processDataExport } from "../processors/dataExport.js";
import { process as processWebhook } from "../processors/webhook.js";

const QUEUE_KEY = "taskwave:queue";
const EVENTS_CHANNEL = "taskwave:events";
const POLL_INTERVAL = 500;

const processors = {
  email: processEmail,
  image_resize: processImageResize,
  data_export: processDataExport,
  webhook: processWebhook,
};

// ── Database helpers ───────────────────────────────────────────────────────

async function findJobById(jobId) {
  const { rows } = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [
    jobId,
  ]);
  return rows[0] || null;
}

async function updateJob(jobId, fields) {
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = [
    "status",
    "attempts",
    "result",
    "error",
    "started_at",
    "completed_at",
  ];

  for (const field of allowedFields) {
    if (fields[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex++}`);
      if (field === "result") {
        params.push(JSON.stringify(fields[field]));
      } else {
        params.push(fields[field]);
      }
    }
  }

  if (setClauses.length === 0) return null;

  params.push(jobId);
  const { rows } = await pool.query(
    `UPDATE jobs SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    params,
  );
  return rows[0];
}

async function insertJobLog(jobId, level, message, data = null) {
  const id = nanoid();
  await pool.query(
    `INSERT INTO job_logs (id, job_id, level, message, data) VALUES ($1, $2, $3, $4, $5)`,
    [id, jobId, level, message, data ? JSON.stringify(data) : null],
  );
}

// ── Queue helpers ──────────────────────────────────────────────────────────

async function enqueueJob(jobId, priority) {
  const score = priority * 1000000000 + Date.now();
  await redisClient.zAdd(QUEUE_KEY, [{ score, value: jobId }]);
}

async function publishEvent(event) {
  await redisClient.publish(EVENTS_CHANNEL, JSON.stringify(event));
}

// ── Job processing ─────────────────────────────────────────────────────────

async function processJob(jobId, workerId) {
  console.log("[Worker] Processing job:", jobId);

  const job = await findJobById(jobId);

  if (!job) {
    console.warn(`[Worker] Job ${jobId} not found in database, skipping`);
    return;
  }

  if (job.status === "cancelled") {
    console.log(`[Worker] Job ${jobId} is cancelled, skipping`);
    return;
  }

  const processor = processors[job.type];
  if (!processor) {
    console.error(`[Worker] No processor for type "${job.type}"`);
    await updateJob(jobId, {
      status: "failed",
      error: `Unknown job type: ${job.type}`,
      completed_at: new Date(),
    });
    await insertJobLog(jobId, "error", `Unknown job type: ${job.type}`);
    await publishEvent({
      type: "job:failed",
      job: { id: jobId, type: job.type, status: "failed" },
    });
    return;
  }

  await updateJob(jobId, { status: "running", started_at: new Date() });
  await insertJobLog(jobId, "info", `Job started by worker ${workerId}`);
  await publishEvent({
    type: "job:started",
    job: { id: jobId, type: job.type, status: "running", workerId },
  });

  try {
    const payload =
      typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload;
    const result = await processor(payload);

    await updateJob(jobId, {
      status: "completed",
      result,
      completed_at: new Date(),
    });
    await insertJobLog(jobId, "info", "Job completed successfully", { result });
    await publishEvent({
      type: "job:completed",
      job: { id: jobId, type: job.type, status: "completed", result },
    });

    console.log(`[Worker] Job ${jobId} (${job.type}) completed`);
  } catch (err) {
    const nextAttempt = job.attempts + 1;
    const message = err.message || "Unknown error";

    await insertJobLog(jobId, "error", `Job failed: ${message}`, {
      attempt: nextAttempt,
    });

    if (nextAttempt < job.max_attempts) {
      const backoff = Math.pow(2, nextAttempt) * 1000;
      console.log(
        `[Worker] Job ${jobId} failed (attempt ${nextAttempt}/${job.max_attempts}), retrying in ${backoff}ms`,
      );

      await updateJob(jobId, {
        status: "pending",
        attempts: nextAttempt,
      });

      setTimeout(async () => {
        try {
          await enqueueJob(jobId, job.priority);
          console.log(`[Worker] Job ${jobId} re-enqueued after backoff`);
        } catch (enqueueErr) {
          console.error(
            `[Worker] Failed to re-enqueue job ${jobId}:`,
            enqueueErr.message,
          );
        }
      }, backoff);
    } else {
      console.log(
        `[Worker] Job ${jobId} failed permanently after ${nextAttempt} attempts`,
      );

      await updateJob(jobId, {
        status: "failed",
        attempts: nextAttempt,
        error: message,
        completed_at: new Date(),
      });

      await publishEvent({
        type: "job:failed",
        job: { id: jobId, type: job.type, status: "failed", error: message },
      });
    }
  }
}

// ── Consumer loop ──────────────────────────────────────────────────────────

export function startConsumer(workerId) {
  let running = true;

  const loop = async () => {
    if (!running) return;

    try {
      const result = await redisClient.zPopMin(QUEUE_KEY);

      if (!result) {
        return;
      }

      const jobId = result.value;

      console.log("[Worker] Picked:", jobId);

      await processJob(jobId, workerId);
    } catch (err) {
      console.error("[Worker] Poll error:", err);
    }
  };

  const interval = setInterval(loop, POLL_INTERVAL);

  loop();

  return () => {
    running = false;
    clearInterval(interval);
  };
}
