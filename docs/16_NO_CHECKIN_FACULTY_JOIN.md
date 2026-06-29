# No Checkin Records — การเชื่อมข้อมูลกับตาราง Faculty

## คำถาม

ต้องการให้ตาราง `no_checkin_records` เชื่อมข้อมูลกับตาราง `faculty`:
- `teacher_name` → `faculty.name_th`
- `email` → `faculty.email`

---

## โครงสร้างปัจจุบัน

### ตาราง `faculty` (1,615 รายการ)
| คอลัมน์ | ตัวอย่าง | หมายเหตุ |
|---------|---------|---------|
| `id` | 1 | Primary Key |
| `name_th` | สมชาย ใจดี | ชื่อที่ทำความสะอาดแล้ว (ลบตำแหน่ง/คำนำหน้า) |
| `full_name_th` | ผศ.ดร.สมชาย ใจดี | ชื่อต้นฉบับ (มีตำแหน่งวิชาการ) |
| `email` | somchai.ja@spu.ac.th | อาจเป็น NULL (บางคนไม่มีอีเมล) |

### ตาราง `no_checkin_records` (ปัจจุบัน)
| คอลัมน์ | ที่มา |
|---------|------|
| `teacher_name` | ข้อความดิบจาก Excel |
| `email` | ข้อความดิบจาก Excel |

---

## วิธีที่เป็นไปได้

### วิธี A: JOIN ตอน Query (แนะนำ)

ไม่ต้องเปลี่ยนโครงสร้างตาราง — ใช้ SQL JOIN ตอนดึงข้อมูล

```sql
SELECT nc.*, f.name_th, f.full_name_th, f.email AS faculty_email
FROM no_checkin_records nc
LEFT JOIN faculty f ON nc.email = f.email
```

**ข้อดี:**
- ไม่ต้องแก้ตาราง
- ข้อมูลจาก Excel เก็บตามต้นฉบับ
- ถ้าข้อมูล faculty อัปเดตภายหลัง จะเห็นข้อมูลล่าสุดเสมอ

**ข้อเสีย:**
- JOIN ทำงานเฉพาะเมื่อ email ตรงกัน — ถ้า Excel มี email ที่ไม่ตรงกับ faculty จะ match ไม่ได้
- ถ้า email ใน faculty เป็น NULL (บางคนไม่มี) จะ JOIN ไม่ติด

---

### วิธี B: เพิ่มคอลัมน์ `faculty_id` เป็น FK

เพิ่มคอลัมน์ `faculty_id` ใน `no_checkin_records` แล้ว match ตอน import

```sql
ALTER TABLE no_checkin_records
  ADD COLUMN faculty_id BIGINT REFERENCES faculty(id);
```

ตอน import → ค้นหา `faculty.email` ที่ตรงกัน → เก็บ `faculty_id`

**ข้อดี:**
- ความสัมพันธ์ชัดเจน มี FK constraint
- Query เร็วกว่า JOIN on text
- ดึงข้อมูล faculty ได้ครบทุก field (คณะ, ตำแหน่ง, etc.)

**ข้อเสีย:**
- ถ้า email จาก Excel ไม่ตรงกับ faculty → `faculty_id` จะเป็น NULL
- ต้องเปลี่ยน logic ตอน import ให้ทำ lookup

---

## ควรใช้ field ไหน JOIN?

| วิธี JOIN | ความน่าเชื่อถือ | เหตุผล |
|----------|---------------|--------|
| **JOIN on `email`** | สูง | email มีรูปแบบชัดเจน (@spu.ac.th) ค่อนข้าง unique |
| JOIN on `teacher_name` = `name_th` | ต่ำ | ชื่อจาก Excel อาจมีคำนำหน้า/ตำแหน่งติดมา เช่น "ผศ.ดร.สมชาย" แต่ `name_th` เก็บแค่ "สมชาย ใจดี" → ไม่ตรงกัน |
| JOIN on `teacher_name` = `full_name_th` | ปานกลาง | มีโอกาสตรงกันมากกว่า แต่ต้องดูรูปแบบใน Excel |

**สรุป: ใช้ `email` เป็นตัว JOIN หลัก** — เชื่อถือได้ที่สุด

---

## คำแนะนำ: ใช้วิธี A + B ร่วมกัน

1. **เพิ่มคอลัมน์ `faculty_id`** ในตาราง `no_checkin_records`
2. **ตอน import** → ใช้ email จาก Excel ค้นหาใน `faculty` → ถ้าเจอเก็บ `faculty_id`
3. **ตอน query** → JOIN กับ `faculty` ผ่าน `faculty_id` (เร็ว + เชื่อถือได้)
4. **ถ้า match ไม่ได้** → `faculty_id` เป็น NULL, ยังเก็บ `teacher_name` / `email` ดิบไว้ดูได้

### ผลลัพธ์ที่ได้

```
┌─ no_checkin_records ──────────────────────────────┐
│ id │ teacher_name │ email │ faculty_id │ ...      │
│  1 │ ผศ.สมชาย     │ s@spu │ 42         │          │  ← match ได้
│  2 │ อ.วิชัย      │ NULL  │ NULL       │          │  ← match ไม่ได้
└────────────────────────────────────────────────────┘
         │ faculty_id
         ▼
┌─ faculty ─────────────────────────────────────────┐
│ id │ name_th    │ full_name_th      │ email       │
│ 42 │ สมชาย ใจดี │ ผศ.สมชาย ใจดี     │ s@spu       │
└───────────────────────────────────────────────────┘
```

---

## ไฟล์ที่ต้องแก้ไข (ถ้าตกลงทำ)

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| Supabase migration | เพิ่มคอลัมน์ `faculty_id` + FK |
| `backend/src/routes/noCheckin.js` | import: lookup faculty by email → เก็บ faculty_id / GET: JOIN faculty |
| `api/no-checkin/import.js` | เพิ่ม lookup logic เดียวกัน |
| `api/no-checkin/index.js` | เพิ่ม JOIN query |
| `frontend/src/components/NoCheckinImport.jsx` | แสดงข้อมูลจาก faculty ที่ JOIN มา (ชื่อที่ถูกต้อง, คณะ) |

---

## รอยืนยัน

ต้องการให้ทำตามแนวทาง A+B (เพิ่ม `faculty_id` + JOIN) หรือเลือกวิธีอื่น?
