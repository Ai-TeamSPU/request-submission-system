import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

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
}
