// apps/worker/src/processors/imageResize.js
export async function process(payload) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { width = 800, height = 600, format = 'webp' } = payload;

  if (width < 1 || height < 1 || width > 10000 || height > 10000) {
    throw new Error('Invalid dimensions. Must be between 1 and 10000.');
  }

  return {
    originalSize: { width: 1920, height: 1080 },
    newSize: { width, height },
    format,
    fileSize: Math.floor((width * height) / 1000),
  };
}