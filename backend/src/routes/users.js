import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('users_list')
    .select('*')
    .order('email', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const { data: facData } = await supabase
    .from('faculty')
    .select('position_clean_th, departments(name_th)')
    .eq('email', email)
    .limit(1);

  const position = facData?.[0]?.position_clean_th;
  const deptName = facData?.[0]?.departments?.name_th || null;

  const { data, error } = await supabase
    .from('users_list')
    .select('*')
    .eq('email', email);

  if (!error && data && data.length > 0) {
    const user = data[0];
    return res.json({ success: true, email: user.email, role: user.role, faculty: user.faculty });
  }

  const role = position === 'คณบดี' ? 'dean' : 'teacher';
  const faculty = position === 'คณบดี' ? deptName : null;

  res.json({ success: true, email, role, faculty });
});

const VALID_ROLES = ['teacher', 'dean', 'director', 'academic', 'admin'];

router.post('/', async (req, res) => {
  const { email, role, faculty } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const { data: existing } = await supabase
    .from('users_list')
    .select('email')
    .eq('email', email);

  if (existing && existing.length > 0) {
    return res.status(409).json({ success: false, error: 'อีเมลนี้มีอยู่ในระบบแล้ว' });
  }

  const { data, error } = await supabase
    .from('users_list')
    .insert({ email, role, faculty: faculty || null })
    .select('*');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, user: data[0] });
});

router.patch('/:email/role', async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const { faculty } = req.body;
  const updateData = { role };
  if (faculty !== undefined) {
    updateData.faculty = faculty;
  }

  const { error } = await supabase
    .from('users_list')
    .update(updateData)
    .eq('email', email);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, email, role, faculty });
});

export default router;
