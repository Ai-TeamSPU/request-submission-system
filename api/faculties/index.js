import { supabase } from '../_lib/supabase.js';

const DEFAULT_FACULTIES = [
  'คณะวิทยาศาสตร์',
  'คณะครุศาสตร์',
  'คณะวิศวกรรมศาสตร์',
  'คณะบริหารธุรกิจ',
  'คณะมนุษยศาสตร์และสังคมศาสตร์',
  'วิทยาลัยนานาชาติ'
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { data, error } = await supabase
    .from('departments')
    .select('name_th')
    .eq('category', 'academic')
    .order('name_th', { ascending: true });

  if (error || !data || data.length === 0) {
    return res.json(DEFAULT_FACULTIES);
  }

  res.json(data.map(item => item.name_th));
}
