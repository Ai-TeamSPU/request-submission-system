import express, { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../utils/approvalToken.js';
import { notifyTeacherStatusUpdate } from '../services/email.js';

const router = Router();

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
  <div class="icon">${color === '#16a34a' ? '✅' : color === '#dc2626' ? '❌' : '⚠️'}</div>
  <h2>${title}</h2>
  <p>${message}</p>
</div></body></html>`;
}

function renderRejectForm(requestId, token, request) {
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ปฏิเสธคำร้อง ${requestId}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 520px; width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  h2 { color: #dc2626; margin: 0 0 8px; font-size: 20px; }
  .info { color: #64748b; font-size: 14px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
  td { padding: 6px 8px; } td:first-child { color: #64748b; width: 120px; }
  label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
  textarea { width: 100%; min-height: 80px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 14px; font-family: inherit; resize: vertical; box-sizing: border-box; }
  .actions { display: flex; gap: 10px; margin-top: 16px; }
  button { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .btn-reject { background: #dc2626; color: #fff; } .btn-reject:hover { background: #b91c1c; }
  .btn-cancel { background: #e2e8f0; color: #475569; } .btn-cancel:hover { background: #cbd5e1; }
</style></head>
<body><div class="card">
  <h2>ปฏิเสธคำร้อง ${requestId}</h2>
  <p class="info">${request.teacher_name} — ${request.course_code} ${request.course_name}</p>
  <table>
    <tr><td>วันที่สอน</td><td>${request.date}</td></tr>
    <tr><td>เวลา</td><td>${request.time_range}</td></tr>
    <tr><td>ปัญหา</td><td>${request.problem_type}</td></tr>
  </table>
  <form method="POST">
    <input type="hidden" name="token" value="${token}">
    <label>หมายเหตุ (ถ้ามี)</label>
    <textarea name="managerNote" placeholder="ระบุเหตุผลที่ปฏิเสธ..."></textarea>
    <div class="actions">
      <button type="submit" class="btn-reject">ยืนยันปฏิเสธ</button>
    </div>
  </form>
</div></body></html>`;
}

async function checkAndUpdateStatus(requestId, status, managerNote) {
  const { data: current } = await supabase
    .from('approvals')
    .select('status')
    .eq('request_id', requestId)
    .single();

  if (!current) return { success: false, reason: 'ไม่พบคำร้องนี้ในระบบ' };
  if (current.status !== 'Pending') return { success: false, reason: `คำร้องนี้ดำเนินการแล้ว (สถานะ: ${current.status})` };

  const { error } = await supabase
    .from('approvals')
    .update({ status, manager_note: managerNote || '', updated_at: new Date() })
    .eq('request_id', requestId);

  if (error) return { success: false, reason: error.message };

  notifyTeacherStatusUpdate(requestId, status, managerNote).catch(err =>
    console.error('Failed to send status email:', err.message)
  );

  return { success: true };
}

router.get('/batch-approve', async (req, res) => {
  const { faculty, token } = req.query;

  if (!faculty || !token) {
    return res.send(renderHtml('ข้อมูลไม่ถูกต้อง', 'กรุณาระบุคณะและโทเค็นการอนุมัติ', '#f59e0b'));
  }

  const { valid, reason } = verifyToken(token, faculty, 'approve_all');
  if (!valid) {
    const msg = reason === 'expired' ? 'ลิงก์หมดอายุแล้ว กรุณาเข้าระบบเพื่อดำเนินการ' : 'ลิงก์ไม่ถูกต้อง';
    return res.send(renderHtml('ลิงก์ไม่สามารถใช้งานได้', msg, '#f59e0b'));
  }

  try {
    // 1. Find all requests for this faculty that have a pending approval
    const { data: pendingRequests, error: reqError } = await supabase
      .from('requests')
      .select('id')
      .eq('faculty', faculty);

    if (reqError) {
      console.error('Failed to query requests:', reqError.message);
      return res.send(renderHtml('เกิดข้อผิดพลาด', 'ไม่สามารถค้นหารายการคำร้องได้', '#dc2626'));
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return res.send(renderHtml('ไม่พบคำร้องที่ค้างอยู่', `ไม่พบคำร้องที่รอการอนุมัติสำหรับคณะ${faculty}`, '#f59e0b'));
    }

    const pendingIds = pendingRequests.map(r => r.id);

    // 2. Update approvals in approvals table where status is Pending
    const { data: updatedApprovals, error: appError } = await supabase
      .from('approvals')
      .update({ status: 'Approved', updated_at: new Date() })
      .in('request_id', pendingIds)
      .eq('status', 'Pending')
      .select('request_id');

    if (appError) {
      console.error('Failed to update approvals:', appError.message);
      return res.send(renderHtml('เกิดข้อผิดพลาด', 'ไม่สามารถอนุมัติคำร้องได้', '#dc2626'));
    }

    if (!updatedApprovals || updatedApprovals.length === 0) {
      return res.send(renderHtml('ไม่มีคำร้องที่รออนุมัติ', 'ไม่มีคำร้องคงค้างที่รอการอนุมัติสำหรับคณะนี้', '#f59e0b'));
    }

    // 3. Send email notifications to each teacher asynchronously
    for (const app of updatedApprovals) {
      notifyTeacherStatusUpdate(app.request_id, 'Approved', 'อนุมัติทั้งหมดผ่านอีเมลสรุปรายวัน').catch(err =>
        console.error(`Failed to send status email for ${app.request_id}:`, err.message)
      );
    }

    res.send(renderHtml('อนุมัติทั้งหมดสำเร็จ', `อนุมัติคำร้องของคณะ ${faculty} ทั้งหมดเรียบร้อยแล้ว (${updatedApprovals.length} รายการ)<br>ระบบได้ส่งอีเมลแจ้งอาจารย์ผู้ยื่นคำร้องทั้งหมดแล้ว`, '#16a34a'));
  } catch (err) {
    console.error('Error in batch approval:', err.message);
    res.send(renderHtml('เกิดข้อผิดพลาด', 'ระบบภายในเกิดข้อผิดพลาดในการอนุมัติ', '#dc2626'));
  }
});

