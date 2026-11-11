// loadtest.js — TaskWave throughput/latency benchmark
// Requires Node 18+ (built-in fetch). Run: node loadtest.js
//
// Before running:
//   1. docker compose up --build -d --scale worker=3   (scale workers for real throughput)
//   2. Make sure API is reachable at BASE_URL (set via env, see below)
//
// Examples:
//   node loadtest.js
//   BASE_URL=http://api.example.com node loadtest.js
//   BASE_URL=http://10.0.0.15:3000 NUM_JOBS=5000 CONCURRENCY=100 node loadtest.js

// NOTE: 0.0.0.0 is a server bind address, not a valid client target.
// Use a real hostname/IP here (localhost, a domain, or the server's IP).
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const NUM_JOBS = Number(process.env.NUM_JOBS) || 1000;        // total jobs to enqueue
const CONCURRENCY = Number(process.env.CONCURRENCY) || 50;    // parallel enqueue requests
const TEST_EMAIL = `loadtest_${Date.now()}@example.com`;
const TEST_PASSWORD = 'LoadTest123!';

async function registerAndLogin() {
  const reg = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Load Test' }),
  });
  if (!reg.ok) {
    throw new Error(`Register failed: ${reg.status} ${await reg.text()}`);
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Login failed: ' + JSON.stringify(data));
  return data.token;
}

async function enqueueJob(token) {
  const res = await fetch(`${BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'email',
      payload: { to: 'test@example.com', subject: 'Load test', body: 'hi' },
      priority: Math.floor(Math.random() * 10),
    }),
  });
  if (!res.ok) throw new Error(`Enqueue failed: ${res.status}`);
  return res.json();
}

async function getStats(token) {
  const res = await fetch(`${BASE_URL}/jobs/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function runBatch(token, count) {
  const promises = [];
  for (let i = 0; i < count; i++) promises.push(enqueueJob(token));
  return Promise.all(promises);
}

async function main() {
  console.log(`Target: ${BASE_URL}`);
  console.log(`Registering test user...`);
  const token = await registerAndLogin();

  console.log(`Enqueueing ${NUM_JOBS} jobs (concurrency ${CONCURRENCY})...`);
  const enqueueStart = Date.now();

  for (let i = 0; i < NUM_JOBS; i += CONCURRENCY) {
    const batchSize = Math.min(CONCURRENCY, NUM_JOBS - i);
    await runBatch(token, batchSize);
    process.stdout.write(`\r  enqueued ${Math.min(i + batchSize, NUM_JOBS)}/${NUM_JOBS}`);
  }
  const enqueueEnd = Date.now();
  console.log(`\nEnqueue done in ${((enqueueEnd - enqueueStart) / 1000).toFixed(2)}s`);

  console.log(`Waiting for jobs to be processed by workers...`);
  const processStart = Date.now();
  let stats;
  let lastCompleted = -1;
  let stableCount = 0;

  while (true) {
    stats = await getStats(token);
    const done = (stats.completed || 0) + (stats.failed || 0);
    process.stdout.write(`\r  completed=${stats.completed || 0} failed=${stats.failed || 0} pending=${stats.pending || 0} running=${stats.running || 0}`);

    if (done >= NUM_JOBS) break;

    // safety: stop if nothing changes for 30s (worker not running, etc.)
    if (done === lastCompleted) {
      stableCount++;
      if (stableCount > 30) {
        console.log('\nNo progress for 30s — stopping. Check worker containers are running.');
        break;
      }
    } else {
      stableCount = 0;
    }
    lastCompleted = done;

    await new Promise((r) => setTimeout(r, 1000));
  }

  const processEnd = Date.now();
  const elapsedSec = (processEnd - processStart) / 1000;
  const totalDone = (stats.completed || 0) + (stats.failed || 0);
  const jobsPerMinute = (totalDone / elapsedSec) * 60;

  console.log(`\n\n=== RESULTS ===`);
  console.log(`Jobs enqueued:       ${NUM_JOBS}`);
  console.log(`Jobs completed:      ${stats.completed || 0}`);
  console.log(`Jobs failed:         ${stats.failed || 0}`);
  console.log(`Processing time:     ${elapsedSec.toFixed(2)}s`);
  console.log(`Throughput:          ${jobsPerMinute.toFixed(1)} jobs/minute`);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
