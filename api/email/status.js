import { transporter } from '../_lib/email.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  res.json({
    configured: transporter !== null,
    provider: process.env.SMTP_PROVIDER || 'custom',
  });
}
