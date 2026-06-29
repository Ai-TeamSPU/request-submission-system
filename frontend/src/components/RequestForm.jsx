import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, Upload, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

const PROBLEM_TYPES = [
  'ลืมเช็กอิน',
  'เช็กอินไม่ได้เพราะระบบขัดข้อง',
  'อินเทอร์เน็ต/อุปกรณ์มีปัญหา',
  'ตารางสอนไม่ตรง',
  'อื่น ๆ'
];

export default function RequestForm({ userEmail, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    teacherName: '',
    faculty: '',
    courseCode: '',
    section: '',
    date: '',
    startTime: '',
    endTime: '',
    classroom: '',
    problemType: '',
    reason: '',
  });

  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submittedReqId, setSubmittedReqId] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const closeSuccessPopup = useCallback(() => setShowSuccessPopup(false), []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSuccessPopup) closeSuccessPopup();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSuccessPopup, closeSuccessPopup]);

  useEffect(() => {
    const fetchData = async () => {
      const [fList, cList, tList] = await Promise.all([
        api.getFaculties(),
        api.getCourses().catch(() => []),
        api.getTeachers().catch(() => []),
      ]);
      setFaculties(fList);
      setCourses(Array.isArray(cList) ? cList : []);
      setTeachers(Array.isArray(tList) ? tList : []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    const fetchProfile = async () => {
      try {
        const profile = await api.getFacultyByEmail(userEmail);
        if (profile.found) {
          setFormData(prev => ({
            ...prev,
            teacherName: profile.teacherName || prev.teacherName,
            faculty: profile.department || prev.faculty,
          }));
        }
      } catch {}
    };
    fetchProfile();
  }, [userEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.teacherName.trim()) newErrors.teacherName = 'กรุณากรอกชื่อผู้สอน';
    if (!formData.faculty.trim()) newErrors.faculty = 'กรุณาเลือกคณะ / วิทยาลัย';
    if (!formData.courseCode.trim()) newErrors.courseCode = 'กรุณาเลือกหรือกรอกรหัสวิชา';
    if (!formData.section.trim()) newErrors.section = 'กรุณากรอกกลุ่มเรียน / Section';
    if (!formData.date) newErrors.date = 'กรุณาเลือกวันที่สอน';
    if (!formData.startTime) newErrors.startTime = 'กรุณากรอกเวลาเริ่มต้น';
    if (!formData.endTime) newErrors.endTime = 'กรุณากรอกเวลาสิ้นสุด';
    if (!formData.classroom.trim()) newErrors.classroom = 'กรุณากรอกห้องเรียน';
    if (!formData.problemType) newErrors.problemType = 'กรุณาเลือกประเภทปัญหา';
    if (!formData.reason.trim()) newErrors.reason = 'กรุณากรอกเหตุผลประกอบ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let attachmentData = '';
    if (attachment) {
      attachmentData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(attachment);
      });
    }

    const requestPayload = {
      email: userEmail,
      teacherName: formData.teacherName,
      faculty: formData.faculty,
      courseCode: formData.courseCode,
      section: formData.section,
      date: formData.date,
      timeRange: `${formData.startTime} - ${formData.endTime}`,
      classroom: formData.classroom,
      problemType: formData.problemType,
      reason: formData.reason,
      attachmentName: attachment ? attachment.name : '',
      attachmentData,
    };

    try {
      const result = await onSubmitSuccess(requestPayload);
      if (result) {
        setSubmittedReqId(result.requestId || '');
        setShowSuccessPopup(true);
        setFormData({
          teacherName: '',
          faculty: '',
          courseCode: '',
          section: '',
          date: '',
          startTime: '',
          endTime: '',
          classroom: '',
          problemType: '',
          reason: '',
        });
        setAttachment(null);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('เกิดข้อผิดพลาดในการส่งคำร้อง: ' + err.message);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '28px', height: '100%' }}>
      <div className="dash-section-header">
        <Send size={16} color="var(--color-primary)" />
        <h2>ยื่นคำร้องขอเช็คอินย้อนหลัง</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={`form-float${formData.teacherName ? ' filled' : ''}`} style={{ position: 'relative' }}>
            <label htmlFor="teacherName">ชื่อผู้สอน *</label>
            <input
              id="teacherName"
              type="text"
              autoComplete="off"
              value={formData.teacherName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, teacherName: val }));
                setShowTeacherDropdown(true);
                if (errors.teacherName) setErrors(prev => ({ ...prev, teacherName: '' }));
              }}
              onFocus={() => setShowTeacherDropdown(true)}
              onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
              placeholder={teachers.length > 0 ? 'พิมพ์ชื่อเพื่อค้นหา...' : 'เช่น ดร. สมชาย ใจดี'}
            />
            {showTeacherDropdown && teachers.length > 0 && (() => {
              const q = formData.teacherName.trim().toLowerCase();
              const matches = q
                ? teachers.filter(t => t.full_name_th.toLowerCase().includes(q))
                : teachers;
              if (matches.length === 0) return (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--bg-dropdown)', border: '1px solid var(--border-light)',
                  borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}>
                  <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>ไม่พบรายชื่อที่ค้นหา</div>
                </div>
              );
              if (matches.length === 1 && matches[0].full_name_th === formData.teacherName) return null;
              return (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  maxHeight: '220px', overflowY: 'auto',
                  background: 'var(--bg-dropdown)', border: '1px solid var(--border-light)',
                  borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  padding: '4px',
                }}>
                  {matches.slice(0, 20).map((t, i) => (
                    <div
                      key={i}
                      onMouseDown={() => {
                        setFormData(prev => ({ ...prev, teacherName: t.full_name_th }));
                        setShowTeacherDropdown(false);
                      }}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                        borderRadius: '6px', color: 'var(--text-main)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(138,75,243,0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {t.full_name_th} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({t.email})</span>
                    </div>
                  ))}
                  {matches.length > 20 && (
                    <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      ...อีก {matches.length - 20} รายการ
                    </div>
                  )}
                </div>
              );
            })()}
            {errors.teacherName && <span className="form-error" role="alert">{errors.teacherName}</span>}
          </div>
          <div className={`form-float${formData.faculty ? ' filled' : ''}`}>
            <label htmlFor="faculty">คณะ / วิทยาลัย *</label>
            <select
              id="faculty"
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
            >
              <option value="">-- เลือกคณะ / วิทยาลัย --</option>
              {faculties.map(fac => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
            {errors.faculty && <span className="form-error" role="alert">{errors.faculty}</span>}
          </div>
        </div>

        <div className={`form-float${formData.courseCode ? ' filled' : ''}`} style={{ position: 'relative' }}>
          <label htmlFor="courseCode">รหัสวิชา *</label>
          <input
            id="courseCode"
            type="text"
            autoComplete="off"
            value={formData.courseCode}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, courseCode: val }));
              setShowCourseDropdown(true);
              if (errors.courseCode) setErrors(prev => ({ ...prev, courseCode: '' }));
            }}
            onFocus={() => setShowCourseDropdown(true)}
            onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
            placeholder={courses.length > 0 ? 'พิมพ์รหัสวิชาเพื่อค้นหา...' : 'เช่น CS101'}
          />
          {showCourseDropdown && courses.length > 0 && (() => {
            const q = formData.courseCode.trim().toLowerCase();
            const matches = q
              ? courses.filter(c =>
                  c.course_code.toLowerCase().includes(q) ||
                  (c.course_name && c.course_name.toLowerCase().includes(q))
                )
              : courses;
            if (matches.length === 0) return (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg-dropdown)', border: '1px solid var(--border-light)',
                borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>ไม่พบรหัสวิชาที่ค้นหา</div>
              </div>
            );
            if (matches.length === 1 && matches[0].course_code === formData.courseCode) return null;
            return (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                maxHeight: '220px', overflowY: 'auto',
                background: 'var(--bg-dropdown)', border: '1px solid var(--border-light)',
                borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: '4px',
              }}>
                {matches.slice(0, 20).map((c, i) => (
                  <div
                    key={i}
                    onMouseDown={() => {
                      setFormData(prev => ({ ...prev, courseCode: c.course_code }));
                      setShowCourseDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                      borderRadius: '6px', color: 'var(--text-main)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(138,75,243,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontWeight: '600' }}>{c.course_code}</span>
                    {c.course_name && c.course_name !== c.course_code && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>— {c.course_name}</span>
                    )}
                  </div>
                ))}
                {matches.length > 20 && (
                  <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    ...อีก {matches.length - 20} รายการ
                  </div>
                )}
              </div>
            );
          })()}
          {errors.courseCode && <span className="form-error" role="alert">{errors.courseCode}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={`form-float${formData.section ? ' filled' : ''}`}>
            <label htmlFor="section">กลุ่มเรียน / Section *</label>
            <input
              id="section"
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="เช่น Sec 1"
            />
            {errors.section && <span className="form-error" role="alert">{errors.section}</span>}
          </div>
          <div className={`form-float${formData.classroom ? ' filled' : ''}`}>
            <label htmlFor="classroom">ห้องเรียน *</label>
            <input
              id="classroom"
              type="text"
              name="classroom"
              value={formData.classroom}
              onChange={handleChange}
              placeholder="เช่น Room 402"
            />
            {errors.classroom && <span className="form-error" role="alert">{errors.classroom}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="form-float filled">
            <label htmlFor="date">วันที่สอน *</label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <span className="form-error" role="alert">{errors.date}</span>}
          </div>
          <div className="form-float filled">
            <label htmlFor="startTime">เวลาเริ่มสอน *</label>
            <input
              id="startTime"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
            {errors.startTime && <span className="form-error" role="alert">{errors.startTime}</span>}
          </div>
          <div className="form-float filled">
            <label htmlFor="endTime">เวลาสิ้นสุดสอน *</label>
            <input
              id="endTime"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
            {errors.endTime && <span className="form-error" role="alert">{errors.endTime}</span>}
          </div>
        </div>

        <div className={`form-float${formData.problemType ? ' filled' : ''}`}>
          <label htmlFor="problemType">ประเภทปัญหา *</label>
          <select
            id="problemType"
            name="problemType"
            value={formData.problemType}
            onChange={handleChange}
          >
            <option value="">-- เลือกประเภทปัญหา --</option>
            {PROBLEM_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.problemType && <span className="form-error" role="alert">{errors.problemType}</span>}
        </div>

        <div className={`form-float${formData.reason ? ' filled' : ''}`}>
          <label htmlFor="reason">เหตุผลประกอบ *</label>
          <textarea
            id="reason"
            name="reason"
            rows="3"
            value={formData.reason}
            onChange={handleChange}
            placeholder="โปรดระบุรายละเอียดของปัญหาและสาเหตุที่จำเป็นต้องขออนุมัติย้อนหลัง..."
          ></textarea>
          {errors.reason && <span className="form-error" role="alert">{errors.reason}</span>}
        </div>

        <div>
          <label style={{ fontSize: '12px' }}>แนบหลักฐาน (เช่น ภาพหน้าจอ, รูปห้องเรียน, รายชื่อ นศ.)</label>
          <div className={`form-upload${attachment ? ' has-file' : ''}`}>
            <input
              type="file"
              onChange={handleFileChange}
              aria-label="แนบหลักฐาน"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
            />
            <Upload size={22} style={{ margin: '0 auto 8px', color: attachment ? 'var(--color-primary)' : 'var(--text-muted)', transition: 'color 0.2s' }} />
            <span style={{ display: 'block', fontSize: '13px', color: attachment ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {attachment ? `${attachment.name}` : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', marginTop: '10px' }}>
          <Send size={16} /> ส่งคำร้อง
        </button>
      </form>

      {showSuccessPopup && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSuccessPopup(); }}>
          <div className="glass-panel animate-scale-in" role="alertdialog" aria-modal="true" aria-labelledby="success-title" style={{
            maxWidth: '420px', width: '100%', padding: '40px', textAlign: 'center'
          }}>
            <CheckCircle size={56} style={{ color: 'var(--color-success)', marginBottom: '16px' }} aria-hidden="true" />
            <h3 id="success-title" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              ส่งคำร้องเรียบร้อยแล้ว!
            </h3>
            {submittedReqId && (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                รหัสคำร้อง: <strong style={{ color: 'var(--color-primary)' }}>{submittedReqId}</strong>
              </p>
            )}
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              คำร้องของคุณถูกส่งไปยังคณบดีเพื่อพิจารณาอนุมัติแล้ว
            </p>
            <button
              onClick={closeSuccessPopup}
              className="btn btn-primary"
              style={{ padding: '10px 32px' }}
            >
              ตกลง
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
