import { supabase } from '../_lib/supabase.js';

const VALID_ROLES = ['teacher', 'dean', 'director', 'group_director', 'academic', 'admin'];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users_list')
      .select('*')
      .order('email', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { email, role, faculty } = req.body;

    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
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

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, user: data[0] });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
