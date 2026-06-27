import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnfogucwlnyuzgjbnsqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZm9ndWN3bG55dXpnamJuc3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjUyMzIsImV4cCI6MjA5ODAwMTIzMn0.niY_C_5TvVNYCMpV44xlbM-fdTWi7K8QB_9Pzq4SBJ4';
export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  // 1. ดึงข้อมูลคำร้องทั้งหมดพร้อมสถานะการอนุมัติ (JOIN Table)
  getRequests: async () => {
    // ดึงข้อมูล requests พร้อมดึงข้อมูล status, manager_note จาก table approvals ที่เชื่อมโยงกันอยู่
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        approvals (
          status,
          manager_note
        )
      `)
      .order('submitted_date', { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      return [];
    }

    // ทำการแปลง Format ข้อมูลให้ออกมาเป็นก้อนเดี่ยวสำหรับ React
    return data.map(item => ({
      id: item.id,
      email: item.email,
      teacherName: item.teacher_name,
      faculty: item.faculty,
      department: item.department,
      courseCode: item.course_code,
      courseName: item.course_name,
      section: item.section,
      date: item.date,
      timeRange: item.time_range,
      classroom: item.classroom,
      problemType: item.problem_type,
      reason: item.reason,
      attachmentName: item.attachment_name,
      // ดึงสถานะจากตาราง approvals ที่ JOIN มาได้
      status: item.approvals?.status || 'Pending',
      managerNote: item.approvals?.manager_note || '',
      submittedDate: new Date(item.submitted_date).toLocaleString('th-TH')
    }));
  },

  // 2. ยื่นคำร้องขอเช็คอินย้อนหลัง (บันทึกข้อมูลหลักลง requests เท่านั้น ส่วน approvals จะเกิดจาก Trigger อัตโนมัติ)
  submitRequest: async (requestData) => {
    const newRequest = {
      id: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
      ...requestData
    };

    const { data, error } = await supabase
      .from('requests')
      .insert(newRequest);

    if (error) return { success: false, error };
    return { success: true, request: newRequest };
  },

  // 3. ผู้จัดการอัปเดตสถานะการอนุมัติ (อัปเดตลงตาราง approvals โดยตรง)
  updateRequestStatus: async (requestId, status, managerNote) => {
    const { data, error } = await supabase
      .from('approvals')
      .update({ status, manager_note: managerNote, updated_at: new Date() })
      .eq('request_id', requestId);

    if (error) {
      console.error("Error updating approval status:", error);
      return { success: false, error };
    }
    return { success: true, id: requestId, status, managerNote };
  },

  // 4. บันทึก/ดึงข้อมูลสิทธิ์ผู้ใช้งาน (สิทธิ์เริ่มต้นคือ 'teacher')
  saveEmail: async (email) => {
    const { data, error } = await supabase
      .from('users_list')
      .select('*')
      .eq('email', email);

    if (!error && data && data.length > 0) {
      return { success: true, email: data[0].email, role: data[0].role };
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users_list')
      .insert({ email, role: 'teacher' })
      .select('*');

    if (insertError) return { success: false, error: insertError };
    return { success: true, email: newUser[0].email, role: newUser[0].role };
  },

  // 5. ดึงรายชื่อผู้ใช้งานทั้งหมด (สำหรับ Admin)
  getUsersList: async () => {
    const { data, error } = await supabase
      .from('users_list')
      .select('*')
      .order('email', { ascending: true });

    if (error) return [];
    return data;
  },

  // 6. อัปเดตบทบาท/สิทธิ์ผู้ใช้งาน (สำหรับ Admin)
  updateUserRole: async (email, role) => {
    const { data, error } = await supabase
      .from('users_list')
      .update({ role })
      .eq('email', email);

    if (error) return { success: false, error };
    return { success: true, email, role };
  },

  // 7. ดึงรายชื่อคณะทั้งหมดจาก Supabase
  getFaculties: async () => {
    const { data, error } = await supabase
      .from('faculties')
      .select('name')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        'คณะวิทยาศาสตร์',
        'คณะครุศาสตร์',
        'คณะวิศวกรรมศาสตร์',
        'คณะบริหารธุรกิจ',
        'คณะมนุษยศาสตร์และสังคมศาสตร์',
        'วิทยาลัยนานาชาติ'
      ];
    }
    return data.map(item => item.name);
  }
};