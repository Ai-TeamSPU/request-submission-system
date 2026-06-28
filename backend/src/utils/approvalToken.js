import crypto from 'crypto';

const SECRET = process.env.SUPABASE_SERVICE_KEY || 'fallback-secret';
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateToken(requestId, action) {
  const expiry = Date.now() + TOKEN_TTL;
  const payload = `${requestId}:${action}:${expiry}`;
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export function verifyToken(token, requestId, action) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false, reason: 'invalid' };
    const [tokenReqId, tokenAction, expiry, hmac] = parts;
    if (tokenReqId !== requestId || tokenAction !== action) return { valid: false, reason: 'mismatch' };
    if (Date.now() > Number(expiry)) return { valid: false, reason: 'expired' };
    const expected = crypto.createHmac('sha256', SECRET)
      .update(`${tokenReqId}:${tokenAction}:${expiry}`)
      .digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
    return { valid: isValid, reason: isValid ? 'ok' : 'invalid' };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}
