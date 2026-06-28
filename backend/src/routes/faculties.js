import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

const DEFAULT_FACULTIES = [
  'คณะวิทยาศาสตร์',
  'คณะครุศาสตร์',
  'คณะวิศวกรรมศาสตร์',
  'คณะบริหารธุรกิจ',
  'คณะมนุษยศาสตร์และสังคมศาสตร์',
  'วิทยาลัยนานาชาติ'
];

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('departments')
    .select('name_th')
    .eq('category', 'academic')
    .order('name_th', { ascending: true });

  if (error || !data || data.length === 0) {
    return res.json(DEFAULT_FACULTIES);
  }

  res.json(data.map(item => item.name_th));
});

router.get('/teachers', async (req, res) => {
  const { data, error } = await supabase
    .from('faculty')
    .select('full_name_th, email')
    .order('full_name_th', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

router.get('/by-email/:email', async (req, res) => {
  const { email } = req.params;

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
});

export default router;
