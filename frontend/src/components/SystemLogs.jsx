import React from 'react';

export default function SystemLogs({ userEmail }) {
  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        📜 บันทึกกิจกรรมระบบย้อนหลัง (System Audit Logs)
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>วันเวลา</th>
              <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>ประเภท</th>
              <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>ผู้ใช้งาน</th>
              <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>กิจกรรม</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
              <td style={{ padding: '12px 10px' }}>2026-06-26 10:45:12</td>
              <td style={{ padding: '12px 10px' }}><span className="badge badge-approved" style={{ fontSize: '10px' }}>SYSTEM</span></td>
              <td style={{ padding: '12px 10px' }}>Database Connection</td>
              <td style={{ padding: '12px 10px' }}>Supabase client initialized successfully.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
              <td style={{ padding: '12px 10px' }}>2026-06-26 10:48:25</td>
              <td style={{ padding: '12px 10px' }}><span className="badge badge-pending" style={{ fontSize: '10px' }}>AUTH</span></td>
              <td style={{ padding: '12px 10px' }}>{userEmail}</td>
              <td style={{ padding: '12px 10px' }}>User logged into system successfully.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
