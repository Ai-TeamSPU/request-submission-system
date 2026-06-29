import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Filter,
  Download, Eye, X, User, Calendar, MapPin, ChevronLeft,
  ChevronRight, Search, BarChart3, Table2
} from 'lucide-react';
import { api } from '../utils/api';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const STATUS_COLORS = {
  Pending:   { bg: 'hsl(40, 95%, 55%)',  border: 'rgba(245, 165, 36, 0.5)' },
  Approved:  { bg: 'hsl(145, 80%, 45%)', border: 'rgba(23, 201, 100, 0.5)' },
  Rejected:  { bg: 'hsl(355, 85%, 55%)', border: 'rgba(243, 18, 96, 0.5)' },
  Completed: { bg: 'hsl(217, 90%, 55%)', border: 'rgba(59, 130, 246, 0.5)' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'Pending', label: 'รออนุมัติ' },
  { value: 'Approved', label: 'อนุมัติแล้ว' },
  { value: 'Rejected', label: 'ปฏิเสธ' },
  { value: 'Completed', label: 'เช็กอินเรียบร้อย' },
];

const STATUS_LABELS = {
  Pending: 'รออนุมัติ',
  Approved: 'อนุมัติแล้ว',
  Rejected: 'ปฏิเสธ',
  Completed: 'เช็กอินเรียบร้อย',
};

const PAGE_SIZE = 15;

