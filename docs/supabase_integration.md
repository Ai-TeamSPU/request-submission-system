# การเชื่อมต่อ Supabase (Integration Guide)

## โครงสร้างฐานข้อมูล (Database Schema)

ระบบใช้ Supabase (PostgreSQL) เก็บข้อมูล 4 ตาราง:

```
faculties ─────────────────── requests ──────── approvals
(รายชื่อคณะ)                 (คำร้อง)          (สถานะอนุมัติ)
                                 │
users_list ──────────────────────┘
(ผู้ใช้งาน + role)
```

### ตาราง `faculties`
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `id` | SERIAL PK | ID |
| `name` | TEXT UNIQUE | ชื่อคณะ |

### ตาราง `users_list`
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `email` | TEXT PK | อีเมลผู้ใช้ |
| `role` | TEXT | สิทธิ์: teacher / dean / director / academic / admin |

### ตาราง `requests`
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `id` | TEXT PK | รหัสคำร้อง (REQ-XXXXXX) |
| `email` | TEXT FK | อีเมลผู้ยื่น → `users_list.email` |
| `teacher_name` | TEXT | ชื่อผู้สอน |
| `faculty` | TEXT FK | คณะ → `faculties.name` |
| `department` | TEXT | สาขาวิชา |
| `course_code` | TEXT | รหัสวิชา |
| `course_name` | TEXT | ชื่อวิชา |
| `section` | TEXT | กลุ่มเรียน |
| `date` | DATE | วันที่สอน |
| `time_range` | TEXT | คาบเวลา |
| `classroom` | TEXT | ห้องเรียน |
| `problem_type` | TEXT | ประเภทปัญหา |
| `reason` | TEXT | เหตุผลประกอบ |
| `attachment_name` | TEXT | ชื่อไฟล์แนบ |
| `submitted_date` | TIMESTAMP | วันเวลาที่ยื่น |

### ตาราง `approvals`
| Column | Type | คำอธิบาย |
|--------|------|---------|
| `request_id` | TEXT FK UNIQUE | → `requests.id` (1:1) |
| `teacher_name` | TEXT | ชื่อผู้สอน |
| `course_and_section` | TEXT | วิชา/กลุ่ม |
| `teaching_date` | DATE | วันที่สอน |
| `status` | TEXT | Pending / Approved / Rejected |
| `manager_note` | TEXT | หมายเหตุจากผู้พิจารณา |

### Trigger
เมื่อ INSERT ลง `requests` → สร้างแถวใน `approvals` อัตโนมัติด้วยสถานะ `Pending`

---

## การเชื่อมต่อจาก Backend

Supabase client อยู่ที่ `backend/src/config/supabase.js` โดยอ่าน credentials จาก environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

**สำคัญ**: Supabase key อยู่ฝั่ง Backend เท่านั้น — Frontend ไม่มี key ใดๆ ทุก request ไปผ่าน Backend API ก่อน

---

## Backend API ↔ Supabase mapping

| API Endpoint | Supabase Query |
|-------------|----------------|
| `GET /api/requests` | `requests` SELECT + JOIN `approvals` |
| `POST /api/requests` | `requests` INSERT (trigger สร้าง approval) |
| `PATCH /api/requests/:id/status` | `approvals` UPDATE |
| `POST /api/users/login` | `users_list` SELECT → INSERT ถ้ายังไม่มี |
| `GET /api/users` | `users_list` SELECT |
| `PATCH /api/users/:email/role` | `users_list` UPDATE |
| `GET /api/faculties` | `faculties` SELECT |