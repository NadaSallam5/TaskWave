// apps/api/src/database/queries.js
import pool from '../config/database.js';

// ── Users ──────────────────────────────────────────────────────────────────

export async function createUser(id, email, passwordHash, name) {
  const { rows } = await pool.query(
    `INSERT INTO users (id, email, password_hash, name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, created_at`,
    [id, email, passwordHash, name]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, name, created_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export async function createJob(id, userId, type, payload, priority, maxAttempts) {
  const { rows } = await pool.query(
    `INSERT INTO jobs (id, user_id, type, payload, priority, max_attempts)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, userId, type, JSON.stringify(payload), priority, maxAttempts]
  );
  return rows[0];
}

export async function findJobsByUserId(userId, { limit = 20, offset = 0, status, type } = {}) {
  let sql = `SELECT * FROM jobs WHERE user_id = $1`;
  const params = [userId];
  let paramIndex = 2;

  if (status) {
    sql += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  if (type) {
    sql += ` AND type = $${paramIndex++}`;
    params.push(type);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function countJobsByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM jobs WHERE user_id = $1 GROUP BY status`,
    [userId]
  );
  return rows;
}

export async function findJobByIdAndUserId(jobId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM jobs WHERE id = $1 AND user_id = $2`,
    [jobId, userId]
  );
  return rows[0] || null;
}

export async function findJobById(jobId) {
  const { rows } = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [jobId]
  );
  return rows[0] || null;
}

export async function updateJob(jobId, fields) {
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = [
    'status', 'attempts', 'result', 'error', 'started_at', 'completed_at',
  ];

  for (const field of allowedFields) {
    if (fields[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex++}`);
      if (field === 'result') {
        params.push(JSON.stringify(fields[field]));
      } else {
        params.push(fields[field]);
      }
    }
  }

  if (setClauses.length === 0) return null;

  params.push(jobId);
  const { rows } = await pool.query(
    `UPDATE jobs SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return rows[0];
}

export async function deleteJobByIdAndUserId(jobId, userId) {
  const { rowCount } = await pool.query(
    `DELETE FROM jobs WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
    [jobId, userId]
  );
  return rowCount > 0;
}

export async function findRecentJobs(limit = 10) {
  const { rows } = await pool.query(
    `SELECT jobs.*, users.name AS user_name
     FROM jobs
     JOIN users ON jobs.user_id = users.id
     ORDER BY jobs.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

// ── Job Logs ───────────────────────────────────────────────────────────────

export async function createJobLog(id, jobId, level, message, data = null) {
  const { rows } = await pool.query(
    `INSERT INTO job_logs (id, job_id, level, message, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, jobId, level, message, data ? JSON.stringify(data) : null]
  );
  return rows[0];
}

export async function findLogsByJobId(jobId) {
  const { rows } = await pool.query(
    `SELECT * FROM job_logs WHERE job_id = $1 ORDER BY created_at ASC`,
    [jobId]
  );
  return rows;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getJobStats() {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM jobs GROUP BY status`
  );
  return rows;
}