import { supabase } from '../_lib/supabase.js';
import { toCamelCase, toSnakeCase } from '../_lib/fieldMapper.js';
import { notifyDeansNewRequest } from '../_lib/emailService.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        id, email, teacher_name, faculty, department, course_code, course_name,
        section, date, time_range, classroom, problem_type, reason,
        attachment_name, submitted_date,
        approvals (
          status,
          manager_note,
          approved_by
        )
      `)
      .order('submitted_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data.map(toCamelCase));
  }

  if (req.method === 'POST') {
    const { attachmentData, ...body } = req.body;
    const newRequest = {
      id: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
      ...toSnakeCase(body),
      attachment_name: body.attachmentName || '',
      attachment_data: attachmentData || null,
    };

    const { error } = await supabase.from('requests').insert(newRequest);

    if (error) return res.status(500).json({ success: false, error: error.message });

    notifyDeansNewRequest(newRequest).catch(err =>
      console.error('Failed to send email to deans:', err.message)
    );

    return res.json({ success: true, requestId: newRequest.id });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
