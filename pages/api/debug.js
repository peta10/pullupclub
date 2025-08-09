export default function handler(req, res) {
  return res.json({
    env: {
      hasPixelId: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
      hasToken: !!process.env.META_ACCESS_TOKEN,
      nodeEnv: process.env.NODE_ENV
    }
  });
} 