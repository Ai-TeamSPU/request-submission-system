import { supabase } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { email } = req.query;
  const { data, error } = await supabase
    .from('faculty')
    .select('full_name_th, name_th, academic_title, departments(name_th, category), employment_types(label_th)')
    .eq('email', email)
    .limit(1);

  if (error || !data || data.length === 0) {
    return res.json({ found: false });
  }

  const fac = data[0];
  res.json({
    found: true,
    teacherName: fac.full_name_th,
    department: fac.departments?.name_th || '',
  });
}
