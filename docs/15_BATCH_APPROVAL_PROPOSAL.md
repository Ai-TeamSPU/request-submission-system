# Batch Approval — Proposal

ฟีเจอร์ "เลือกหลายรายการแล้วอนุมัติ/ปฏิเสธพร้อมกัน" สำหรับหน้า **คำขอที่รอการอนุมัติ** (`pending-approvals`)

---

## สถานะปัจจุบัน

- หน้า `pending-approvals` แสดงรายการคำขอที่มี `status === 'Pending'`
- การอนุมัติ/ปฏิเสธทำได้ **ทีละ 1 รายการ** ผ่าน Modal ใน `RequestsTable.jsx`
- ทุกครั้งต้องกรอก **ความคิดเห็นประกอบ** (managerNote) ก่อนกดอนุมัติ/ปฏิเสธ
- Backend API: `PATCH /api/requests/:id/status` รับ `{ status, managerNote, approverEmail }` ทีละรายการ
- Role ที่ใช้ได้: `dean`, `admin`

---

## สิ่งที่จะเพิ่ม

### 1. Checkbox เลือกรายการในตาราง

| ตำแหน่ง | รายละเอียด |
|---------|-----------|
| **Header ของตาราง** | เพิ่มคอลัมน์แรกเป็น checkbox "เลือกทั้งหมด" (Select All) |
| **แต่ละแถว** | เพิ่ม checkbox สำหรับเลือกแต่ละรายการ |
| **เงื่อนไข** | แสดง checkbox เฉพาะเมื่อ `role === 'manager'` (dean/admin ในหน้า pending) |

```
┌──┬──────────┬────────┬─────────────┬───────────┬─────────┬──────────┐
│☐ │ รหัสคำขอ │ ผู้สอน │ วิชา / กลุ่ม │ วันที่สอน │ สถานะ   │ การจัดการ │
├──┼──────────┼────────┼─────────────┼───────────┼─────────┼──────────┤
│☑ │ REQ-001  │ อ.สมชาย│ CS101 / 01  │ 15/06/69  │ รออนุมัติ│ [ดู]     │
│☑ │ REQ-002  │ อ.สมศรี│ CS201 / 02  │ 16/06/69  │ รออนุมัติ│ [ดู]     │
│☐ │ REQ-003  │ อ.วิชัย│ IT301 / 01  │ 17/06/69  │ รออนุมัติ│ [ดู]     │
└──┴──────────┴────────┴─────────────┴───────────┴─────────┴──────────┘
```

### 2. Action Bar (แถบคำสั่งรวม)

เมื่อเลือกรายการ >= 1 จะแสดง Action Bar ด้านบนตาราง

```
┌──────────────────────────────────────────────────────────────────────┐
│  ☑ เลือกแล้ว 2 รายการ          [ ✓ อนุมัติทั้งหมด ] [ ✗ ปฏิเสธ ] │
└──────────────────────────────────────────────────────────────────────┘
```

- **ปุ่ม "อนุมัติทั้งหมด"** — เปิด Modal ให้กรอก managerNote ครั้งเดียว แล้ว apply กับทุกรายการที่เลือก
- **ปุ่ม "ปฏิเสธทั้งหมด"** — เปิด Modal ให้กรอก managerNote ครั้งเดียว แล้ว reject ทุกรายการที่เลือก
- Action Bar ใช้ `position: sticky` ติดด้านบนของตาราง

### 3. Confirmation Modal สำหรับ Batch Action

```
┌─────────────────────────────────────────────────┐
│  อนุมัติคำขอ 2 รายการ                           │
│                                                 │
│  รายการที่จะอนุมัติ:                              │
│  • REQ-001 — อ.สมชาย (CS101)                    │
│  • REQ-002 — อ.สมศรี (CS201)                    │
│                                                 │
│  ความคิดเห็นประกอบการตัดสินใจ *                   │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│              [ ยกเลิก ]  [ ✓ ยืนยันอนุมัติ ]    │
└─────────────────────────────────────────────────┘
```

- แสดงรายชื่อคำขอที่เลือกให้ review ก่อนยืนยัน
- บังคับกรอก managerNote เหมือนเดิม (ใช้ note เดียวกันทุกรายการ)
- ใช้ note ชุดเดียวกันสำหรับทุกรายการที่เลือก

---

## ไฟล์ที่ต้องแก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `frontend/src/components/RequestsTable.jsx` | เพิ่ม checkbox, state สำหรับ selectedIds, Action Bar, Batch Modal |
| `frontend/src/App.jsx` | เพิ่มฟังก์ชัน `handleBatchApprove` / `handleBatchReject` |
| `frontend/src/utils/api.js` | เพิ่ม `batchUpdateStatus()` method |
| `frontend/src/index.css` | เพิ่ม style สำหรับ Action Bar, checkbox |
| `api/requests/batch-status.js` | **(ไฟล์ใหม่)** Backend endpoint สำหรับ batch update |

