// apps/api/src/services/jobService.js
import { nanoid } from 'nanoid';
import {
  createJob as createJobInDb,
  findJobsByUserId,
  findJobByIdAndUserId,
  findLogsByJobId,
  deleteJobByIdAndUserId,
  countJobsByUserId,
} from '../database/queries.js';
import { enqueueJob, removeJobFromQueue } from '../lib/queue.js';
import { publishEvent } from '../lib/pubsub.js';

const VALID_TYPES = ['email', 'image_resize', 'data_export', 'webhook'];

export async function createJob(userId, { type, payload = {}, priority = 0, maxAttempts = 3 }) {
  console.log("STEP 1");

  if (!VALID_TYPES.includes(type)) {
    throw new Error("Invalid type");
  }

  console.log("STEP 2");

  const id = nanoid();

  console.log("STEP 3");

  const job = await createJobInDb(
    id,
    userId,
    type,
    payload,
    priority,
    maxAttempts
  );

  console.log("STEP 4", job);

  await enqueueJob(id, priority);

  console.log("STEP 5");

  await publishEvent({
    type: "job:created",
    job,
  });

  console.log("STEP 6");

  return job;
}

export async function listJobs(userId, filters) {
  return findJobsByUserId(userId, filters);
}

export async function getJob(userId, jobId) {
  const job = await findJobByIdAndUserId(jobId, userId);
  if (!job) {
    const error = new Error('Job not found');
    error.status = 404;
    throw error;
  }

  const logs = await findLogsByJobId(jobId);

  return { job, logs };
}

export async function removeJob(userId, jobId) {
  const deleted = await deleteJobByIdAndUserId(jobId, userId);
  if (!deleted) {
    const error = new Error('Job not found or not in pending status');
    error.status = 404;
    throw error;
  }

  await removeJobFromQueue(jobId);
  await publishEvent({ type: 'job:deleted', jobId, userId });

  return true;
}

export async function getJobStats(userId) {
  const rows = await countJobsByUserId(userId);
  const stats = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
  };

  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }

  return stats;
}