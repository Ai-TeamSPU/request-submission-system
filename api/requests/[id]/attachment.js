import { supabase } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { id } = req.query;
  const { data, error } = await supabase
    .from('requests')
    .select('attachment_name, attachment_data')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ attachmentName: data.attachment_name, attachmentData: data.attachment_data });
}
