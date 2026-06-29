import { sendTestEmail } from '../_lib/emailService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { to } = req.body;
  if (!to) return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });

  try {
    const result = await sendTestEmail(to);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
