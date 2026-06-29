import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

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
}
