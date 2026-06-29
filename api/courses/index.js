import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { data, error } = await supabase
    .from('courses')
    .select('id, course_code, course_name, section, faculty')
    .order('course_code', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
