import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { courses } = req.body;
  if (!Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ success: false, error: 'No course data provided' });
  }

  const rows = courses.map(c => ({
    course_code: String(c.courseCode || '').trim(),
    course_name: String(c.courseName || c.courseCode || '').trim(),
  })).filter(r => r.course_code);

  if (rows.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid rows' });
  }

  const { error } = await supabase.from('courses').insert(rows);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, imported: rows.length });
}
