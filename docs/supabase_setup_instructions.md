# คู่มือติดตั้ง Supabase Database

## ขั้นตอนการติดตั้ง

1. เข้าสู่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจก → ไปที่ **SQL Editor** → **New query**
3. คัดลอก SQL ด้านล่างทั้งหมด → กด **Run**

---

## SQL Script

```sql
-- 1. ตารางรายชื่อคณะ
CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO faculties (name) VALUES
('คณะวิทยาศาสตร์'),
('คณะครุศาสตร์'),
('คณะวิศวกรรมศาสตร์'),
('คณะบริหารธุรกิจ'),
('คณะมนุษยศาสตร์และสังคมศาสตร์'),
('วิทยาลัยนานาชาติ')
ON CONFLICT (name) DO NOTHING;

-- 2. ตารางผู้ใช้งาน
CREATE TABLE IF NOT EXISTS users_list (
    email TEXT PRIMARY KEY,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'dean', 'director', 'academic', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO users_list (email, role) VALUES
('admin@university.ac.th', 'admin'),
('dean@university.ac.th', 'dean'),
('director@university.ac.th', 'director'),
('academic@university.ac.th', 'academic'),
('teacher@university.ac.th', 'teacher')
ON CONFLICT (email) DO NOTHING;

-- 3. ตารางคำร้อง
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

-- 4. ตารางอนุมัติ
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

-- 5. Trigger: สร้าง approval อัตโนมัติเมื่อมี request ใหม่
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

-- 6. ปิด RLS (Row Level Security) เพื่อให้ Backend เข้าถึงข้อมูลได้
ALTER TABLE faculties DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;
```

---

## Migration: เพิ่ม role `academic`

หากเคยสร้างตารางแล้วแต่ยังไม่มี role `academic`:

```sql
ALTER TABLE users_list DROP CONSTRAINT IF EXISTS users_list_role_check;
ALTER TABLE users_list ADD CONSTRAINT users_list_role_check
  CHECK (role IN ('teacher', 'dean', 'director', 'academic', 'admin'));

INSERT INTO users_list (email, role)
VALUES ('academic@university.ac.th', 'academic')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
```

---

## ตรวจสอบผลลัพธ์

1. รัน Backend: `yarn dev:be`
2. เปิด Browser: `http://localhost:3001/api/health` → ต้องเห็น `{"status":"ok"}`
3. ทดสอบ: `http://localhost:3001/api/faculties` → ต้องเห็นรายชื่อคณะ
4. รัน Frontend: `yarn dev:fe` → Login ด้วย `admin@university.ac.th` → ไปที่ข้อมูลหลัก → ต้องเห็นรายชื่อผู้ใช้