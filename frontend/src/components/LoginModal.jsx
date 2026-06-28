import React, { useState } from 'react';
import { LogIn, Mail, Sun, Moon } from 'lucide-react';

export default function LoginModal({ onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('กรุณากรอกอีเมลของคุณ');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    setError('');
    onLogin(email);
  };

  return (
    <div className="login-backdrop">
      <button
        onClick={onToggleTheme}
        className="theme-toggle"
        style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1 }}
        aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="login-orb" style={{
        top: '-8%',
        left: '-6%',
        width: '420px',
        height: '420px',
        background: theme === 'light' ? 'hsla(217, 80%, 75%, 0.35)' : 'hsla(263, 70%, 25%, 0.35)',
      }} />
      <div className="login-orb" style={{
        bottom: '-10%',
        right: '-6%',
        width: '360px',
        height: '360px',
        background: theme === 'light' ? 'hsla(190, 70%, 75%, 0.25)' : 'hsla(190, 70%, 20%, 0.25)',
      }} />

      <div className="login-card-container">
        <div className="login-shadow-card" />

        <div className="login-card">
          <div className="login-inner">
            <div className="login-brand">
              <div className="login-brand-content">
                <img
                  src="/spu-logo-white.png"
                  alt="Sripatum University"
                  style={{
                    width: '110px',
                    height: 'auto',
                    marginBottom: '16px',
                    opacity: 0.9,
                  }}
                />
                <span className="login-chip">RSMS</span>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '10px',
                  textAlign: 'center',
                  lineHeight: '1.6',
                }}>
                  ระบบคำร้องขอ<br />เช็คอินย้อนหลัง
                </p>
              </div>
            </div>

            <div className="login-form-zone">
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '4px',
                letterSpacing: '-0.3px',
                color: 'var(--text-main)',
              }}>
                เข้าสู่ระบบ
              </h2>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '28px',
              }}>
                กรอกอีเมลเพื่อเข้าใช้งาน
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="login-email">อีเมลผู้ใช้งาน</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}>
                      <Mail size={16} />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="example@spu.ac.th"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <span className="login-error" style={{
                      display: 'block',
                      color: 'var(--color-danger)',
                      fontSize: '12px',
                      marginTop: '8px',
                      fontWeight: '500',
                    }}>
                      {error}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '8px', padding: '12px 20px' }}
                >
                  เข้าสู่ระบบ <LogIn size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
