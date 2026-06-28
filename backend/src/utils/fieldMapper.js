const REQUEST_FIELD_MAP = {
  teacherName: 'teacher_name',
  courseCode: 'course_code',
  courseName: 'course_name',
  timeRange: 'time_range',
  problemType: 'problem_type',
  attachmentName: 'attachment_name',
};

const REVERSE_FIELD_MAP = Object.fromEntries(
  Object.entries(REQUEST_FIELD_MAP).map(([camel, snake]) => [snake, camel])
);

const PASS_THROUGH_FIELDS = ['id', 'email', 'faculty', 'department', 'section', 'date', 'classroom', 'reason'];

export function toSnakeCase(body) {
  const result = {};
  for (const field of PASS_THROUGH_FIELDS) {
    if (body[field] !== undefined) result[field] = body[field];
  }
  for (const [camel, snake] of Object.entries(REQUEST_FIELD_MAP)) {
    if (body[camel] !== undefined) result[snake] = body[camel];
  }
  return result;
}

export function toCamelCase(row) {
  return {
    id: row.id,
    email: row.email,
    faculty: row.faculty,
    department: row.department,
    section: row.section,
    date: row.date,
    classroom: row.classroom,
    reason: row.reason,
    ...Object.fromEntries(
      Object.entries(REVERSE_FIELD_MAP)
        .filter(([snake]) => row[snake] !== undefined)
        .map(([snake, camel]) => [camel, row[snake]])
    ),
    status: row.approvals?.status || 'Pending',
    managerNote: row.approvals?.manager_note || '',
    approvedBy: row.approvals?.approved_by || '',
    submittedDate: new Date(row.submitted_date).toLocaleString('th-TH'),
  };
}
