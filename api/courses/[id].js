import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { courseCode } = req.body;
    if (!courseCode || !String(courseCode).trim()) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสวิชา' });
    }

    const code = String(courseCode).trim();
    const { error } = await supabase
      .from('courses')
      .update({ course_code: code, course_name: code })
      .eq('id', Number(id));

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', Number(id));

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
}
