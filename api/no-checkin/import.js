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

  let allFaculty = [];
  let start = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('faculty')
      .select('id, email, name_th, full_name_th')
      .range(start, start + limit - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allFaculty = allFaculty.concat(data);
      if (data.length < limit) {
        hasMore = false;
      } else {
        start += limit;
      }
    }
  }

  const emailMap = {};
  const nameMap = {};
  if (allFaculty) {
    allFaculty.forEach(f => {
      const info = { id: f.id, email: f.email || '' };
      if (f.email) emailMap[f.email.toLowerCase()] = info;
      if (f.name_th) nameMap[f.name_th.trim()] = info;
    });
  }

  const findFacultyInfo = (teacherName, email) => {
    if (email) {
      const byEmail = emailMap[email.trim().toLowerCase()];
      if (byEmail) return byEmail;
    }
    const name = (teacherName || '').trim();
    if (name) {
      if (nameMap[name]) return nameMap[name];
    }
    return { id: null, email: email || '' };
  };

  const rows = records.map(r => {
    const info = findFacultyInfo(r.teacherName, r.email);
    return {
      teacher_name: r.teacherName || '',
      email: info.email || r.email || '',
      faculty: r.faculty || '',
      course_code: r.courseCode || '',
      section: r.section || '',
      time_range: r.timeRange || '',
      faculty_id: info.id,
      date: r.date || null,
    };
  });

  const { error } = await supabase
    .from('no_checkin_records')
    .insert(rows);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const matched = rows.filter(r => r.faculty_id !== null).length;
  res.json({ success: true, imported: rows.length, matched });
}
