import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, course_code, course_name, section, faculty')
    .order('course_code', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.post('/import', async (req, res) => {
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

  const { error } = await supabase
    .from('courses')
    .insert(rows);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, imported: rows.length });
});

router.post('/add', async (req, res) => {
  const { courseCode } = req.body;
  if (!courseCode || !String(courseCode).trim()) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสวิชา' });
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({ course_code: String(courseCode).trim(), course_name: String(courseCode).trim() })
    .select('*');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, course: data[0] });
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { courseCode } = req.body;
  if (!courseCode || !String(courseCode).trim()) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสวิชา' });
  }

  const code = String(courseCode).trim();
  const { error } = await supabase
    .from('courses')
    .update({ course_code: code, course_name: code })
    .eq('id', Number(id));

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', Number(id));

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true });
});

router.delete('/all', async (req, res) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .neq('id', 0);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true });
});

export default router;
