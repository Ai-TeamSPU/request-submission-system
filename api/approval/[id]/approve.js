import { supabase } from '../../_lib/supabase.js';
import { verifyToken } from '../../_lib/approvalToken.js';
import { notifyTeacherStatusUpdate } from '../../_lib/emailService.js';

function renderHtml(title, message, color) {
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h2 { color: ${color}; margin: 0 0 12px; }
  p { color: #64748b; margin: 0; font-size: 15px; line-height: 1.6; }
</style></head>
<body><div class="card">
  <div class="icon">${color === '#16a34a' ? '✅' : '⚠️'}</div>
  <h2>${title}</h2>
  <p>${message}</p>
</div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { id, token } = req.query;

  const { valid, reason } = verifyToken(token, id, 'approve');
  if (!valid) {
    const msg = reason === 'expired' ? 'ลิงก์หมดอายุแล้ว กรุณาเข้าระบบเพื่อดำเนินการ' : 'ลิงก์ไม่ถูกต้อง';
    return res.send(renderHtml('ลิงก์ไม่สามารถใช้งานได้', msg, '#f59e0b'));
  }

  const { data: current } = await supabase
    .from('approvals')
    .select('status')
    .eq('request_id', id)
    .single();

  if (!current) {
    return res.send(renderHtml('ไม่สามารถอนุมัติได้', 'ไม่พบคำร้องนี้ในระบบ', '#f59e0b'));
  }
  if (current.status !== 'Pending') {
    return res.send(renderHtml('ไม่สามารถอนุมัติได้', `คำร้องนี้ดำเนินการแล้ว (สถานะ: ${current.status})`, '#f59e0b'));
  }

  const { error } = await supabase
    .from('approvals')
    .update({ status: 'Approved', manager_note: '', updated_at: new Date() })
    .eq('request_id', id);

  if (error) {
    return res.send(renderHtml('ไม่สามารถอนุมัติได้', error.message, '#f59e0b'));
  }

  notifyTeacherStatusUpdate(id, 'Approved', '').catch(err =>
    console.error('Failed to send status email:', err.message)
  );

  res.send(renderHtml('อนุมัติสำเร็จ', `คำร้อง ${id} ได้รับการอนุมัติแล้ว<br>ระบบส่งแจ้งอาจารย์ผู้ยื่นคำร้องเรียบร้อย`, '#16a34a'));
}
