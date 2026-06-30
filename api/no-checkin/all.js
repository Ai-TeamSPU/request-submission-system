import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).end();
  }

  const { error } = await supabase
    .from('no_checkin_records')
    .delete()
    .neq('id', 0);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
}
