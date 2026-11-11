// apps/worker/src/processors/email.js
export async function process(payload) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const { to, subject, body } = payload;

  if (!to || !subject) {
    throw new Error('Missing required fields: to, subject');
  }

  return {
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    to,
    subject,
    status: 'sent',
  };
}