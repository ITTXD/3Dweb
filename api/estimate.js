import { calculateEstimate } from '../lib/pricing.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { volume, settings } = req.body ?? {};
  const result = calculateEstimate(volume, settings);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json(result);
}
