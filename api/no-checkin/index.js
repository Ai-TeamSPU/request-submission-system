import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('no_checkin_records')
      .select(`
        *,
        faculty (
          id,
          name_th,
          full_name_th,
          email,
          department_id,
          departments ( name_th )
        )
      `)
      .order('imported_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  res.setHeader('Allow', 'GET');
  res.status(405).end();
}
