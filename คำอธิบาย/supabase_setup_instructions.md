# คู่มือการติดตั้งและเชื่อมต่อฐานข้อมูล Supabase 100%

คู่มือนี้จะช่วยคุณตั้งค่าโครงการ Supabase ของคุณเพื่อรองรับการใช้งานระบบจริงร่วมกับโปรเจกต์เว็บแอปพลิเคชัน 100% โดยจะรวมการสร้างตาราง การตั้งค่า Trigger การเพิ่มบัญชีผู้ใช้เริ่มต้น และการปิดใช้งาน RLS (Row-Level Security) ชั่วคราวเพื่อให้ระบบหน้าบ้านสามารถดึงข้อมูลและบันทึกข้อมูลได้โดยตรง

---

## 🛠️ ขั้นตอนการติดตั้งบนหน้าเว็บ Supabase

1. เข้าสู่ระบบ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโครงการของคุณ (**mnfogucwlnyuzgjbnsqw**)
3. คลิกเลือกเมนู **SQL Editor** จากแถบเมนูด้านซ้าย (ไอคอน `>_`)
4. คลิกปุ่ม **New query**
5. คัดลอกสคริปต์ SQL ทั้งหมดในกล่องข้อความด้านล่างไปวางใน SQL Editor
6. คลิกปุ่ม **Run** (หรือกดปุ่ม `Ctrl + Enter` / `Cmd + Enter`) เพื่อประมวลผล

---

## 📝 สคริปต์ SQL สำหรับรันใน Supabase SQL Editor

```sql
-- 1. สร้างตารางรายชื่อคณะ (faculties)
CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่มรายชื่อคณะเริ่มต้นในระบบ (หากไม่มีอยู่แล้ว)
INSERT INTO faculties (name) VALUES
('คณะวิทยาศาสตร์'),
('คณะครุศาสตร์'),
('คณะวิศวกรรมศาสตร์'),
('คณะบริหารธุรกิจ'),
('คณะมนุษยศาสตร์และสังคมศาสตร์'),
('วิทยาลัยนานาชาติ')
ON CONFLICT (name) DO NOTHING;

-- 2. สร้างตารางรายชื่อผู้ใช้งานและบทบาทสิทธิ์ (users_list)
CREATE TABLE IF NOT EXISTS users_list (
    email TEXT PRIMARY KEY,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'dean', 'director', 'academic', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่มบัญชีผู้ใช้งานระบบและบทบาทเริ่มต้น (หากไม่มีอยู่แล้ว)
INSERT INTO users_list (email, role) VALUES
('admin@university.ac.th', 'admin'),
('dean@university.ac.th', 'dean'),
('director@university.ac.th', 'director'),
('academic@university.ac.th', 'academic'),
('teacher@university.ac.th', 'teacher')
ON CONFLICT (email) DO NOTHING;

-- 3. สร้างตารางคำร้องขอเช็คอินย้อนหลัง (requests)
CREATE TABLE IF NOT EXISTS requests (
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

-- 4. สร้างตารางพิจารณาอนุมัติคำร้อง (approvals)
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    request_id TEXT REFERENCES requests(id) ON DELETE CASCADE UNIQUE,
    teacher_name TEXT NOT NULL,
    course_and_section TEXT NOT NULL,
    teaching_date DATE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    manager_note TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. สร้างฟังก์ชันและ Trigger สำหรับอำนวยความสะดวก:
-- เมื่ออาจารย์บันทึกคำร้องลง requests ให้สร้างข้อมูลสถานะ 'Pending' ลง approvals อัตโนมัติทันที
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

DROP TRIGGER IF EXISTS trigger_auto_create_approval ON requests;
CREATE TRIGGER trigger_auto_create_approval
AFTER INSERT ON requests
FOR EACH ROW
EXECUTE FUNCTION auto_create_approval();

-- 6. ปิดการตั้งค่าระบบความปลอดภัยระดับแถว (Disable RLS)
-- เพื่อให้แอปพลิเคชันฝั่งหน้าบ้าน (Client) สามารถ SELECT, INSERT, UPDATE ข้อมูลผ่าน API Key ได้โดยตรง
ALTER TABLE faculties DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;
```

---

## ⚡ SQL สำหรับอัปเดตฐานข้อมูลเดิมที่มีอยู่แล้ว (Migration SQL)

หากคุณเคยติดตั้งตารางข้อมูลทั้งหมดเรียบร้อยแล้วและต้องการอัปเดตบทบาท `'academic'` เพิ่มเติม สามารถใช้ SQL Script ด้านล่างนี้เพื่อรันอัปเดตได้ทันที:

```sql
-- 1. ยกเลิก Constraint เช็คบทบาทเดิมออกก่อน (หากมี)
ALTER TABLE users_list DROP CONSTRAINT IF EXISTS users_list_role_check;

-- 2. สร้าง Constraint เช็คบทบาทใหม่ที่รองรับสิทธิ์ 'academic'
ALTER TABLE users_list ADD CONSTRAINT users_list_role_check CHECK (role IN ('teacher', 'dean', 'director', 'academic', 'admin'));

-- 3. เพิ่ม/อัปเดตข้อมูลผู้ใช้วิชาการเริ่มต้นเข้าระบบ
INSERT INTO users_list (email, role)
VALUES ('academic@university.ac.th', 'academic')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
```

---

## 🔍 วิธีตรวจสอบผลลัพธ์ว่าใช้ได้ 100% หรือยัง

1. เมื่อรันสคริปต์ SQL ด้านบนสำเร็จแล้ว ให้กดรีเฟรชหน้าเว็บแอปพลิเคชัน (Vite Dev Server) ของคุณ
2. ล็อกอินด้วยบัญชีแอดมิน: `admin@university.ac.th`
3. ไปที่เมนู **ข้อมูลหลัก** แท็บ **ข้อมูลผู้ใช้งานในระบบ**
4. รายชื่ออีเมลเริ่มต้นทั้ง 5 บัญชีที่จำลองขึ้นมาควรจะถูกโหลดขึ้นมาจาก Supabase จริง ๆ 100% ปรากฏขึ้นมาในตารางอย่างสวยงาม!
5. ทดลองเปลี่ยนสิทธิ์ผู้ใช้อื่น และทดสอบการส่งฟอร์มคำขอเช็คอินย้อนหลังได้ทันที ข้อมูลจะอัปเดตและถูกบันทึกจริงเข้าไปในระบบ Supabase Database
