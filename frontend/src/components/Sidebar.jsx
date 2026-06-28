import React from 'react';
import {
  CheckSquare, ClipboardList, Clock, CheckCircle2,
  BookOpen, Mail, LayoutDashboard, FileSpreadsheet,
  Database, Scroll, Shield
} from 'lucide-react';

const MENU_CATEGORIES = [
  {
    title: 'อาจารย์',
    roles: ['teacher', 'dean', 'admin'],
    items: [
      { id: 'checkin', name: 'เช็คอิน', icon: CheckSquare },
      { id: 'my-requests', name: 'คำขออนุมัติของฉัน', icon: ClipboardList },
    ],
  },
  {
    title: 'คณบดี',
    roles: ['dean', 'admin'],
    items: [
      { id: 'pending-approvals', name: 'รออนุมัติ', icon: Clock },
      { id: 'approved-history', name: 'ประวัติคำขอที่อนุมัติ', icon: CheckCircle2 },
    ],
  },
  {
    title: 'ผอ.สำนักงานวิชาการ / ผอ.กลุ่มงาน / วิชาการ',
    roles: ['director', 'academic', 'admin'],
    items: [
      { id: 'approved-requests', name: 'คำขอที่อนุมัติเเล้ว', icon: BookOpen },
      { id: 'overview', name: 'ภาพรวม', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Admin',
    roles: ['admin'],
    items: [
      { id: 'email-alerts', name: 'อีเมลเเจ้งเตือน', icon: Mail },
      { id: 'import-excel', name: 'นำเข้า Excel', icon: FileSpreadsheet },
      { id: 'master-data', name: 'ข้อมูลหลัก', icon: Database },
      { id: 'system-logs', name: 'บันทึกระบบ', icon: Scroll },
    ],
  },
];

export default function Sidebar({ role, activeMenu, onMenuChange }) {
  return (
    <aside className="glass-panel sidebar" style={{
      width: '280px',
      minWidth: '280px',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 48px)',
      position: 'sticky',
      top: '24px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', paddingLeft: '8px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(138, 75, 243, 0.3)'
        }}>
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
            RSMS
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Case Management System
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {MENU_CATEGORIES.map((cat, catIdx) => {
          if (!cat.roles.includes(role)) return null;

          return (
            <div key={catIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                paddingLeft: '12px',
                marginBottom: '4px'
              }}>
                {cat.title}
              </span>
              {cat.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeMenu === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onMenuChange(item.id)}
                    className="sidebar-menu-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isActive ? 'var(--color-primary-glow)' : 'transparent',
                      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                      borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                      borderTopLeftRadius: isActive ? '0' : '8px',
                      borderBottomLeftRadius: isActive ? '0' : '8px',
                      textAlign: 'left'
                    }}
                  >
                    <IconComponent size={16} style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
