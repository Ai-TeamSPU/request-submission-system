import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, User, BookOpen, Clock, Mail, Building2, ChevronLeft, ChevronRight, ClipboardList, Eye, Send } from 'lucide-react';
import { api } from '../utils/api';

const ITEMS_PER_PAGE = 6;

export default function CheckinList({ userEmail, role, userFaculty, onNavigateToCheckin }) {
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form states for modal
  const [date, setDate] = useState('');
  const [classroom, setClassroom] = useState('');
  const [problemType, setProblemType] = useState('ลืมเช็กอิน');
  const [reason, setReason] = useState('นำเข้าจากรายงานอาจารย์ไม่เช็คอิน');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [noCheckinData, coursesData] = await Promise.all([
          api.getNoCheckinRecords(role, userFaculty, userEmail),
          api.getCourses()
        ]);
        setRecords(Array.isArray(noCheckinData) ? noCheckinData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch {
        setRecords([]);
        setCourses([]);
      }
      setLoading(false);
    };
    load();
  }, [role, userFaculty, userEmail]);

  useEffect(() => {
    if (selectedRecord) {
      setDate(selectedRecord.date || '');
      setClassroom('');
      setProblemType('ลืมเช็กอิน');
      setReason('นำเข้าจากรายงานอาจารย์ไม่เช็คอิน');
    }
  }, [selectedRecord]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedRecord) setSelectedRecord(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedRecord]);

  const filtered = records.filter(r => {
    // 1. Filter by logged in user's email if they are a teacher
    if (role === 'teacher') {
      const recordEmail = (r.email || r.faculty?.email || '').toLowerCase().trim();
      const loginEmail = (userEmail || '').toLowerCase().trim();
      if (recordEmail !== loginEmail) return false;
    }

    // 2. Filter by faculty if they are a dean
    if (role === 'dean') {
      const recordFaculty = (r.faculty_col || '').toLowerCase().trim();
      const deanFaculty = (userFaculty || '').toLowerCase().trim();
      if (recordFaculty !== deanFaculty) return false;
    }

    // 2. Filter by search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const facultyName = r.faculty?.full_name_th || r.faculty?.name_th || '';
    return (
      (r.teacher_name || '').toLowerCase().includes(term) ||
      facultyName.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  function getDisplayName(r) {
    if (r.faculty_id && r.faculty) {
      return r.faculty.full_name_th || r.faculty.name_th;
    }
    return r.teacher_name;
  }

  function getDept(r) {
    if (r.faculty_id && r.faculty?.departments) {
      return r.faculty.departments.name_th;
    }
    return r.faculty_col || '-';
  }

  const getCourseName = (code) => {
    const course = courses.find(c => c.course_code === code);
    return course ? course.course_name : code || '-';
  };

  const handleSubmitRequest = async () => {
    if (!date) {
      alert('กรุณาเลือกวันที่สอน');
      return;
    }
    if (!classroom.trim()) {
      alert('กรุณากรอกห้องเรียน');
      return;
    }
    if (!reason.trim()) {
      alert('กรุณากรอกเหตุผลประกอบ');
      return;
    }

    setSubmitting(true);

    const payload = {
      email: selectedRecord.faculty?.email || selectedRecord.email || '',
      teacherName: getDisplayName(selectedRecord),
      faculty: selectedRecord.faculty_col || '',
      department: selectedRecord.faculty?.departments?.name_th || '-',
      courseCode: selectedRecord.course_code,
      courseName: getCourseName(selectedRecord.course_code),
      section: selectedRecord.section || '',
      date: date,
      timeRange: selectedRecord.time_range || '',
      classroom: classroom,
      problemType: problemType,
      reason: reason,
      attachmentName: '',
      attachmentData: '',
    };

    try {
      const res = await api.submitRequest(payload);
      if (res.success) {
        // Delete from no_checkin_records since it has been converted to a request
        await api.deleteNoCheckin(selectedRecord.id);
        alert('ส่งคำร้องสำเร็จเรียบร้อยแล้ว!');
        setSelectedRecord(null);
        // Reload records
        const data = await api.getNoCheckinRecords(role, userFaculty, userEmail);
        setRecords(Array.isArray(data) ? data : []);
      } else {
        alert('ไม่สามารถส่งคำร้องได้: ' + (res.error || 'เกิดข้อผิดพลาด'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
            รายชื่ออาจารย์ที่ไม่เช็คอิน
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({filtered.length} รายการ)</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่ออาจารย์..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-main)' }}
        />
      </div>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} style={{ opacity: 0.15, margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', fontWeight: '500' }}>
            {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ยังไม่มีข้อมูลอาจารย์ที่ไม่เช็คอิน'}
          </p>
        </div>
      ) : (
        <>
          <div className="checkin-card-grid">
            {paginated.map((r, i) => (
              <div
                key={r.id}
                className="glass-card checkin-card"
                style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                onClick={() => setSelectedRecord(r)}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: r.faculty_id
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <User size={16} color="#fff" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getDisplayName(r)}
                    </div>
                    {r.faculty_id && r.teacher_name !== (r.faculty?.name_th || '') && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.teacher_name}
                      </div>
                    )}
                  </div>
                  <Eye size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                {/* Card Body */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px' }}>{r.course_code || '-'}</span>
                    {r.section && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>กลุ่ม {r.section}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px' }}>{r.time_range || '-'}</span>
                  </div>

                  {(r.email || r.faculty?.email) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.faculty?.email || r.email}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getDept(r)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="checkin-pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', gap: '4px' }}
              >
                <ChevronLeft size={16} /> ก่อนหน้า
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(() => {
                  const maxVisible = 5;
                  let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
                  let end = start + maxVisible - 1;
                  if (end > totalPages) {
                    end = totalPages;
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  const pages = [];
                  if (start > 1) {
                    pages.push(
                      <button key={1} onClick={() => setCurrentPage(1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', minWidth: '38px' }}>1</button>
                    );
                    if (start > 2) pages.push(<span key="dots-start" style={{ padding: '6px 4px', color: 'var(--text-muted)', fontSize: '13px' }}>...</span>);
                  }
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button key={i} onClick={() => setCurrentPage(i)} className={`btn ${i === safePage ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '13px', minWidth: '38px' }}>{i}</button>
                    );
                  }
                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="dots-end" style={{ padding: '6px 4px', color: 'var(--text-muted)', fontSize: '13px' }}>...</span>);
                    pages.push(
                      <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', minWidth: '38px' }}>{totalPages}</button>
                    );
                  }
                  return pages;
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', gap: '4px' }}
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedRecord && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedRecord(null); }}>
          <div className="glass-panel animate-scale-in modal-content" role="dialog" aria-modal="true" aria-labelledby="checkin-detail-title">
            <h3 id="checkin-detail-title" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-main)' }}>
              <span>รายละเอียดการไม่เช็คอิน</span>
              <span className="badge badge-pending">ยังไม่ส่งคำร้อง</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ผู้สอน</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <User size={14} /> {getDisplayName(selectedRecord)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>อีเมล</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <Mail size={14} /> {selectedRecord.faculty?.email || selectedRecord.email || '-'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ต้นสังกัด / คณะ</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <Building2 size={14} /> {getDept(selectedRecord)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>รหัสวิชา / กลุ่มเรียน</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <BookOpen size={14} /> {selectedRecord.course_code || '-'} {selectedRecord.section ? `- กลุ่ม ${selectedRecord.section}` : ''}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>เวลาเรียน</span>
                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)' }}>
                  <Clock size={14} /> {selectedRecord.time_range || '-'}
                </span>
              </div>
              {selectedRecord.faculty_id && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>สถานะการจับคู่</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginTop: '4px', color: 'var(--color-success)' }}>
                    พบข้อมูลอาจารย์ในระบบ
                  </span>
                </div>
              )}
            </div>

            {selectedRecord.teacher_name && selectedRecord.faculty_id && selectedRecord.teacher_name !== (selectedRecord.faculty?.name_th || '') && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(138, 75, 243, 0.05)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ชื่อจากไฟล์ Excel</span>
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{selectedRecord.teacher_name}</span>
              </div>
            )}

            {/* Input fields for missing request details */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)' }}>ข้อมูลเพิ่มเติมสำหรับส่งคำร้อง</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>วันที่สอน *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ห้องเรียน *</label>
                  <input
                    type="text"
                    placeholder="เช่น 11-1002"
                    value={classroom}
                    onChange={e => setClassroom(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ประเภทปัญหา *</label>
                <select
                  value={problemType}
                  onChange={e => setProblemType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-main)' }}
                >
                  <option value="ลืมเช็กอิน">ลืมเช็กอิน</option>
                  <option value="เช็กอินไม่ได้เพราะระบบขัดข้อง">เช็กอินไม่ได้เพราะระบบขัดข้อง</option>
                  <option value="อินเทอร์เน็ต/อุปกรณ์มีปัญหา">อินเทอร์เน็ต/อุปกรณ์มีปัญหา</option>
                  <option value="ตารางสอนไม่ตรง">ตารางสอนไม่ตรง</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>เหตุผลประกอบ *</label>
                <textarea
                  rows={2}
                  placeholder="ระบุเหตุผลในการเช็กอินย้อนหลัง"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '20px' }}>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary" disabled={submitting}>ปิด</button>
              <button onClick={handleSubmitRequest} className="btn btn-primary" style={{ gap: '6px' }} disabled={submitting}>
                <Send size={16} /> {submitting ? 'กำลังส่ง...' : 'ส่งคำร้อง'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
