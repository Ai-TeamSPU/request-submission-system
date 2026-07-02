import { transporter, senderAddress } from '../config/email.js';
import { supabase } from '../config/supabase.js';
import { generateToken } from '../utils/approvalToken.js';

const BASE_URL = process.env.APP_URL 
  ? process.env.APP_URL 
  : (process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://localhost:${process.env.PORT || 3001}`);

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

  if (error) {
    console.error('Failed to fetch dean email:', error.message);
    return [];
  }
  return data.map(u => u.email);
}

async function getRequestById(requestId) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    console.error('Failed to fetch request:', error.message);
    return null;
  }
  return data;
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1], base64: match[2] };
}

export async function notifyDeansNewRequest(request) {
  if (!transporter) return { sent: false, reason: 'Email not configured' };

  const faculty = request.faculty;
  const deanEmails = await getDeanEmailByFaculty(faculty);
  if (deanEmails.length === 0) return { sent: false, reason: `No dean found for faculty: ${faculty}` };

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

  const mailOptions = {
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to: deanEmails.join(', '),
    subject: `[RSMS] คำร้องใหม่รอการอนุมัติ - ${request.id} (${request.teacher_name})`,
    html: buildRequestSubmittedHtml(request, hasImage, hasAttachmentData),
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Notification sent to deans:', info.messageId);
  return { sent: true, messageId: info.messageId, recipients: deanEmails };
}

export async function notifyTeacherStatusUpdate(requestId, status, managerNote) {
  if (!transporter) return { sent: false, reason: 'Email not configured' };

  const request = await getRequestById(requestId);
  if (!request) return { sent: false, reason: 'Request not found' };

  const teacherEmail = request.email;
  if (!teacherEmail) return { sent: false, reason: 'No teacher email on request' };

  const isApproved = status === 'Approved';
  const statusText = isApproved ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ';

  const mailOptions = {
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to: teacherEmail,
    subject: `[RSMS] คำร้อง ${request.id} ${statusText}`,
    html: buildStatusUpdateHtml(request, status, managerNote),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Status notification sent to teacher:', info.messageId);
  return { sent: true, messageId: info.messageId, recipient: teacherEmail };
}

export async function sendTestEmail(to) {
  if (!transporter) throw new Error('Email not configured — check SMTP env vars');

  const mailOptions = {
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to,
    subject: '[RSMS] ทดสอบการส่งอีเมล',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 8px; color: #16a34a;">ส่งอีเมลสำเร็จ!</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px;">ระบบ RSMS สามารถส่งอีเมลแจ้งเตือนได้ปกติ</p>
      </div>`,
  };

  const info = await transporter.sendMail(mailOptions);
  return { sent: true, messageId: info.messageId };
}

function buildDailyDigestHtml(faculty, requests) {
  const dashboardUrl = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN
    : (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:5173');

  const approveAllToken = generateToken(faculty, 'approve_all');
  const approveAllUrl = `${BASE_URL}/api/approval/batch-approve?faculty=${encodeURIComponent(faculty)}&token=${approveAllToken}`;

  let rowsHtml = '';
  requests.forEach(req => {
    const approveToken = generateToken(req.id, 'approve');
    const rejectToken = generateToken(req.id, 'reject');
    const approveUrl = `${BASE_URL}/api/approval/${req.id}/approve?token=${approveToken}`;
    const rejectUrl = `${BASE_URL}/api/approval/${req.id}/reject?token=${rejectToken}`;
    
    rowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-weight: 600; color: #1e3a8a;">${req.id}</td>
        <td style="padding: 12px 8px;">${req.teacher_name}</td>
        <td style="padding: 12px 8px;">${req.course_code} - ${req.course_name} (กลุ่ม ${req.section})</td>
        <td style="padding: 12px 8px;">${req.date}<br><span style="font-size: 12px; color: #64748b;">${req.time_range}</span></td>
        <td style="padding: 12px 8px;">${req.problem_type}</td>
        <td style="padding: 12px 8px; font-size: 13px; color: #475569;">${req.reason || '-'}</td>
        <td style="padding: 12px 8px; text-align: center; white-space: nowrap;">
          <a href="${approveUrl}" style="display: inline-block; padding: 6px 12px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; margin-right: 4px;">อนุมัติ</a>
          <a href="${rejectUrl}" style="display: inline-block; padding: 6px 12px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">ปฏิเสธ</a>
        </td>
      </tr>
    `;
  });

  return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 850px; margin: 0 auto;">
      <div style="background: #1e40af; color: #fff; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">RSMS - รายงานสรุปคำร้องใหม่รอการอนุมัติ</h2>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">คณะ${faculty} · ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}</p>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; overflow-x: auto;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">เรียน คณบดีคณะ${faculty}, มีคำร้องขอเช็คอินย้อนหลังจากผู้สอนรอการพิจารณาดังต่อไปนี้:</p>
        
        <!-- Batch Approval Section -->
        <div style="margin-bottom: 20px; padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle;">
                <h4 style="margin: 0 0 4px; color: #065f46; font-size: 15px; font-weight: bold;">ต้องการอนุมัติคำร้องทั้งหมดของคณะในคราวเดียว?</h4>
                <p style="margin: 0; color: #047857; font-size: 13px;">สามารถกดปุ่มขวาเพื่ออนุมัติคำร้องทั้ง ${requests.length} รายการนี้ได้ทันทีโดยไม่ต้องกดทีละราย</p>
              </td>
              <td style="text-align: right; vertical-align: middle; width: 200px;">
                <a href="${approveAllUrl}" style="display: inline-block; padding: 10px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">✅ อนุมัติทั้งหมด (${requests.length} รายการ)</a>
              </td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; background: #fff; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px 8px; color: #475569; font-weight: 600;">รหัสคำร้อง</th>
              <th style="padding: 12px 8px; color: #475569; font-weight: 600;">ผู้สอน</th>
              <th style="padding: 12px 8px; color: #475569; font-weight: 600;">วิชา</th>
              <th style="padding: 12px 8px; color: #475569; font-weight: 600;">วันที่/เวลา</th>
              <th style="padding: 12px 8px; color: #475569; font-weight: 600;">ประเภทปัญหา</th>
              <th style="padding: 12px 8px; color: #475569; font-weight: 600;">เหตุผล</th>
              <th style="padding: 12px 8px; color: #475569; font-weight: 600; text-align: center;">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">เข้าสู่ระบบ RSMS เพื่อดูรายละเอียดทั้งหมด</a>
        </div>
      </div>
    </div>
  `;
}

export async function notifyDeansDailyDigest(faculty, requests) {
  if (!transporter) return { sent: false, reason: 'Email not configured' };

  const deanEmails = await getDeanEmailByFaculty(faculty);
  if (deanEmails.length === 0) return { sent: false, reason: `No dean found for faculty: ${faculty}` };

  const digestHtml = buildDailyDigestHtml(faculty, requests);

  const mailOptions = {
    from: `"RSMS ระบบคำร้องเช็คอิน" <${senderAddress}>`,
    to: deanEmails.join(', '),
    subject: `[RSMS] สรุปคำร้องขอเช็คอินย้อนหลังรอพิจารณา - คณะ${faculty}`,
    html: digestHtml,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Daily digest sent to deans of ${faculty}:`, info.messageId);
  return { sent: true, messageId: info.messageId, recipients: deanEmails };
}
