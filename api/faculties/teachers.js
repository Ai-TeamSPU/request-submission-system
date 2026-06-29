import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { data, error } = await supabase
    .from('faculty')
    .select('full_name_th, email')
    .order('full_name_th', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}
