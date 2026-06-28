import { Router } from 'express';
import { transporter } from '../config/email.js';
import { sendTestEmail } from '../services/email.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    configured: transporter !== null,
    provider: process.env.SMTP_PROVIDER || 'custom',
  });
});

router.post('/test', async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
  }

  try {
    const result = await sendTestEmail(to);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
