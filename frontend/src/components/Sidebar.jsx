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
      { id: 'checkin', name: 'กรอกข้อมูลการ Checkin ย้อนหลัง', icon: CheckSquare },
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
      { id: 'import-no-checkin', name: 'นำเข้าข้อมูลอาจารย์ที่ไม่เช็คอิน', icon: FileSpreadsheet },
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

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {MENU_CATEGORIES.map((cat, catIdx) => {
          if (!cat.roles.includes(role)) return null;

          const visibleCats = MENU_CATEGORIES.filter(c => c.roles.includes(role));
          const isLast = visibleCats[visibleCats.length - 1] === cat;

          return (
            <React.Fragment key={catIdx}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: catIdx > 0 ? '4px' : '0' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  paddingLeft: '12px',
                  marginBottom: '6px',
                  opacity: 0.7
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
                      aria-current={isActive ? 'page' : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '9px 12px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                        textAlign: 'left',
                        position: 'relative',
                      }}
                    >
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: '0',
                          top: '20%',
                          height: '60%',
                          width: '3px',
                          borderRadius: '0 3px 3px 0',
                          background: 'var(--color-primary)',
                          transition: 'all 0.2s ease',
                        }} />
                      )}
                      <IconComponent size={16} style={{
                        color: isActive ? 'var(--color-primary)' : 'inherit',
                        flexShrink: 0,
                        transition: 'color 0.2s ease',
                      }} />
                      {item.name}
                    </button>
                  );
                })}
              </div>
              {!isLast && <div className="section-divider" />}
            </React.Fragment>
          );
        })}
      </nav>

      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-light)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '0.3px' }}>
          RSMS v1.0
        </p>
      </div>
    </aside>
  );
}
