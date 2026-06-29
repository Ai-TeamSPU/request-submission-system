import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { courseCode } = req.body;
  if (!courseCode || !String(courseCode).trim()) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสวิชา' });
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({ course_code: String(courseCode).trim(), course_name: String(courseCode).trim() })
    .select('*');

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, course: data[0] });
}
