import { supabase } from '../_lib/supabase.js';
import { notifyTeacherStatusUpdate } from '../_lib/emailService.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).end();
  }

  const { ids, status, managerNote, approverEmail } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids must be a non-empty array' });
  }

  if (!status || !managerNote) {
    return res.status(400).json({ success: false, error: 'status and managerNote are required' });
  }

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
    .in('request_id', ids);

  if (error) return res.status(500).json({ success: false, error: error.message });

  for (const id of ids) {
    notifyTeacherStatusUpdate(id, status, managerNote).catch(err =>
      console.error(`Failed to send status email for ${id}:`, err.message)
    );
  }

  res.json({ success: true, count: ids.length });
}
