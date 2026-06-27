# การรวมระบบกับ Supabase (Supabase Integration Guide)

เอกสารนี้อธิบายเกี่ยวกับโครงสร้างฐานข้อมูล (Database Schema) และคำสั่ง SQL สำหรับนำไปสร้างตารางบน Supabase รวมถึงสถาปัตยกรรมการแยกตารางเก็บข้อมูลคำร้อง (`requests`) และตารางสำหรับอนุมัติคำร้อง (`approvals`) ออกจากกัน

---

## 1. คำสั่ง SQL สำหรับสร้างตาราง (SQL DDL)

คุณสามารถนำคำสั่ง SQL ด้านล่างนี้ไปรันใน **SQL Editor** ของโครงการคุณบน Supabase ได้ทันที เพื่อสร้างตารางทั้งหมดที่ระบบต้องการใช้งาน ได้แก่:
1. ตารางรายชื่อคณะ (`faculties`)
2. ตารางผู้ใช้ (`users_list`)
3. ตารางบันทึกคำร้องขอเช็คอินย้อนหลัง (`requests`)
4. ตารางบันทึกสถานะการอนุมัติคำร้อง (`approvals`)
5. ฟังก์ชันและ Trigger สำหรับสร้างข้อมูลอนุมัติอัตโนมัติ

```sql
-- 1. สร้างตารางสำหรับเก็บรายชื่อคณะ/วิทยาลัย
CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่มข้อมูลรายชื่อคณะเริ่มต้นสำหรับระบบ
INSERT INTO faculties (name) VALUES
('คณะวิทยาศาสตร์'),
('คณะครุศาสตร์'),
('คณะวิศวกรรมศาสตร์'),
('คณะบริหารธุรกิจ'),
('คณะมนุษยศาสตร์และสังคมศาสตร์'),
('วิทยาลัยนานาชาติ');

-- 2. สร้างตารางสำหรับเก็บรายการอีเมลที่เข้าใช้งาน
CREATE TABLE users_list (
    email TEXT PRIMARY KEY,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'dean', 'director', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. สร้างตารางสำหรับเก็บรายละเอียดคำร้องขอเช็คอินย้อนหลัง (ฝั่งอาจารย์ป้อน)
CREATE TABLE requests (
    id TEXT PRIMARY KEY,
    email TEXT REFERENCES users_list(email) ON DELETE CASCADE,
    teacher_name TEXT NOT NULL,
    faculty TEXT REFERENCES faculties(name) ON UPDATE CASCADE,
    department TEXT NOT NULL,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    section TEXT NOT NULL,
    date DATE NOT NULL,
    time_range TEXT NOT NULL,
    classroom TEXT NOT NULL,
    problem_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    attachment_name TEXT,
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. สร้างตารางสำหรับเก็บข้อมูลพิจารณาอนุมัติ/ไม่อนุมัติ (แยกตารางจาก requests)
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    request_id TEXT REFERENCES requests(id) ON DELETE CASCADE UNIQUE, -- รหัสคำขอ (ผูกกับคำร้องหลักแบบ 1:1)
    teacher_name TEXT NOT NULL, -- ชื่อผู้สอน
    course_and_section TEXT NOT NULL, -- วิชา/กลุ่ม (เช่น CS101 / Sec 1)
    teaching_date DATE NOT NULL, -- วันที่สอน
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')), -- สถานะอนุมัติ
    manager_note TEXT DEFAULT '', -- ข้อคิดเห็น/เหตุผลจากผู้จัดการ
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. สร้าง ฟังก์ชัน และ Trigger สำหรับส่งข้อมูลไปสร้างในตาราง approvals อัตโนมัติเมื่อมีการ INSERT ใน requests
CREATE OR REPLACE FUNCTION auto_create_approval()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO approvals (request_id, teacher_name, course_and_section, teaching_date, status)
    VALUES (
        NEW.id,
        NEW.teacher_name,
        NEW.course_code || ' / ' || NEW.section,
        NEW.date,
        'Pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_approval
AFTER INSERT ON requests
FOR EACH ROW
EXECUTE FUNCTION auto_create_approval();
```

---

## 2. โครงสร้างฐานข้อมูล (Database Schema)

### ตาราง `requests` (คำร้องขอหลัก)
- **`id` (TEXT, PK):** รหัสคำร้อง
- **`email` (TEXT, FK):** อีเมลผู้ยื่นคำขอ
- **`teacher_name` (TEXT):** ชื่อผู้สอน
- **`faculty` (TEXT):** คณะ / วิทยาลัย
- **`department` (TEXT):** สาขาวิชา
- **`course_code` (TEXT) / `course_name` (TEXT):** รหัสและชื่อรายวิชา
- **`section` (TEXT):** กลุ่มเรียน / Section
- **`date` (DATE):** วันที่ทำการสอน
- **`time_range` (TEXT):** คาบเวลาเรียน
- **`classroom` (TEXT):** ห้องเรียน
- **`problem_type` (TEXT):** ประเภทปัญหา
- **`reason` (TEXT):** เหตุผลประกอบ
- **`attachment_name` (TEXT):** ชื่อไฟล์หลักฐาน
- **`submitted_date` (TIMESTAMP):** วันเวลาที่ยื่นเรื่อง

### ตาราง `approvals` (สถานะการอนุมัติ) 🌟
- **`request_id` (TEXT, FK, Unique):** รหัสคำร้องที่อ้างอิงจากตาราง `requests`
- **`teacher_name` (TEXT):** ชื่อผู้สอน
- **`course_and_section` (TEXT):** วิชา/กลุ่ม (เช่น `CS101 / Sec 1`)
- **`teaching_date` (DATE):** วันที่สอน
- **`status` (TEXT):** สถานะการพิจารณา (`Pending` = รอพิจารณา, `Approved` = อนุมัติแล้ว, `Rejected` = ปฏิเสธ/ไม่อนุมัติ)
- **`manager_note` (TEXT):** ข้อคิดเห็นหรือเหตุผลจากผู้จัดการ
- **`updated_at` (TIMESTAMP):** วันเวลาที่แก้ไขสถานะล่าสุด

---

## 3. ตัวอย่างการดึงข้อมูลและจัดการผ่าน React (Supabase SDK)

เมื่อแยกตารางแล้ว เวลาดึงข้อมูลเราจะต้องใช้การ **JOIN** เพื่อรวบรวมฟิลด์อนุมัติมาแสดงผลร่วมกัน โดยอัปเดตไฟล์ `src/utils/database.js` ดังนี้:

```javascript
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
  }
};
```