---

## รายละเอียดการเปลี่ยนแปลง

### Frontend — `RequestsTable.jsx`

**State ใหม่:**
```jsx
const [selectedIds, setSelectedIds] = useState(new Set());
const [batchAction, setBatchAction] = useState(null); // 'approve' | 'reject' | null
const [batchNote, setBatchNote] = useState('');
```

**Logic:**
- `toggleSelect(id)` — เพิ่ม/ลบ id ออกจาก Set
- `toggleSelectAll()` — เลือก/ยกเลิกทั้งหมด
- `handleBatchSubmit()` — เรียก `onBatchApprove` หรือ `onBatchReject` พร้อม ids[] + note
- เมื่อ batch action สำเร็จ → clear selectedIds + ปิด Modal

**สิ่งที่ไม่เปลี่ยน:**
- การกดดูรายละเอียดและอนุมัติทีละรายการยังคงทำงานได้ปกติ
- ไม่กระทบ role อื่น (employee, academic, viewer)

### Frontend — `App.jsx`

```jsx
const handleBatchApprove = async (ids, note) => {
  const res = await api.batchUpdateStatus(ids, 'Approved', note, userEmail);
  if (res.success) await loadRequests();
};

const handleBatchReject = async (ids, note) => {
  const res = await api.batchUpdateStatus(ids, 'Rejected', note, userEmail);
  if (res.success) await loadRequests();
};
```

ส่ง props ใหม่ `onBatchApprove`, `onBatchReject` เข้า `RequestsTable`

### Frontend — `api.js`

```js
batchUpdateStatus: (ids, status, managerNote, approverEmail) =>
  request('/api/requests/batch-status', {
    method: 'PATCH',
    body: JSON.stringify({ ids, status, managerNote, approverEmail }),
  }),
```

### Backend — `api/requests/batch-status.js` (ไฟล์ใหม่)

- รับ `{ ids: string[], status, managerNote, approverEmail }`
- ดึงชื่อผู้อนุมัติจากตาราง `faculty` (เหมือน endpoint เดิม)
- วนลูป update ทุก id ในตาราง `approvals`
- ส่ง email แจ้งเตือนให้อาจารย์แต่ละรายการ
- Response: `{ success: true, count: N }`

---

## UX Behavior

| สถานการณ์ | พฤติกรรม |
|----------|---------|
| ยังไม่เลือกรายการ | ซ่อน Action Bar — ตารางแสดงปกติ |
| เลือก 1+ รายการ | แสดง Action Bar แบบ slide-down animation |
| กด "เลือกทั้งหมด" | เลือกทุกรายการในตาราง |
| กด "เลือกทั้งหมด" อีกครั้ง | ยกเลิกการเลือกทั้งหมด |
| กด "อนุมัติทั้งหมด" | เปิด Batch Modal (mode: approve) |
| กรอก note แล้วกด "ยืนยัน" | ส่ง API → สำเร็จ → clear selection, รีโหลดข้อมูล |
| API ล้มเหลว | แสดง error message, ไม่ clear selection |
| กด Esc หรือ "ยกเลิก" | ปิด Modal, เก็บ selection ไว้ |

---

## Design Notes

- Checkbox ใช้ custom styling ให้เข้ากับ design system (ไม่ใช้ default browser checkbox)
- Action Bar ใช้ `glass-panel` style เหมือนกับ component อื่นในระบบ
- สี: ปุ่มอนุมัติใช้ `btn-success`, ปฏิเสธใช้ `btn-danger` (เหมือนเดิม)
- Animation: ใช้ `animate-fade-in` สำหรับ Action Bar

---

## สิ่งที่ไม่รวมในครั้งนี้

- ไม่เพิ่ม batch action ให้หน้า "คำขอที่ได้รับการอนุมัติแล้ว" (approved-requests) — ทำทีหลังได้ถ้าต้องการ
- ไม่เพิ่ม filter/search ในตาราง — เป็นฟีเจอร์แยกต่างหาก
- ไม่เปลี่ยน permission model — ยังคงเช็ค role เหมือนเดิม

---

## ประมาณการ

| รายการ | ระยะเวลา |
|--------|---------|
| Frontend (checkbox + Action Bar + Batch Modal) | หลัก |
| Backend (batch-status endpoint) | เสริม |
| CSS styling | เล็กน้อย |
| **รวม** | **สามารถทำเสร็จภายใน session เดียว** |
