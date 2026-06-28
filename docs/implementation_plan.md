# สถาปัตยกรรมระบบ RSMS (Architecture Overview)

## โครงสร้าง Monorepo

```
request-submission-system/
├── package.json                  # Root — Yarn Workspaces config
├── .gitignore
│
├── frontend/                     # React SPA → Deploy: Vercel
│   ├── package.json              # Dependencies: React, Vite, Chart.js
│   ├── vercel.json               # Vercel deploy config
│   ├── vite.config.js            # Dev proxy /api → localhost:3001
│   ├── .env.local                # Local: ไม่ต้องตั้ง API URL (ใช้ proxy)
│   ├── .env.production           # Production: VITE_API_URL=https://xxx.onrender.com
│   ├── index.html
│   └── src/
│       ├── main.jsx              # Entry point
│       ├── App.jsx               # Main app + routing ตาม role
│       ├── index.css             # Global styles (dark glassmorphism theme)
│       ├── utils/
│       │   └── api.js            # HTTP client เรียก Backend API
│       └── components/
│           ├── LoginModal.jsx    # หน้า Login (email only)
│           ├── Header.jsx        # Header bar แสดง email + role
│           ├── Sidebar.jsx       # เมนูซ้ายตาม role
│           ├── RequestForm.jsx   # ฟอร์มยื่นคำร้อง
│           ├── RequestsTable.jsx # ตารางคำร้อง + modal อนุมัติ
│           └── StatsDashboard.jsx# สถิติ + Pie Chart
│
├── backend/                      # Express API → Deploy: Render.com
│   ├── package.json              # Dependencies: Express, Supabase, Nodemailer
│   ├── render.yaml               # Render deploy config
│   ├── .env.local                # Local: Supabase keys + SMTP config
│   ├── .env.example              # Template สำหรับ dev อื่น
│   └── src/
│       ├── index.js              # Express server (port 3001)
│       ├── config/
│       │   ├── supabase.js       # Supabase client (ใช้ env vars)
│       │   └── email.js          # Nodemailer SMTP transporter
│       ├── routes/
│       │   ├── requests.js       # CRUD คำร้อง + trigger email
│       │   ├── users.js          # Login + จัดการ role
│       │   ├── faculties.js      # ดึงรายชื่อคณะ
│       │   └── email.js          # Status check + test email
│       └── services/
│           └── email.js          # Email templates + ส่ง email
│
└── คำอธิบาย/                      # เอกสารอธิบายระบบ
```

## Data Flow

```
อาจารย์ (Browser)
  │
  ▼
Frontend (React / Vercel)
  │  fetch /api/...
  ▼
Backend (Express / Render)
  │  Supabase SDK        Nodemailer
  ▼                       ▼
Supabase (PostgreSQL)    SMTP Server (Gmail/Outlook)
```

## API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| `GET` | `/api/requests` | ดึงคำร้องทั้งหมด (JOIN approvals) |
| `POST` | `/api/requests` | ส่งคำร้องใหม่ + แจ้ง email คณบดี |
| `PATCH` | `/api/requests/:id/status` | อนุมัติ/ปฏิเสธ + แจ้ง email อาจารย์ |
| `POST` | `/api/users/login` | Login / สร้างผู้ใช้ใหม่ (default: teacher) |
| `GET` | `/api/users` | ดึงรายชื่อผู้ใช้ (Admin) |
| `PATCH` | `/api/users/:email/role` | เปลี่ยน role (Admin) |
| `GET` | `/api/faculties` | ดึงรายชื่อคณะ |
| `GET` | `/api/email/status` | เช็คสถานะ SMTP |
| `POST` | `/api/email/test` | ส่ง email ทดสอบ |
| `GET` | `/api/health` | Health check |

## วิธี Run ในเครื่อง

```bash
yarn install          # ติดตั้ง dependencies ทั้ง FE + BE
yarn dev:be           # Backend  → http://localhost:3001
yarn dev:fe           # Frontend → http://localhost:5173
```

## วิธี Deploy

### Frontend → Vercel
1. เชื่อม GitHub repo กับ Vercel
2. ตั้ง **Root Directory** = `frontend`
3. Vercel จะอ่าน `vercel.json` อัตโนมัติ
4. ตั้ง Environment Variable: `VITE_API_URL` = URL ของ backend บน Render

### Backend → Render.com
1. สร้าง **Web Service** บน Render → เชื่อม GitHub repo
2. ตั้ง **Root Directory** = `backend`
3. **Build Command** = `yarn install`
4. **Start Command** = `yarn start`
5. ตั้ง Environment Variables:
   - `SUPABASE_URL` = URL โปรเจก Supabase
   - `SUPABASE_SERVICE_KEY` = Service key จาก Supabase
   - `CORS_ORIGIN` = URL ของ frontend บน Vercel
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (ถ้าต้องการส่ง email)