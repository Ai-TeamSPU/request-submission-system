import React from 'react';
import { Settings, Mail } from 'lucide-react';

export default function EmailAlerts() {
  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <Mail size={18} color="var(--color-primary)" />
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
          แม่แบบอีเมลแจ้งเตือนผู้ใช้งาน
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <label style={{ color: 'var(--text-main)', fontWeight: '600' }}>1. เมื่อผู้สอนส่งคำร้อง (Request Submitted)</label>
          <input type="text" defaultValue="[RSMS] ยืนยันการได้รับคำร้องขอเช็คอินย้อนหลัง รหัส {request_id}" style={{ marginBottom: '10px', marginTop: '8px' }} />
          <textarea rows="3" defaultValue="เรียน อาจารย์ {teacher_name},&#10;&#10;ระบบได้รับคำร้องขอเช็คอินย้อนหลังของวิชา {course_code} วันที่ {teaching_date} เรียบร้อยแล้ว ขณะนี้อยู่ระหว่างการรออนุมัติจากผู้บริหาร"></textarea>
        </div>
        <div className="glass-card">
          <label style={{ color: 'var(--color-success)', fontWeight: '600' }}>2. เมื่อคำร้องได้รับการอนุมัติ (Request Approved)</label>
          <input type="text" defaultValue="[RSMS] คำร้องขอเช็คอินย้อนหลัง รหัส {request_id} ได้รับการอนุมัติแล้ว" style={{ marginBottom: '10px', marginTop: '8px' }} />
          <textarea rows="3" defaultValue="เรียน อาจารย์ {teacher_name},&#10;&#10;คำร้องขอเช็คอินย้อนหลังของวิชา {course_code} วันที่ {teaching_date} ได้รับการอนุมัติเรียบร้อยแล้ว&#10;เหตุผลการอนุมัติ: {manager_note}"></textarea>
        </div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-end', gap: '6px' }}>
          <Settings size={16} /> บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
