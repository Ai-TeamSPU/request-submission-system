import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import StatsDashboard from './components/StatsDashboard';
import RequestForm from './components/RequestForm';
import RequestsTable from './components/RequestsTable';
import { db } from './utils/database';
import { Mail, Check, AlertCircle, FileSpreadsheet, Upload, Plus, Database, Settings } from 'lucide-react';

export default function App() {
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('teacher'); // teacher, dean, director, admin
  const [activeMenu, setActiveMenu] = useState('checkin');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterTab, setMasterTab] = useState('users'); // users, faculties, problems
  const [usersList, setUsersList] = useState([]);

  // Helper to map emails to default roles
  const detectRole = (email) => {
    const emailLower = email.toLowerCase();
    if (emailLower.startsWith('admin')) return 'admin';
    if (emailLower.includes('dean')) return 'dean';
    if (emailLower.includes('academic') || emailLower.includes('vichakan')) {
      return 'academic';
    }
    if (emailLower.includes('director') || emailLower.includes('head') || emailLower.includes('group')) {
      return 'director';
    }
    return 'teacher';
  };

  // Helper to reset menu based on role
  const getInitialMenuForRole = (selectedRole) => {
    switch (selectedRole) {
      case 'dean':
        return 'pending-approvals';
      case 'director':
      case 'academic':
        return 'approved-requests';
      case 'admin':
        return 'overview';
      default:
        return 'checkin';
    }
  };

  const isMenuAllowedForRole = (menuId, userRole) => {
    const menuPermissions = {
      'checkin': ['teacher', 'admin'],
      'my-requests': ['teacher', 'admin'],
      'pending-approvals': ['dean', 'admin'],
      'approved-history': ['dean', 'admin'],
      'approved-requests': ['director', 'academic', 'admin'],
      'email-alerts': ['director', 'academic', 'admin'],
      'overview': ['admin'],
      'import-excel': ['admin'],
      'master-data': ['admin'],
      'system-logs': ['admin']
    };
    return menuPermissions[menuId]?.includes(userRole) || false;
  };

  // Check login state on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedEmail = localStorage.getItem('rsms_session_email');
      if (savedEmail) {
        setUserEmail(savedEmail);
        const res = await db.saveEmail(savedEmail);
        const userRole = res?.role || detectRole(savedEmail);
        setRole(userRole);
        setActiveMenu(getInitialMenuForRole(userRole));
      }
    };
    checkSession();
    loadRequests();
  }, []);

  useEffect(() => {
    if (activeMenu === 'master-data') {
      loadUsersList();
    }
  }, [activeMenu]);

  const loadRequests = async () => {
    setLoading(true);
    const data = await db.getRequests();
    setRequests(data);
    setLoading(false);
  };

  const loadUsersList = async () => {
    const list = await db.getUsersList();
    setUsersList(list);
  };

  const handleUpdateUserRole = async (email, newRole) => {
    if (role !== 'admin') {
      alert('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนบทบาทผู้ใช้ได้');
      return;
    }
    const res = await db.updateUserRole(email, newRole);
    if (res.success) {
      if (email === userEmail) {
        setRole(newRole);
      }
      await loadUsersList();
    }
  };

  const handleLogin = async (email) => {
    localStorage.setItem('rsms_session_email', email);
    setUserEmail(email);
    
    // Register email in db
    const res = await db.saveEmail(email);

    // Set role
    const userRole = res?.role || detectRole(email);
    setRole(userRole);
    setActiveMenu(getInitialMenuForRole(userRole));
    
    loadRequests();
  };

  const handleLogout = () => {
    localStorage.removeItem('rsms_session_email');
    setUserEmail('');
    setRole('teacher');
    setActiveMenu('checkin');
  };

  const handleSubmitRequest = async (payload) => {
    if (role !== 'teacher' && role !== 'admin') {
      alert('เฉพาะอาจารย์หรือผู้ดูแลระบบเท่านั้นที่สามารถยื่นคำร้องได้');
      return false;
    }
    const res = await db.submitRequest(payload);
    if (res.success) {
      await loadRequests();
      return true;
    }
    return false;
  };

  const handleApprove = async (id, note) => {
    if (role !== 'dean' && role !== 'admin') {
      alert('เฉพาะคณบดีหรือผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติได้');
      return;
    }
    const res = await db.updateRequestStatus(id, 'Approved', note);
    if (res.success) {
      await loadRequests();
    }
  };

  const handleReject = async (id, note) => {
    if (role !== 'dean' && role !== 'admin') {
      alert('เฉพาะคณบดีหรือผู้ดูแลระบบเท่านั้นที่สามารถปฏิเสธได้');
      return;
    }
    const res = await db.updateRequestStatus(id, 'Rejected', note);
    if (res.success) {
      await loadRequests();
    }
  };

  // Helper to translate active menu key to Thai page title
  const getPageTitle = () => {
    switch (activeMenu) {
      case 'checkin': return 'เช็คอิน / ยื่นคำร้อง';
      case 'my-requests': return 'คำขออนุมัติของฉัน';
      case 'pending-approvals': return 'คำขอที่รอการอนุมัติ';
      case 'approved-history': return 'ประวัติคำขอที่พิจารณาแล้ว';
      case 'approved-requests': return 'คำขอที่ได้รับการอนุมัติแล้ว';
      case 'email-alerts': return 'ตั้งค่าอีเมลแจ้งเตือน';
      case 'overview': return 'ภาพรวมสถิติระบบ';
      case 'import-excel': return 'นำเข้าข้อมูลด้วย Excel';
      case 'master-data': return 'การจัดการข้อมูลหลัก';
      case 'system-logs': return 'บันทึกการทำงานของระบบ';
      default: return 'หน้าหลัก';
    }
  };

  // --- MOCK PAGES ---

  // 1. Email Alerts Config
  const renderEmailAlerts = () => {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
          ✉️ แม่แบบอีเมลแจ้งเตือนผู้ใช้งาน (Email Template Configuration)
        </h2>
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
  };

  // 2. Excel Import
  const renderExcelImport = () => {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
          🟢 นำเข้าข้อมูลตารางสอน / รายชื่อผู้สอนผ่าน Excel
        </h2>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border-light)', cursor: 'pointer' }}>
          <Upload size={40} style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ fontWeight: '600', marginBottom: '6px' }}>ลากไฟล์ Excel (.xlsx, .xls) มาวางที่นี่</p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ (ขนาดไม่เกิน 10MB)</span>
        </div>
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>ประวัติการนำเข้าไฟล์ล่าสุด</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>ชื่อไฟล์</th>
                <th style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>วันที่นำเข้า</th>
                <th style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>จำนวนแถว</th>
                <th style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '10px 8px', fontSize: '13px' }}>class_schedule_term1_2026.xlsx</td>
                <td style={{ padding: '10px 8px', fontSize: '13px' }}>2026-06-25 09:15</td>
                <td style={{ padding: '10px 8px', fontSize: '13px' }}>148 แถว</td>
                <td style={{ padding: '10px 8px' }}><span className="badge badge-approved" style={{ fontSize: '10px' }}>สำเร็จ</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 3. Master Data
  const renderMasterData = () => {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
          🗃️ การจัดการข้อมูลหลักกลางของระบบ (Master Data Management)
        </h2>
        
        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <button 
            onClick={() => setMasterTab('users')}
            className={`btn ${masterTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            🌟 ข้อมูลผู้ใช้งานในระบบ
          </button>
          <button 
            onClick={() => setMasterTab('faculties')}
            className={`btn ${masterTab === 'faculties' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            🏫 รายชื่อคณะ
          </button>
          <button 
            onClick={() => setMasterTab('problems')}
            className={`btn ${masterTab === 'problems' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            ⚠️ ประเภทปัญหา
          </button>
        </div>

        {/* Tab Contents */}
        {masterTab === 'users' && (
          <div className="glass-card animate-fade-in">
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>การจัดการบทบาทและสิทธิ์ผู้ใช้งาน</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>อีเมลผู้ใช้</th>
                    <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>บทบาทปัจจุบัน</th>
                    <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>เปลี่ยนสิทธิ์การเข้าถึง</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '500' }}>{usr.email}</td>
                      <td style={{ padding: '12px 10px' }}>
                        {usr.role === 'admin' && '🔑 ผู้ดูแลระบบ (Admin)'}
                        {usr.role === 'dean' && '🏛️ คณบดี / ผอ.สำนักงานวิชาการ'}
                        {usr.role === 'director' && 'ผอ.สำนักงานวิชาการ / ผอ.กลุ่มงาน'}
                        {usr.role === 'academic' && '🎓 วิชาการ'}
                        {usr.role === 'teacher' && '🧑‍🏫 อาจารย์'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <select
                          value={usr.role}
                          onChange={(e) => handleUpdateUserRole(usr.email, e.target.value)}
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
                          <option value="teacher">🧑‍🏫 อาจารย์</option>
                          <option value="dean">🏛️ คณบดี / ผอ.สำนักงานวิชาการ</option>
                          <option value="director">ผอ.สำนักงานวิชาการ / ผอ.กลุ่มงาน</option>
                          <option value="academic">🎓 วิชาการ</option>
                          <option value="admin">🔑 ผู้ดูแลระบบ (Admin)</option>
                        </select>
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
  };

  // 4. System Audit Logs
  const renderSystemLogs = () => {
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
  };

  // Dynamic Content Render Selector
  const renderContent = () => {
    if (loading) {
      return (
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
          กำลังโหลดข้อมูล...
        </div>
      );
    }

    // Enforce role-based menu permissions check
    if (!isMenuAllowedForRole(activeMenu, role)) {
      return (
        <div className="glass-panel animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-danger)', marginBottom: '12px' }}>
            ⚠️ ปฏิเสธการเข้าถึง (Access Denied)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงเมนูหรือหน้าจอนี้ตามสิทธิ์การใช้งานปัจจุบัน
          </p>
        </div>
      );
    }

    switch (activeMenu) {
      // 1. อาจารย์
      case 'checkin':
        return <RequestForm userEmail={userEmail} onSubmitSuccess={handleSubmitRequest} />;
      case 'my-requests':
        return <RequestsTable requests={requests} role="employee" userEmail={userEmail} />;

      // 2. คณบดี / ผอ.
      case 'pending-approvals':
        return (
          <RequestsTable
            requests={requests.filter(r => r.status === 'Pending')}
            role="manager"
            userEmail={userEmail}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      case 'approved-history':
        return (
          <RequestsTable
            requests={requests.filter(r => r.status !== 'Pending')}
            role="viewer"
            userEmail={userEmail}
          />
        );

      // 3. ผอ.
      case 'approved-requests':
        return (
          <RequestsTable
            requests={requests.filter(r => r.status === 'Approved')}
            role="viewer"
            userEmail={userEmail}
          />
        );
      case 'email-alerts':
        return renderEmailAlerts();

      // 4. Admin
      case 'overview':
        return <StatsDashboard requests={requests} />;
      case 'import-excel':
        return renderExcelImport();
      case 'master-data':
        return renderMasterData();
      case 'system-logs':
        return renderSystemLogs();

      default:
        return <div>กรุณาเลือกเมนูการใช้งาน</div>;
    }
  };

  if (!userEmail) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      {/* Left Sidebar Navigation */}
      <Sidebar
        role={role}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
      />

      {/* Right Content Pane */}
      <div className="content-layout">
        {/* Top Header */}
        <Header
          email={userEmail}
          role={role}
          onLogout={handleLogout}
        />

        {/* Dynamic Inner Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>
            {getPageTitle()}
          </h2>
        </div>

        {/* Render Selected View */}
        {renderContent()}
      </div>
    </div>
  );
}
