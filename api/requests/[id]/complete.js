import { supabase } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).end();
  }

  const { id } = req.query;
  const { error } = await supabase
    .from('approvals')
    .update({ status: 'Completed', updated_at: new Date() })
    .eq('request_id', id)
    .eq('status', 'Approved');

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, id, status: 'Completed' });
}
