-- Migration: เพิ่มบทบาท 'group_director' (ผอ.กลุ่มงาน) ใน Check Constraint
-- รันใน Supabase SQL Editor

-- 1. ลบ Check Constraint เดิมออก
ALTER TABLE users_list DROP CONSTRAINT IF EXISTS users_list_role_check;

-- 2. สร้าง Check Constraint ใหม่ที่รองรับ 'group_director'
ALTER TABLE users_list ADD CONSTRAINT users_list_role_check
  CHECK (role IN ('teacher', 'dean', 'director', 'group_director', 'academic', 'admin'));
