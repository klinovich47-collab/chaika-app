export default async function handler(req, res) {
  try {
    const response = await fetch('https://vxebzzwquvgzpbktjigp.supabase.co/functions/v1/openai-moderation-healthcheck', { cache: 'no-store' });
    const data = await response.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ ok: false, status: null, error: 'proxy_failed' });
  }
}