export default function StatsDashboard({ requests }) {
  const [faculties, setFaculties] = useState([]);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchCourse, setSearchCourse] = useState('');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const nameRef = useRef(null);
  const courseRef = useRef(null);
  const [showTable, setShowTable] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedReq) setSelectedReq(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedReq]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.getFaculties().then(setFaculties).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = requests;
    if (filterFaculty) result = result.filter(r => r.faculty === filterFaculty);
    if (filterStatus) result = result.filter(r => r.status === filterStatus);
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      result = result.filter(r => r.teacherName?.toLowerCase().includes(q));
    }
    if (searchCourse.trim()) {
      const q = searchCourse.trim().toLowerCase();
      result = result.filter(r =>
        r.courseCode?.toLowerCase().includes(q) || r.courseName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [requests, filterFaculty, filterStatus, searchName, searchCourse]);

  const nameSuggestions = useMemo(() => {
    const unique = [...new Set(requests.map(r => r.teacherName).filter(Boolean))].sort();
    if (!searchName.trim()) return unique;
    const q = searchName.trim().toLowerCase();
    return unique.filter(n => n.toLowerCase().includes(q));
  }, [requests, searchName]);

  const courseSuggestions = useMemo(() => {
    const map = new Map();
    requests.forEach(r => {
      if (r.courseCode && !map.has(r.courseCode)) {
        map.set(r.courseCode, r.courseName || '');
      }
    });
    const all = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (!searchCourse.trim()) return all;
    const q = searchCourse.trim().toLowerCase();
    return all.filter(([code, name]) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q));
  }, [requests, searchCourse]);

  useEffect(() => {
    const handleClick = (e) => {
      if (nameRef.current && !nameRef.current.contains(e.target)) setShowNameDropdown(false);
      if (courseRef.current && !courseRef.current.contains(e.target)) setShowCourseDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterFaculty, filterStatus, searchName, searchCourse]);

  const total = filtered.length;
  const approved = filtered.filter(r => r.status === 'Approved').length;
  const rejected = filtered.filter(r => r.status === 'Rejected').length;
  const pending = filtered.filter(r => r.status === 'Pending').length;
  const completed = filtered.filter(r => r.status === 'Completed').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const chartData = {
    labels: ['อนุมัติแล้ว', 'ปฏิเสธ', 'รออนุมัติ', 'เช็กอินเรียบร้อย'],
    datasets: [{
      data: [approved, rejected, pending, completed],
      backgroundColor: [
        'hsl(145, 80%, 45%)',
        'hsl(355, 85%, 55%)',
        'hsl(40, 95%, 55%)',
        'hsl(217, 90%, 55%)',
      ],
      borderColor: [
        'rgba(23, 201, 100, 0.5)',
        'rgba(243, 18, 96, 0.5)',
        'rgba(245, 165, 36, 0.5)',
        'rgba(59, 130, 246, 0.5)',
      ],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#fff',
          font: { family: 'Sarabun, sans-serif', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label(context) {
            const val = context.raw || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${val} เคส (${pct}%)`;
          },
        },
      },
    },
  };

  const facultyBarData = useMemo(() => {
    const source = filterFaculty ? filtered : requests.filter(r => !filterStatus || r.status === filterStatus);
    const allFaculties = [...new Set(requests.map(r => r.faculty).filter(Boolean))].sort();

    if (filterStatus) {
      const counts = {};
      allFaculties.forEach(f => { counts[f] = 0; });
      source.forEach(r => { if (r.faculty) counts[r.faculty] = (counts[r.faculty] || 0) + 1; });
      const labels = allFaculties.filter(f => counts[f] > 0);
      return {
        labels,
        datasets: [{
          label: STATUS_LABELS[filterStatus],
          data: labels.map(f => counts[f]),
          backgroundColor: STATUS_COLORS[filterStatus].bg,
          borderColor: STATUS_COLORS[filterStatus].border,
          borderWidth: 1,
          borderRadius: 4,
        }],
      };
    }

    const statuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
    const countMap = {};
    allFaculties.forEach(f => {
      countMap[f] = { Pending: 0, Approved: 0, Rejected: 0, Completed: 0 };
    });
    requests.forEach(r => {
      if (r.faculty && countMap[r.faculty]) countMap[r.faculty][r.status]++;
    });
    const labels = allFaculties.filter(f => statuses.some(s => countMap[f][s] > 0));
    return {
      labels,
      datasets: statuses.map(s => ({
        label: STATUS_LABELS[s],
        data: labels.map(f => countMap[f][s]),
        backgroundColor: STATUS_COLORS[s].bg,
        borderColor: STATUS_COLORS[s].border,
        borderWidth: 1,
        borderRadius: 4,
      })),
    };
  }, [requests, filtered, filterFaculty, filterStatus]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: !filterStatus,
        ticks: { color: 'rgba(255,255,255,0.6)', font: { family: 'Sarabun, sans-serif', size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        stacked: !filterStatus,
        beginAtZero: true,
        ticks: {
          color: 'rgba(255,255,255,0.6)',
          font: { family: 'Sarabun, sans-serif', size: 11 },
          stepSize: 1,
          callback: (v) => Number.isInteger(v) ? v : '',
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    plugins: {
      legend: {
        display: !filterStatus,
        position: 'top',
        labels: { color: '#fff', font: { family: 'Sarabun, sans-serif', size: 12 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label(context) {
            return ` ${context.dataset.label}: ${context.raw} เคส`;
          },
        },
      },
    },
  };

  const getStatusBadge = (status) => {
    const map = {
      Approved: { cls: 'badge-approved', label: 'อนุมัติแล้ว' },
      Completed: { cls: 'badge-completed', label: 'เช็กอินเรียบร้อย' },
      Rejected: { cls: 'badge-rejected', label: 'ปฏิเสธ' },
      Pending: { cls: 'badge-pending', label: 'รออนุมัติ' },
    };
    const s = map[status] || map.Pending;
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const exportCSV = () => {
    const BOM = '﻿';
    const headers = ['รหัสคำขอ', 'ผู้สอน', 'อีเมล', 'คณะ', 'รหัสวิชา', 'ชื่อวิชา', 'กลุ่ม', 'วันที่สอน', 'คาบเรียน', 'ห้องเรียน', 'ประเภทปัญหา', 'สถานะ', 'ผู้อนุมัติ', 'วันที่ยื่น'];
    const rows = filtered.map(r => [
      r.id,
      r.teacherName,
      r.email,
      r.faculty,
      r.courseCode,
      r.courseName,
      r.section,
      r.date,
      r.timeRange,
      r.classroom,
      r.problemType,
      STATUS_LABELS[r.status] || r.status,
      r.approvedBy || '-',
      r.submittedDate,
    ]);

    const escape = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csv = BOM + [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10);
    a.download = `requests-overview-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = (v) => total > 0 ? Math.round((v / total) * 100) : 0;

  const hasActiveFilters = filterFaculty || filterStatus || searchName || searchCourse;

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-main)',
    fontSize: '13px',
    outline: 'none',
    minWidth: '180px',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Filters ── */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px', position: 'relative', zIndex: 10 }}>
        <div className="dash-section-header">
          <Filter size={16} color="var(--color-primary)" />
          <h2>ตัวกรองข้อมูล</h2>
          {hasActiveFilters && <span className="dash-section-subtitle">{filtered.length} รายการ</span>}
        </div>

        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {filterFaculty && <span className="filter-chip">{filterFaculty}</span>}
            {filterStatus && <span className="filter-chip">{STATUS_LABELS[filterStatus]}</span>}
            {searchName && <span className="filter-chip">{searchName}</span>}
            {searchCourse && <span className="filter-chip">{searchCourse}</span>}
            <button
              onClick={() => { setFilterFaculty(''); setFilterStatus(''); setSearchName(''); setSearchCourse(''); }}
              className="btn btn-secondary"
              style={{ padding: '3px 10px', fontSize: '11px', gap: '3px', borderRadius: '14px' }}
            >
              <X size={12} /> ล้าง
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>คณะ / วิทยาลัย</label>
            <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)} style={selectStyle}>
              <option value="">ทุกคณะ</option>
              {faculties.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>สถานะ</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} ref={nameRef}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>ชื่อผู้สอน</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                type="text"
                value={searchName}
                onChange={e => { setSearchName(e.target.value); setShowNameDropdown(true); }}
                onFocus={() => setShowNameDropdown(true)}
                placeholder="พิมพ์ชื่อค้นหา..."
                style={{ ...selectStyle, paddingLeft: '30px', minWidth: '200px' }}
              />
              {showNameDropdown && nameSuggestions.length > 0 && (
                <div style={dropdownStyle}>
                  {nameSuggestions.slice(0, 8).map(name => (
                    <div
                      key={name}
                      onClick={() => { setSearchName(name); setShowNameDropdown(false); }}
                      style={dropdownItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,75,243,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <User size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span>{name}</span>
                    </div>
                  ))}
                  {nameSuggestions.length > 8 && (
                    <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      ...อีก {nameSuggestions.length - 8} รายการ
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} ref={courseRef}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>รหัส / ชื่อวิชา</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                type="text"
                value={searchCourse}
                onChange={e => { setSearchCourse(e.target.value); setShowCourseDropdown(true); }}
                onFocus={() => setShowCourseDropdown(true)}
                placeholder="พิมพ์รหัสหรือชื่อวิชา..."
                style={{ ...selectStyle, paddingLeft: '30px', minWidth: '220px' }}
              />
              {showCourseDropdown && courseSuggestions.length > 0 && (
                <div style={dropdownStyle}>
                  {courseSuggestions.slice(0, 8).map(([code, name]) => (
                    <div
                      key={code}
                      onClick={() => { setSearchCourse(code); setShowCourseDropdown(false); }}
                      style={dropdownItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,75,243,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: '600', flexShrink: 0 }}>{code}</span>
                      {name && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>— {name}</span>}
                    </div>
                  ))}
                  {courseSuggestions.length > 8 && (
                    <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      ...อีก {courseSuggestions.length - 8} รายการ
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards + Chart ── */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="dash-section-header">
          <BarChart3 size={16} color="var(--color-primary)" />
          <h2>สรุปสถิติ</h2>
          {filterFaculty && <span className="dash-section-subtitle">{filterFaculty}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="glass-card stat-card stat-card--primary dash-stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>คำขอทั้งหมด</span>
                <ClipboardList size={16} color="var(--color-primary)" />
              </div>
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px', lineHeight: 1 }}>{total}</span>
            </div>
            <div className="glass-card stat-card stat-card--warning dash-stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>รออนุมัติ</span>
                <Clock size={16} color="var(--color-warning)" />
              </div>
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-warning)', letterSpacing: '-1px', lineHeight: 1 }}>{pending}</span>
              <span className="stat-pct">{pct(pending)}%</span>
            </div>
            <div className="glass-card stat-card stat-card--success dash-stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>อนุมัติแล้ว</span>
                <CheckCircle2 size={16} color="var(--color-success)" />
              </div>
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-success)', letterSpacing: '-1px', lineHeight: 1 }}>{approved}</span>
              <span className="stat-pct">{pct(approved)}%</span>
            </div>
            <div className="glass-card stat-card stat-card--danger dash-stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>ปฏิเสธ</span>
                <XCircle size={16} color="var(--color-danger)" />
              </div>
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-danger)', letterSpacing: '-1px', lineHeight: 1 }}>{rejected}</span>
              <span className="stat-pct">{pct(rejected)}%</span>
            </div>
          </div>

          <div className="glass-card dash-stagger-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '230px', padding: '16px' }}>
            {total > 0 ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Pie data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                <ClipboardList size={28} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: '12px' }}>ไม่มีข้อมูลเพียงพอสำหรับแสดงแผนภูมิ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Faculty Bar Chart ── */}
      {facultyBarData.labels.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
          <div className="dash-section-header">
            <BarChart3 size={16} color="var(--color-primary)" />
            <h2>จำนวนคำร้องแยกตามคณะ</h2>
            {filterStatus && <span className="dash-section-subtitle">{STATUS_LABELS[filterStatus]}</span>}
          </div>
          <div style={{ height: Math.max(280, facultyBarData.labels.length * 40), position: 'relative' }}>
            <Bar data={facultyBarData} options={barOptions} />
          </div>
        </div>
      )}

      {/* ── Data Table + Export ── */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <div className="dash-section-header" style={{ marginBottom: '16px' }}>
          <Table2 size={16} color="var(--color-primary)" />
          <h2>ข้อมูลคำร้อง</h2>
          <span className="dash-section-subtitle">{filtered.length} รายการ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showTable ? '16px' : '0', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={() => setShowTable(v => !v)}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
          >
            <Eye size={15} />
            {showTable ? 'ซ่อนตาราง' : 'ดูข้อมูลคำร้อง'}
          </button>
          <button
            onClick={exportCSV}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
            disabled={filtered.length === 0}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        {showTable && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={thStyle}>รหัสคำขอ</th>
                    <th style={thStyle}>ผู้สอน</th>
                    <th style={thStyle}>คณะ</th>
                    <th style={thStyle}>วิชา / กลุ่ม</th>
                    <th style={thStyle}>วันที่สอน</th>
                    <th style={thStyle}>สถานะ</th>
                    <th style={thStyle}>ผู้อนุมัติ</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedData.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="empty-state">
                          <ClipboardList size={32} style={{ opacity: 0.3 }} />
                          <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                        </div>
                      </td>
                    </tr>
                  ) : pagedData.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                      <td style={tdStyle}><span style={{ fontWeight: '600' }}>{req.id}</span></td>
                      <td style={tdStyle}>
                        <div>{req.teacherName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '12px' }}>{req.faculty}</span>
                      </td>
                      <td style={tdStyle}>
                        <div>{req.courseCode}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.section}</div>
                      </td>
                      <td style={tdStyle}>{req.date}</td>
                      <td style={tdStyle}>{getStatusBadge(req.status)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '12px', color: req.approvedBy ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {req.approvedBy || '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px', gap: '4px' }}
                        >
                          <Eye size={13} /> ดู
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  หน้า {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedReq(null); }}>
          <div className="glass-panel animate-scale-in modal-content" role="dialog" aria-modal="true" aria-labelledby="stats-detail-title">
            <h3 id="stats-detail-title" style={{
              fontSize: '18px', fontWeight: '700', marginBottom: '20px',
              borderBottom: '1px solid var(--border-light)', paddingBottom: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: 'var(--text-main)',
            }}>
              <span>รายละเอียดคำขอ: {selectedReq.id}</span>
              {getStatusBadge(selectedReq.status)}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ผู้สอน / อีเมล</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <User size={14} /> {selectedReq.teacherName} ({selectedReq.email})
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>คณะ / วิทยาลัย</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginTop: '4px', color: 'var(--text-main)' }}>
                  {selectedReq.faculty}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>รายวิชา / กลุ่มเรียน</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginTop: '4px', color: 'var(--text-main)' }}>
                  {selectedReq.courseCode} ({selectedReq.courseName}) - {selectedReq.section}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>วันที่สอน / คาบเรียน / ห้องเรียน</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <Calendar size={14} /> {selectedReq.date} ({selectedReq.timeRange}) <MapPin size={14} /> {selectedReq.classroom}
                </span>
              </div>
            </div>

            {selectedReq.approvedBy && (selectedReq.status === 'Approved' || selectedReq.status === 'Completed' || selectedReq.status === 'Rejected') && (
              <div style={{
                marginBottom: '20px', padding: '12px',
                background: selectedReq.status === 'Rejected' ? 'rgba(243,18,96,0.05)' : 'rgba(23,201,100,0.05)',
                borderRadius: '8px',
                border: `1px solid ${selectedReq.status === 'Rejected' ? 'rgba(243,18,96,0.2)' : 'rgba(23,201,100,0.2)'}`,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <User size={16} style={{ color: selectedReq.status === 'Rejected' ? 'hsl(355,85%,65%)' : 'hsl(145,80%,65%)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  {selectedReq.status === 'Rejected' ? 'พิจารณาโดย: ' : 'อนุมัติโดย: '}
                  <strong>{selectedReq.approvedBy}</strong>
                </span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ประเภทปัญหา</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)', display: 'block', marginTop: '4px' }}>
                {selectedReq.problemType}
              </span>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>เหตุผลประกอบ</span>
              <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>{selectedReq.reason}</p>
            </div>

            {selectedReq.managerNote && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ความคิดเห็นประกอบการพิจารณา</span>
                <div style={{
                  padding: '12px', borderRadius: '8px', fontSize: '13px',
                  background: selectedReq.status === 'Approved' || selectedReq.status === 'Completed'
                    ? 'rgba(23,201,100,0.05)' : 'rgba(243,18,96,0.05)',
                  border: `1px solid ${selectedReq.status === 'Approved' || selectedReq.status === 'Completed'
                    ? 'rgba(23,201,100,0.2)' : 'rgba(243,18,96,0.2)'}`,
                  color: selectedReq.status === 'Approved' || selectedReq.status === 'Completed'
                    ? 'hsl(145,80%,75%)' : 'hsl(355,85%,75%)',
                }}>
                  {selectedReq.managerNote}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setSelectedReq(null)} className="btn btn-secondary">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' };
const tdStyle = { padding: '12px 8px', fontSize: '13px', color: 'var(--text-main)' };

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '4px',
  background: 'hsl(230, 25%, 14%)',
  border: '1px solid var(--border-light)',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  zIndex: 50,
  maxHeight: '240px',
  overflowY: 'auto',
  padding: '4px',
};

const dropdownItemStyle = {
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--text-main)',
  cursor: 'pointer',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background 0.15s',
};
