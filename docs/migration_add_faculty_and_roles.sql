-- Migration: เพิ่ม faculty ใน users_list และ seed admin
-- รันใน Supabase SQL Editor

-- 1. เพิ่มคอลัมน์ faculty ใน users_list
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS faculty TEXT;

-- 2. Seed admin คนแรก
INSERT INTO users_list (email, role)
VALUES ('kolawat.mi@spu.ac.th', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
