import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('no_checkin_records')
    .select(`
      *,
      faculty (
        id,
        name_th,
        full_name_th,
        email,
        department_id,
        departments ( name_th )
      )
    `)
    .order('imported_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/import', async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: 'records must be a non-empty array' });
  }

  const { data: allFaculty } = await supabase
    .from('faculty')
    .select('id, email, name_th, full_name_th');

  const emailMap = {};
  const fullNameMap = {};
  const nameMap = {};
  if (allFaculty) {
    allFaculty.forEach(f => {
      if (f.email) emailMap[f.email.toLowerCase()] = f.id;
      if (f.full_name_th) fullNameMap[f.full_name_th.trim()] = f.id;
      if (f.name_th) nameMap[f.name_th.trim()] = f.id;
    });
  }

  const findFacultyId = (teacherName, email) => {
    if (email) {
      const byEmail = emailMap[email.trim().toLowerCase()];
      if (byEmail) return byEmail;
    }
    const name = (teacherName || '').trim();
    if (name) {
      if (fullNameMap[name]) return fullNameMap[name];
      if (nameMap[name]) return nameMap[name];
    }
    return null;
  };

  const rows = records.map(r => ({
    teacher_name: r.teacherName || '',
    email: r.email || '',
    faculty: r.faculty || '',
    course_code: r.courseCode || '',
    section: r.section || '',
    time_range: r.timeRange || '',
    faculty_id: findFacultyId(r.teacherName, r.email),
  }));

  const { error } = await supabase
    .from('no_checkin_records')
    .insert(rows);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const matched = rows.filter(r => r.faculty_id !== null).length;
  res.json({ success: true, imported: rows.length, matched });
});

router.delete('/all', async (req, res) => {
  const { error } = await supabase
    .from('no_checkin_records')
    .delete()
    .neq('id', 0);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('no_checkin_records')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

export default router;
