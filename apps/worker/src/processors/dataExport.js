// apps/worker/src/processors/dataExport.js
export async function process(payload) {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const { format = 'csv', filters = {} } = payload;

  if (!['csv', 'json'].includes(format)) {
    throw new Error('Unsupported export format. Use csv or json.');
  }

  const rowCount = 150 + Math.floor(Math.random() * 850);
  const fileSize = format === 'csv'
    ? Math.floor(rowCount * 0.12)
    : Math.floor(rowCount * 0.25);

  return {
    format,
    rowCount,
    fileSize,
    downloadUrl: `/exports/export_${Date.now()}.${format}`,
  };
}