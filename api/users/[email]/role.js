import { supabase } from '../../_lib/supabase.js';

const VALID_ROLES = ['teacher', 'dean', 'director', 'group_director', 'academic', 'admin'];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).end();
  }

  const { email } = req.query;
  const { role, faculty } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const updateData = { role };
  if (faculty !== undefined) updateData.faculty = faculty;

  const { error } = await supabase
    .from('users_list')
    .update(updateData)
    .eq('email', email);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, email, role, faculty });
}
