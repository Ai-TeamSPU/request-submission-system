import React, { useState } from 'react';
import { LogIn, Mail } from 'lucide-react';

export default function LoginModal({ onLogin }) {
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '40px 30px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'var(--color-primary-glow)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          border: '1px solid var(--color-primary)'
        }}>
          <LogIn size={28} color="#fff" />
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>เข้าสู่ระบบคำร้องขอเช็คอินย้อนหลัง</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>
          ป้อนอีเมลของคุณเพื่อเริ่มต้นใช้งานระบบยื่นคำร้องและจัดการเคสเช็คอินย้อนหลัง (RSMS)
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
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
                alignItems: 'center'
              }}>
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                placeholder="example@university.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            {error && (
              <span style={{
                display: 'block',
                color: 'var(--color-danger)',
                fontSize: '12px',
                marginTop: '6px',
                fontWeight: '500'
              }}>
                {error}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '10px' }}>
            เข้าสู่ระบบ <LogIn size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
