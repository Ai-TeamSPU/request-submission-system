import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ROLE_LABELS_FULL } from '../constants/roles';
import { api } from '../utils/api';

export default function MasterData({ usersList, onUpdateUserRole, onUserAdded }) {
  const [masterTab, setMasterTab] = useState('users');
  const [faculties, setFaculties] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('teacher');
  const [newFaculty, setNewFaculty] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    api.getFaculties().then(data => {
      setFaculties(Array.isArray(data) ? data : []);
    });
  }, []);

  const handleAddUser = async () => {
    if (!newEmail.trim()) {
      setAddError('กรุณากรอกอีเมล');
      return;
    }
    setAddError('');
    setAddLoading(true);
    try {
      const res = await api.addUser(newEmail.trim(), newRole, newRole === 'dean' ? newFaculty : '');
      if (res.success) {
        setNewEmail('');
        setNewRole('teacher');
        setNewFaculty('');
        setShowAddForm(false);
        if (onUserAdded) onUserAdded();
      }
    } catch (err) {
      setAddError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setAddLoading(false);
    }
  };

  const TABS = [
    { id: 'users', label: '🌟 ข้อมูลผู้ใช้งานในระบบ' },
    { id: 'faculties', label: '🏫 รายชื่อคณะ' },
    { id: 'problems', label: '⚠️ ประเภทปัญหา' },
  ];

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        🗃️ การจัดการข้อมูลหลักกลางของระบบ (Master Data Management)
      </h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMasterTab(tab.id)}
            className={`btn ${masterTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {masterTab === 'users' && (
        <div className="glass-card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>การจัดการบทบาทและสิทธิ์ผู้ใช้งาน</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`btn ${showAddForm ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '6px 14px', fontSize: '12px', gap: '6px' }}
            >
              <Plus size={14} /> {showAddForm ? 'ยกเลิก' : 'เพิ่มผู้ใช้งาน'}
            </button>
          </div>

          {showAddForm && (
            <div style={{
              padding: '16px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>อีเมลผู้ใช้ *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setAddError(''); }}
                    placeholder="example@spu.ac.th"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>บทบาท *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#000' }}
                  >
                    {Object.entries(ROLE_LABELS_FULL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {newRole === 'dean' ? (
                    <>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>คณะที่ดูแล</label>
                      <select
                        value={newFaculty}
                        onChange={(e) => setNewFaculty(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#000' }}
                      >
                        <option value="">-- เลือกคณะ --</option>
                        {faculties.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <button
                      onClick={handleAddUser}
                      disabled={addLoading}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                    >
                      {addLoading ? 'กำลังเพิ่ม...' : 'บันทึก'}
                    </button>
                  )}
                </div>
              </div>
              {newRole === 'dean' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleAddUser}
                    disabled={addLoading}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '12px' }}
                  >
                    {addLoading ? 'กำลังเพิ่ม...' : 'บันทึก'}
                  </button>
                </div>
              )}
              {addError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: '500' }}>{addError}</span>}
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>อีเมลผู้ใช้</th>
                  <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>บทบาทปัจจุบัน</th>
                  <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>เปลี่ยนสิทธิ์การเข้าถึง</th>
                  <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>คณะที่ดูแล</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr) => (
                  <tr key={usr.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '500' }}>{usr.email}</td>
                    <td style={{ padding: '12px 10px' }}>{ROLE_LABELS_FULL[usr.role] || usr.role}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <select
                        value={usr.role}
                        onChange={(e) => onUpdateUserRole(usr.email, e.target.value, usr.faculty)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          color: '#000000',
                          maxWidth: '220px',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        {Object.entries(ROLE_LABELS_FULL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {usr.role === 'dean' ? (
                        <select
                          value={usr.faculty || ''}
                          onChange={(e) => onUpdateUserRole(usr.email, usr.role, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            color: '#000000',
                            maxWidth: '220px',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          <option value="">-- เลือกคณะ --</option>
                          {faculties.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {masterTab === 'faculties' && (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>รายชื่อคณะวิทยาลัยในระบบ</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}><Plus size={12} /> เพิ่ม</button>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>คณะวิทยาศาสตร์</li>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>คณะครุศาสตร์</li>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>คณะวิศวกรรมศาสตร์</li>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>คณะบริหารธุรกิจ</li>
          </ul>
        </div>
      )}

      {masterTab === 'problems' && (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>ประเภทข้อบกพร่อง/ปัญหา</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}><Plus size={12} /> เพิ่ม</button>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>ลืมเช็กอิน</li>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>เช็กอินไม่ได้เพราะระบบขัดข้อง</li>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>อินเทอร์เน็ต/อุปกรณ์มีปัญหา</li>
            <li style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>ตารางสอนไม่ตรง</li>
          </ul>
        </div>
      )}
    </div>
  );
}
