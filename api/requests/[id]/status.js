import { supabase } from '../../_lib/supabase.js';
import { notifyTeacherStatusUpdate } from '../../_lib/emailService.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).end();
  }

  const { id } = req.query;
  const { status, managerNote, approverEmail } = req.body;

  let approvedBy = approverEmail || '';
  if (approverEmail) {
    const { data: fac } = await supabase
      .from('faculty')
      .select('full_name_th')
      .eq('email', approverEmail)
      .limit(1);
    if (fac?.[0]?.full_name_th) {
      approvedBy = fac[0].full_name_th;
    }
  }

  const { error } = await supabase
    .from('approvals')
    .update({ status, manager_note: managerNote, approved_by: approvedBy, updated_at: new Date() })
    .eq('request_id', id);

  if (error) return res.status(500).json({ success: false, error: error.message });

  notifyTeacherStatusUpdate(id, status, managerNote).catch(err =>
    console.error('Failed to send status email to teacher:', err.message)
  );

  res.json({ success: true, id, status, managerNote });
}
