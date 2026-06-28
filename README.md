# RSMS — ระบบคำร้องขอเช็คอินย้อนหลัง

ระบบสำหรับอาจารย์ยื่นคำร้องขอเช็คอินย้อนหลัง และให้คณบดีพิจารณาอนุมัติ/ปฏิเสธ พร้อมแจ้งเตือนผ่านอีเมล

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Chart.js, Lucide Icons |
| Backend | Express 5, Nodemailer |
| Database | Supabase (PostgreSQL) |

## Project Structure

```
├── frontend/          # React SPA
│   └── src/
│       ├── components/   # UI components
│       └── utils/api.js  # API client
├── backend/           # Express API
│   └── src/
│       ├── config/       # Supabase + Email config
│       ├── routes/       # API routes
│       └── services/     # Email service
└── docs/              # Documentation
```

## Quick Start

```bash
# ติดตั้ง dependencies
yarn install

# รัน dev (frontend + backend พร้อมกัน)
yarn dev

# หรือรันแยก
yarn dev:fe    # frontend → http://localhost:5173
yarn dev:be    # backend  → http://localhost:3001
```

## Environment Variables

คัดลอก `backend/.env.example` เป็น `backend/.env.local` แล้วใส่ค่า

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# CORS
CORS_ORIGIN=http://localhost:5173

# Email SMTP (ดูรายละเอียดด้านล่าง)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Roles & Permissions

| Role | สิทธิ์ | คณะ |
|------|-------|------|
| `teacher` | ยื่นคำร้อง, ดูคำร้องของตัวเอง | - |
| `dean` | อนุมัติ/ปฏิเสธคำร้อง (เฉพาะคณะที่ดูแล), ดูประวัติ | ผูกกับคณะ 1:1 |
| `academic` | กดยืนยัน "เช็กอินย้อนหลังเรียบร้อย" (เฉพาะคณะที่ดูแล) | ผูกกับคณะ 1:1 |
| `director` | ดูคำร้องที่อนุมัติแล้ว, ตั้งค่าอีเมล | - |
| `admin` | เข้าถึงได้ทุกเมนู, จัดการ role/คณะของผู้ใช้ | - |

### Request Status Flow

```
Pending → Approved (คณบดีอนุมัติ) → Completed (วิชาการยืนยันเช็กอินแล้ว)
        → Rejected (คณบดีปฏิเสธ)
```

### การตั้งค่า Admin คนแรก

รัน SQL ใน Supabase SQL Editor (ดูไฟล์ `docs/migration_add_faculty_and_roles.sql`)

```sql
INSERT INTO users_list (email, role)
VALUES ('kolawat.mi@spu.ac.th', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
```

หลังจากนั้น admin สามารถจัดการ role และคณะของผู้ใช้คนอื่นผ่านหน้า Master Data

---

## Email Notification

ระบบส่งอีเมลแจ้งเตือนผ่าน SMTP โดยเรียกจาก Backend เพื่อป้องกัน API key หลุด รองรับทั้ง **Gmail** และ **Outlook**

### Email Flows

| เมื่อ | ผู้รับ | เนื้อหา |
|------|-------|--------|
| อาจารย์ส่งคำร้องใหม่ | คณบดีของคณะนั้น (role = `dean` + faculty ตรงกัน) | รายละเอียดคำร้อง (รหัส, ผู้สอน, วิชา, วันที่, เหตุผล) |
| คณบดี approve / reject | อาจารย์เจ้าของคำร้อง | สถานะ (อนุมัติ/ไม่อนุมัติ) + หมายเหตุ |

### ตั้งค่า Gmail

1. เปิด [Google Account Security](https://myaccount.google.com/security)
2. เปิดใช้ **2-Step Verification**
3. สร้าง **App Password** → คัดลอก password 16 หลัก

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### ตั้งค่า Outlook / Hotmail

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### ทดสอบการส่ง

```bash
# เช็คสถานะ SMTP
curl http://localhost:3001/api/email/status

# ส่งอีเมลทดสอบ
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### หมายเหตุ

- ถ้าไม่ได้ตั้งค่า SMTP ระบบยังทำงานปกติ แต่ไม่ส่งอีเมล (แสดง warning ใน console)
- การส่ง email เป็น async ไม่บล็อก API response — ถ้าส่งไม่สำเร็จจะ log error แต่ API ยัง return success
- ไฟล์ที่เกี่ยวข้อง: `backend/src/config/email.js`, `backend/src/services/email.js`, `backend/src/routes/email.js`

## API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| `GET` | `/api/requests` | ดึงคำร้องทั้งหมด |
| `POST` | `/api/requests` | ส่งคำร้องใหม่ (+ แจ้ง email คณบดี) |
| `PATCH` | `/api/requests/:id/status` | อนุมัติ/ปฏิเสธ (+ แจ้ง email อาจารย์) |
| `PATCH` | `/api/requests/:id/complete` | วิชาการยืนยันเช็กอินเรียบร้อย |
| `POST` | `/api/users/login` | Login ด้วย email |
| `GET` | `/api/users` | ดึงรายชื่อผู้ใช้ |
| `PATCH` | `/api/users/:email/role` | เปลี่ยน role + คณะของผู้ใช้ |
| `GET` | `/api/faculties` | ดึงรายชื่อคณะ |
| `GET` | `/api/email/status` | เช็คสถานะ SMTP |
| `POST` | `/api/email/test` | ส่งอีเมลทดสอบ |
| `GET` | `/api/health` | Health check |
