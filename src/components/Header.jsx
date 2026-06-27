import React from 'react';
import { LogOut, User, UserCheck, ShieldAlert } from 'lucide-react';

export default function Header({ email, role, onLogout }) {
  return (
    <header className="glass-panel" style={{
      padding: '16px 24px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(138, 75, 243, 0.3)'
        }}>
          <UserCheck size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
            RSMS
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ระบบคำร้องขอเช็คอินย้อนหลัง
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {/* User Profile and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>{email}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              สิทธิ์การใช้งาน: {role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : role === 'dean' ? 'คณบดี' : role === 'director' ? 'ผอ.สำนักงานวิชาการ' : role === 'academic' ? 'วิชาการ' : 'อาจารย์ (ผู้สอน)'}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-secondary"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="ออกจากระบบ"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
