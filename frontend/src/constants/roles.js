export const VALID_ROLES = ['teacher', 'dean', 'director', 'academic', 'admin'];

export const ROLE_LABELS = {
  teacher: 'อาจารย์ (ผู้สอน)',
  dean: 'คณบดี',
  director: 'ผอ.สำนักงานวิชาการ',
  academic: 'วิชาการ',
  admin: 'ผู้ดูแลระบบ (Admin)',
};

export const ROLE_LABELS_FULL = {
  teacher: '🧑‍🏫 อาจารย์',
  dean: '🏛️ คณบดี / ผอ.สำนักงานวิชาการ',
  director: 'ผอ.สำนักงานวิชาการ / ผอ.กลุ่มงาน',
  academic: '🎓 วิชาการ',
  admin: '🔑 ผู้ดูแลระบบ (Admin)',
};

export const MENU_PERMISSIONS = {
  'checkin': ['teacher', 'dean', 'admin'],
  'my-requests': ['teacher', 'dean', 'admin'],
  'checkin-list': ['teacher', 'dean', 'admin'],
  'pending-approvals': ['dean', 'admin'],
  'approved-history': ['dean', 'admin'],
  'approved-requests': ['director', 'academic', 'admin'],
  'email-alerts': ['admin'],
  'overview': ['director', 'academic', 'admin'],
  'import-excel': ['admin'],
  'import-no-checkin': ['admin'],
  'master-data': ['admin'],
  'system-logs': ['admin'],
};

export const PAGE_TITLES = {
  'checkin': 'เช็คอิน / ยื่นคำร้อง',
  'my-requests': 'คำขออนุมัติของฉัน',
  'checkin-list': 'รายชื่ออาจารย์ที่ไม่เช็คอิน',
  'pending-approvals': 'คำขอที่รอการอนุมัติ',
  'approved-history': 'ประวัติคำขอที่พิจารณาแล้ว',
  'approved-requests': 'คำขอที่ได้รับการอนุมัติแล้ว',
  'email-alerts': 'ตั้งค่าอีเมลแจ้งเตือน',
  'overview': 'ภาพรวมสถิติระบบ',
  'import-excel': 'นำเข้าข้อมูลด้วย Excel',
  'import-no-checkin': 'นำเข้า Excel อาจารย์ที่ไม่เช็คอิน',
  'master-data': 'การจัดการข้อมูลหลัก',
  'system-logs': 'บันทึกการทำงานของระบบ',
};

export const INITIAL_MENU_BY_ROLE = {
  dean: 'pending-approvals',
  director: 'approved-requests',
  academic: 'approved-requests',
  admin: 'overview',
};

export function isMenuAllowedForRole(menuId, role) {
  return MENU_PERMISSIONS[menuId]?.includes(role) || false;
}

export function getInitialMenuForRole(role) {
  return INITIAL_MENU_BY_ROLE[role] || 'checkin';
}

