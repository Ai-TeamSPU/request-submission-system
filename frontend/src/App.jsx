import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import StatsDashboard from './components/StatsDashboard';
import RequestForm from './components/RequestForm';
import RequestsTable from './components/RequestsTable';
import EmailAlerts from './components/EmailAlerts';
import ExcelImport from './components/ExcelImport';
import MasterData from './components/MasterData';
import SystemLogs from './components/SystemLogs';
import NoCheckinImport from './components/NoCheckinImport';
import CheckinList from './components/CheckinList';
import { api } from './utils/api';
import { isMenuAllowedForRole, getInitialMenuForRole, PAGE_TITLES } from './constants/roles';

export default function App() {
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [userFaculty, setUserFaculty] = useState('');
  const [activeMenu, setActiveMenu] = useState('checkin');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('rsms_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rsms_theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkSession = async () => {
      const savedEmail = localStorage.getItem('rsms_session_email');
      if (savedEmail) {
        setUserEmail(savedEmail);
        const res = await api.login(savedEmail);
        const userRole = res?.role || 'teacher';
        setRole(userRole);
        setUserFaculty(res?.faculty || '');
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

  const loadRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const data = await api.getRequests();
    setRequests(data);
    if (showLoading) setLoading(false);
  };

  const loadUsersList = async () => {
    const list = await api.getUsersList();
    setUsersList(list);
  };

  const handleUpdateUserRole = async (email, newRole, faculty) => {
    if (role !== 'admin') {
      alert('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนบทบาทผู้ใช้ได้');
      return;
    }
    const res = await api.updateUserRole(email, newRole, faculty);
    if (res.success) {
      if (email === userEmail) {
        setRole(newRole);
        setUserFaculty(faculty || '');
      }
      await loadUsersList();
    }
  };

  const handleComplete = async (id) => {
    if (role !== 'academic' && role !== 'admin') {
      alert('เฉพาะเจ้าหน้าที่วิชาการหรือผู้ดูแลระบบเท่านั้นที่สามารถยืนยันการเช็กอินได้');
      return;
    }
    const res = await api.completeRequest(id);
    if (res.success) await loadRequests();
  };

  const handleLogin = async (email) => {
    localStorage.setItem('rsms_session_email', email);
    setUserEmail(email);
    const res = await api.login(email);
    const userRole = res?.role || 'teacher';
    setRole(userRole);
    setUserFaculty(res?.faculty || '');
    setActiveMenu(getInitialMenuForRole(userRole));
    loadRequests();
  };

  const handleLogout = () => {
    localStorage.removeItem('rsms_session_email');
    setUserEmail('');
    setRole('teacher');
    setActiveMenu('checkin');
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleSubmitRequest = async (payload) => {
    if (role !== 'teacher' && role !== 'dean' && role !== 'admin') {
      alert('เฉพาะอาจารย์หรือผู้ดูแลระบบเท่านั้นที่สามารถยื่นคำร้องได้');
      return false;
    }
    try {
      const res = await api.submitRequest(payload);
      if (res.success) {
        loadRequests(false);
        return { requestId: res.requestId || '' };
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
    return false;
  };

  const handleApprove = async (id, note) => {
    if (role !== 'dean' && role !== 'admin') {
      alert('เฉพาะคณบดีหรือผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติได้');
      return;
    }
    const res = await api.updateRequestStatus(id, 'Approved', note, userEmail);
    if (res.success) await loadRequests();
  };

  const handleReject = async (id, note) => {
    if (role !== 'dean' && role !== 'admin') {
      alert('เฉพาะคณบดีหรือผู้ดูแลระบบเท่านั้นที่สามารถปฏิเสธได้');
      return;
    }
    const res = await api.updateRequestStatus(id, 'Rejected', note, userEmail);
    if (res.success) await loadRequests();
  };

  const handleBatchApprove = async (ids, note) => {
    if (role !== 'dean' && role !== 'admin') {
      alert('เฉพาะคณบดีหรือผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติได้');
      return;
    }
    const res = await api.batchUpdateStatus(ids, 'Approved', note, userEmail);
    if (res.success) await loadRequests();
    return res;
  };

  const handleBatchReject = async (ids, note) => {
    if (role !== 'dean' && role !== 'admin') {
      alert('เฉพาะคณบดีหรือผู้ดูแลระบบเท่านั้นที่สามารถปฏิเสธได้');
      return;
    }
    const res = await api.batchUpdateStatus(ids, 'Rejected', note, userEmail);
    if (res.success) await loadRequests();
    return res;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
          กำลังโหลดข้อมูล...
        </div>
      );
    }

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
      case 'checkin':
        return <RequestForm userEmail={userEmail} onSubmitSuccess={handleSubmitRequest} />;
      case 'my-requests':
        return <RequestsTable requests={requests} role="employee" userEmail={userEmail} />;
      case 'checkin-list':
        return <CheckinList onNavigateToCheckin={() => setActiveMenu('checkin')} />;
      case 'pending-approvals': {
        const pending = requests.filter(r => r.status === 'Pending');
        const filtered = (role === 'dean' && userFaculty)
          ? pending.filter(r => r.faculty === userFaculty)
          : pending;
        return (
          <RequestsTable
            requests={filtered}
            role="manager"
            userEmail={userEmail}
            onApprove={handleApprove}
            onReject={handleReject}
            onBatchApprove={handleBatchApprove}
            onBatchReject={handleBatchReject}
          />
        );
      }
      case 'approved-history': {
        const history = requests.filter(r => r.status !== 'Pending');
        const filtered = (role === 'dean' && userFaculty)
          ? history.filter(r => r.faculty === userFaculty)
          : history;
        return (
          <RequestsTable
            requests={filtered}
            role="viewer"
            userEmail={userEmail}
          />
        );
      }
      case 'approved-requests':
        return (
          <RequestsTable
            requests={requests.filter(r => r.status === 'Approved')}
            role="academic"
            userEmail={userEmail}
            onComplete={handleComplete}
          />
        );
      case 'email-alerts':
        return <EmailAlerts />;
      case 'overview':
        return <StatsDashboard requests={requests} />;
      case 'import-excel':
        return <ExcelImport />;
      case 'import-no-checkin':
        return <NoCheckinImport />;
      case 'master-data':
        return <MasterData usersList={usersList} onUpdateUserRole={handleUpdateUserRole} onUserAdded={loadUsersList} />;
      case 'system-logs':
        return <SystemLogs userEmail={userEmail} />;
      default:
        return <div>กรุณาเลือกเมนูการใช้งาน</div>;
    }
  };

  if (!userEmail) {
    return <LoginModal onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-to-content">ข้ามไปยังเนื้อหาหลัก</a>
      <Sidebar role={role} activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      <div className="content-layout">
        <Header email={userEmail} role={role} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
        <main id="main-content">
          <div className="page-title-bar">
            <h2>{PAGE_TITLES[activeMenu] || 'หน้าหลัก'}</h2>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
