import { transporter, senderAddress } from './email.js';
import { supabase } from './supabase.js';
import { generateToken } from './approvalToken.js';

const BASE_URL = process.env.APP_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${process.env.PORT || 3001}`;

function buildRequestSubmittedHtml(request, hasImage, hasAttachment) {
  const approveToken = generateToken(request.id, 'approve');
  const rejectToken = generateToken(request.id, 'reject');
  const approveUrl = `${BASE_URL}/api/approval/${request.id}/approve?token=${approveToken}`;
  const rejectUrl = `${BASE_URL}/api/approval/${request.id}/reject?token=${rejectToken}`;

  let attachmentSection = '';
  if (hasImage) {
    attachmentSection = `
        <div style="margin-top: 16px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600;">หลักฐานประกอบ:</p>
          <img src="cid:evidence" style="max-width: 100%; border-radius: 6px; border: 1px solid #e2e8f0;" />
        </div>`;
  } else if (hasAttachment) {
    attachmentSection = `
        <div style="margin-top: 16px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600;">หลักฐานประกอบ:</p>
          <p style="margin: 0; font-size: 13px; color: #334155;">ไฟล์แนบ: ${request.attachment_name} (ดูไฟล์แนบในอีเมลนี้)</p>
        </div>`;
  }

  return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">RSMS - คำร้องขอเช็คอินย้อนหลังใหม่</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px;">มีคำร้องใหม่รอการพิจารณาอนุมัติ</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px; color: #64748b; width: 140px;">รหัสคำร้อง</td><td style="padding: 8px; font-weight: 600;">${request.id}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #64748b;">ชื่อผู้สอน</td><td style="padding: 8px;">${request.teacher_name}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">คณะ</td><td style="padding: 8px;">${request.faculty}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #64748b;">รหัสวิชา</td><td style="padding: 8px;">${request.course_code}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">วันที่สอน</td><td style="padding: 8px;">${request.date}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #64748b;">เวลา</td><td style="padding: 8px;">${request.time_range}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">ประเภทปัญหา</td><td style="padding: 8px;">${request.problem_type}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #64748b;">เหตุผล</td><td style="padding: 8px;">${request.reason}</td></tr>
        </table>${attachmentSection}
        <div style="margin-top: 24px; text-align: center;">
          <a href="${approveUrl}" style="display: inline-block; padding: 14px 36px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; margin-right: 12px;">อนุมัติ</a>
          <a href="${rejectUrl}" style="display: inline-block; padding: 14px 36px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">ปฏิเสธ</a>
        </div>
        <p style="margin: 16px 0 0; text-align: center; font-size: 12px; color: #94a3b8;">หรือเข้าสู่ระบบ RSMS เพื่อดำเนินการ · ลิงก์มีอายุ 7 วัน</p>
      </div>
    </div>`;
}

function buildStatusUpdateHtml(request, status, managerNote) {
  const isApproved = status === 'Approved';
  const statusColor = isApproved ? '#16a34a' : '#dc2626';
  const statusText = isApproved ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ';
  const statusBg = isApproved ? '#f0fdf4' : '#fef2f2';
  const statusBorder = isApproved ? '#86efac' : '#fca5a5';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${statusColor}; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">RSMS - ผลการพิจารณาคำร้อง ${request.id}</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="margin-bottom: 16px; padding: 12px 16px; background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 6px; text-align: center;">
          <span style="font-size: 16px; font-weight: 700; color: ${statusColor};">สถานะ: ${statusText}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px; color: #64748b; width: 140px;">รหัสคำร้อง</td><td style="padding: 8px; font-weight: 600;">${request.id}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #64748b;">รหัสวิชา</td><td style="padding: 8px;">${request.course_code}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">วันที่สอน</td><td style="padding: 8px;">${request.date}</td></tr>
        </table>
        ${managerNote ? `
        <div style="margin-top: 16px; padding: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #64748b;">หมายเหตุจากผู้พิจารณา:</p>
          <p style="margin: 0; font-size: 14px;">${managerNote}</p>
        </div>` : ''}
      </div>
    </div>`;
}

async function getDeanEmailByFaculty(faculty) {
  const { data, error } = await supabase
    .from('users_list')
    .select('email')
    .eq('role', 'dean')
    .eq('faculty', faculty);

  if (error) return [];
  return data.map(u => u.email);
}

async function getRequestById(requestId) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) return null;
  return data;
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1], base64: match[2] };
}

export async function notifyDeansNewRequest(request) {
  if (!transporter) return { sent: false, reason: 'Email not configured' };

  const deanEmails = await getDeanEmailByFaculty(request.faculty);
  if (deanEmails.length === 0) return { sent: false, reason: `No dean found for faculty: ${request.faculty}` };

  const hasAttachmentData = request.attachment_data && request.attachment_data.startsWith('data:');
  const hasImage = hasAttachmentData && request.attachment_data.startsWith('data:image');
  const attachments = [];

  if (hasAttachmentData) {
    const parsed = parseDataUrl(request.attachment_data);
    if (parsed) {
      const ext = parsed.contentType.split('/')[1] || 'bin';
      const attachment = {
        filename: request.attachment_name || `attachment.${ext}`,
        content: parsed.base64,
        encoding: 'base64',
        contentType: parsed.contentType,
      };
      if (hasImage) attachment.cid = 'evidence';
      attachments.push(attachment);
    }
  }

  const info = await transporter.sendMail({
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to: deanEmails.join(', '),
    subject: `[RSMS] คำร้องใหม่รอการอนุมัติ - ${request.id} (${request.teacher_name})`,
    html: buildRequestSubmittedHtml(request, hasImage, hasAttachmentData),
    attachments,
  });

  return { sent: true, messageId: info.messageId, recipients: deanEmails };
}

export async function notifyTeacherStatusUpdate(requestId, status, managerNote) {
  if (!transporter) return { sent: false, reason: 'Email not configured' };

  const request = await getRequestById(requestId);
  if (!request) return { sent: false, reason: 'Request not found' };
  if (!request.email) return { sent: false, reason: 'No teacher email on request' };

  const isApproved = status === 'Approved';
  const statusText = isApproved ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ';

  const info = await transporter.sendMail({
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to: request.email,
    subject: `[RSMS] คำร้อง ${request.id} ${statusText}`,
    html: buildStatusUpdateHtml(request, status, managerNote),
  });

  return { sent: true, messageId: info.messageId, recipient: request.email };
}

export async function sendTestEmail(to) {
  if (!transporter) throw new Error('Email not configured — check SMTP env vars');

  const info = await transporter.sendMail({
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to,
    subject: '[RSMS] ทดสอบการส่งอีเมล',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 8px; color: #16a34a;">ส่งอีเมลสำเร็จ!</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px;">ระบบ RSMS สามารถส่งอีเมลแจ้งเตือนได้ปกติ</p>
      </div>`,
  });

  return { sent: true, messageId: info.messageId };
}
