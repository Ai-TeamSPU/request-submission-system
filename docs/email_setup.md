# การตั้งค่า Email Notification (SMTP)

ระบบส่งอีเมลแจ้งเตือนผ่าน SMTP โดยเรียกจาก Backend เพื่อป้องกัน credentials หลุด

## Email Flows

| เมื่อ | ผู้รับ | เนื้อหา |
|------|-------|--------|
| อาจารย์ส่งคำร้องใหม่ | คณบดีทุกคน (role = `dean`) | รายละเอียดคำร้อง |
| คณบดี approve / reject | อาจารย์เจ้าของคำร้อง | สถานะ + หมายเหตุ |

## Environment Variables

ตั้งค่าใน `backend/.env.local`:

| ตัวแปร | คำอธิบาย | ตัวอย่าง |
|--------|---------|---------|
| `SMTP_HOST` | SMTP server | `smtp.resend.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_USER` | Username | `resend` |
| `SMTP_PASS` | API Key / App Password | `re_xxxxx` |
| `SMTP_FROM` | อีเมลผู้ส่ง (ต้อง verify domain) | `noreply@yourdomain.com` |

## ตั้งค่า Resend (แนะนำ)

1. สมัครบัญชีที่ [resend.com](https://resend.com)
2. ไปที่ **Settings → API Keys** → สร้าง API Key
3. (ทดสอบ) ใช้ `SMTP_FROM=onboarding@resend.dev` ได้เลย ส่งได้ทันที
4. (Production) ไปที่ **Domains** → เพิ่ม domain → ตั้ง DNS records ตาม Resend แนะนำ

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=onboarding@resend.dev
```

> **หมายเหตุ:** Free tier ส่งได้ 100 emails/day, 3,000/month

## ตั้งค่า Gmail

1. เปิด [Google Account Security](https://myaccount.google.com/security)
2. เปิดใช้ **2-Step Verification**
3. สร้าง **App Password** → คัดลอก password 16 หลัก

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

## ตั้งค่า Outlook / Hotmail

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## ทดสอบการส่ง

```bash
# เช็คสถานะ SMTP
curl http://localhost:3001/api/email/status

# ส่ง email ทดสอบ
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## หมายเหตุ
- ถ้าไม่ตั้งค่า SMTP → ระบบทำงานปกติแต่ไม่ส่ง email (แสดง warning ใน console)
- การส่ง email เป็น async ไม่บล็อก API response

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/src/config/email.js` | สร้าง SMTP transporter |
| `backend/src/services/email.js` | Email templates + ฟังก์ชันส่ง |
| `backend/src/routes/email.js` | API: status check + test |
| `backend/src/routes/requests.js` | เรียก email service เมื่อมีคำร้องใหม่/อัพเดทสถานะ |