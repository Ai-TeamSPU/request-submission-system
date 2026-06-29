import React from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { ROLE_LABELS } from '../constants/roles';

export default function Header({ email, role, onLogout, theme, onToggleTheme }) {
  const initials = email ? email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="glass-panel" style={{
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'var(--color-primary-subtle)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--color-primary)',
        }}>
          {initials}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', lineHeight: '1.3' }}>{email}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            {ROLE_LABELS[role] || role}
          </p>
        </div>
        <button
          onClick={onToggleTheme}
          className="theme-toggle"
          aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 4px' }} />
        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="ออกจากระบบ"
          aria-label="ออกจากระบบ"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
