// apps/worker/src/processors/webhook.js
export async function process(payload) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const { url, method = 'POST', headers = {}, body = {} } = payload;

  if (!url) {
    throw new Error('Missing required field: url');
  }

  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL provided');
  }

  const statusCode = 200;
  const responseTime = 45 + Math.floor(Math.random() * 200);

  return {
    url,
    method,
    statusCode,
    responseTime,
    responseBody: { success: true },
  };
}