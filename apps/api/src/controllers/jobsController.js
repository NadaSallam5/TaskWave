// apps/api/src/controllers/jobsController.js
import { z } from 'zod';
import * as jobService from '../services/jobService.js';

const createJobSchema = z.object({
  type: z.enum(['email', 'image_resize', 'data_export', 'webhook']),
  payload: z.record(z.unknown()).optional().default({}),
  priority: z.number().int().min(0).max(9).optional().default(0),
  maxAttempts: z.number().int().min(1).max(10).optional().default(3),
});

const listJobsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  type: z.enum(['email', 'image_resize', 'data_export', 'webhook']).optional(),
});

export async function create(req, res, next) {
  try {
    const parsed = createJobSchema.parse(req.body);
    const job = await jobService.createJob(req.user.id, parsed);
    res.status(201).json({ job });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors[0].message });
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const parsed = listJobsSchema.parse(req.query);
    const jobs = await jobService.listJobs(req.user.id, parsed);
    res.json({ jobs });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors[0].message });
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const { job, logs } = await jobService.getJob(req.user.id, req.params.id);
    res.json({ job, logs });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await jobService.removeJob(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function stats(req, res, next) {
  try {
    const data = await jobService.getJobStats(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}