router.get('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  const { valid, reason } = verifyToken(token, id, 'approve');
  if (!valid) {
    const msg = reason === 'expired' ? 'ลิงก์หมดอายุแล้ว กรุณาเข้าระบบเพื่อดำเนินการ' : 'ลิงก์ไม่ถูกต้อง';
    return res.send(renderHtml('ลิงก์ไม่สามารถใช้งานได้', msg, '#f59e0b'));
  }

  const result = await checkAndUpdateStatus(id, 'Approved', '');
  if (!result.success) {
    return res.send(renderHtml('ไม่สามารถอนุมัติได้', result.reason, '#f59e0b'));
  }

  res.send(renderHtml('อนุมัติสำเร็จ', `คำร้อง ${id} ได้รับการอนุมัติแล้ว<br>ระบบส่งแจ้งอาจารย์ผู้ยื่นคำร้องเรียบร้อย`, '#16a34a'));
});

router.get('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  const { valid, reason } = verifyToken(token, id, 'reject');
  if (!valid) {
    const msg = reason === 'expired' ? 'ลิงก์หมดอายุแล้ว กรุณาเข้าระบบเพื่อดำเนินการ' : 'ลิงก์ไม่ถูกต้อง';
    return res.send(renderHtml('ลิงก์ไม่สามารถใช้งานได้', msg, '#f59e0b'));
  }

  const { data: request } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single();

  if (!request) {
    return res.send(renderHtml('ไม่พบคำร้อง', `ไม่พบคำร้อง ${id} ในระบบ`, '#dc2626'));
  }

  const { data: approval } = await supabase
    .from('approvals')
    .select('status')
    .eq('request_id', id)
    .single();

  if (approval?.status !== 'Pending') {
    return res.send(renderHtml('ไม่สามารถปฏิเสธได้', `คำร้องนี้ดำเนินการแล้ว (สถานะ: ${approval?.status})`, '#f59e0b'));
  }

  res.send(renderRejectForm(id, token, request));
});

router.post('/:id/reject', express.urlencoded({ extended: false }), async (req, res) => {
  const { id } = req.params;
  const { token, managerNote } = req.body;

  const { valid, reason } = verifyToken(token, id, 'reject');
  if (!valid) {
    const msg = reason === 'expired' ? 'ลิงก์หมดอายุแล้ว กรุณาเข้าระบบเพื่อดำเนินการ' : 'ลิงก์ไม่ถูกต้อง';
    return res.send(renderHtml('ลิงก์ไม่สามารถใช้งานได้', msg, '#f59e0b'));
  }

  const result = await checkAndUpdateStatus(id, 'Rejected', managerNote || '');
  if (!result.success) {
    return res.send(renderHtml('ไม่สามารถปฏิเสธได้', result.reason, '#f59e0b'));
  }

  res.send(renderHtml('ปฏิเสธคำร้องแล้ว', `คำร้อง ${id} ถูกปฏิเสธแล้ว<br>ระบบส่งแจ้งอาจารย์ผู้ยื่นคำร้องเรียบร้อย`, '#dc2626'));
});

export default router;
