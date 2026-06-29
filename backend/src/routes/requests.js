import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { notifyDeansNewRequest, notifyTeacherStatusUpdate } from '../services/email.js';
import { toSnakeCase, toCamelCase } from '../utils/fieldMapper.js';

const router = Router();

router.get('/', async (req, res) => {
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

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data.map(toCamelCase));
});

router.get('/:id/attachment', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('requests')
    .select('attachment_name, attachment_data')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ attachmentName: data.attachment_name, attachmentData: data.attachment_data });
});

router.post('/', async (req, res) => {
  const { attachmentData, ...body } = req.body;
  const newRequest = {
    id: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
    ...toSnakeCase(body),
    attachment_name: body.attachmentName || '',
    attachment_data: attachmentData || null,
  };

  const { error } = await supabase
    .from('requests')
    .insert(newRequest);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  notifyDeansNewRequest(newRequest).catch(err =>
    console.error('Failed to send email to deans:', err.message)
  );

  res.json({ success: true, requestId: newRequest.id });
});

router.patch('/batch-status', async (req, res) => {
  const { ids, status, managerNote, approverEmail } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids must be a non-empty array' });
  }

  if (!status || !managerNote) {
    return res.status(400).json({ success: false, error: 'status and managerNote are required' });
  }

  let approvedBy = approverEmail || '';
  if (approverEmail) {
    const { data: fac } = await supabase
      .from('faculty')
      .select('full_name_th')
      .eq('email', approverEmail)
      .limit(1);
    if (fac?.[0]?.full_name_th) {
      approvedBy = fac[0].full_name_th;
    }
  }

  const { error } = await supabase
    .from('approvals')
    .update({ status, manager_note: managerNote, approved_by: approvedBy, updated_at: new Date() })
    .in('request_id', ids);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  for (const id of ids) {
    notifyTeacherStatusUpdate(id, status, managerNote).catch(err =>
      console.error(`Failed to send status email for ${id}:`, err.message)
    );
  }

  res.json({ success: true, count: ids.length });
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, managerNote, approverEmail } = req.body;

  let approvedBy = approverEmail || '';
  if (approverEmail) {
    const { data: fac } = await supabase
      .from('faculty')
      .select('full_name_th')
      .eq('email', approverEmail)
      .limit(1);
    if (fac?.[0]?.full_name_th) {
      approvedBy = fac[0].full_name_th;
    }
  }

  const { error } = await supabase
    .from('approvals')
    .update({ status, manager_note: managerNote, approved_by: approvedBy, updated_at: new Date() })
    .eq('request_id', id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  notifyTeacherStatusUpdate(id, status, managerNote).catch(err =>
    console.error('Failed to send status email to teacher:', err.message)
  );

  res.json({ success: true, id, status, managerNote });
});

router.patch('/:id/complete', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('approvals')
    .update({ status: 'Completed', updated_at: new Date() })
    .eq('request_id', id)
    .eq('status', 'Approved');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, id, status: 'Completed' });
});

export default router;
