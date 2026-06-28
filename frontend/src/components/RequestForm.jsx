import React, { useState, useEffect } from 'react';
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
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

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
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: '100%' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', color: 'var(--text-main)' }}>
        📝 ยื่นคำร้องขอเช็คอินย้อนหลัง
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <label htmlFor="teacherName">ชื่อผู้สอน *</label>
            <input
              id="teacherName"
              type="text"
              autoComplete="off"
              value={teacherSearch || formData.teacherName}
              onChange={(e) => {
                const val = e.target.value;
                setTeacherSearch(val);
                setFormData(prev => ({ ...prev, teacherName: val }));
                setShowTeacherDropdown(true);
                if (errors.teacherName) setErrors(prev => ({ ...prev, teacherName: '' }));
              }}
              onFocus={() => setShowTeacherDropdown(true)}
              onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
              placeholder={teachers.length > 0 ? 'พิมพ์ชื่อเพื่อค้นหา...' : 'เช่น ดร. สมชาย ใจดี'}
            />
            {showTeacherDropdown && teachers.length > 0 && (teacherSearch || '').trim() !== '' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                maxHeight: '200px', overflowY: 'auto',
                background: 'var(--glass-bg, #1a1a2e)', border: '1px solid var(--border-light)',
                borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {teachers
                  .filter(t => t.full_name_th.toLowerCase().includes((teacherSearch || '').toLowerCase()))
                  .slice(0, 20)
                  .map((t, i) => (
                    <div
                      key={i}
                      onMouseDown={() => {
                        setFormData(prev => ({ ...prev, teacherName: t.full_name_th }));
                        setTeacherSearch('');
                        setShowTeacherDropdown(false);
                      }}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-main)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(138,75,243,0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {t.full_name_th} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({t.email})</span>
                    </div>
                  ))}
                {teachers.filter(t => t.full_name_th.toLowerCase().includes((teacherSearch || '').toLowerCase())).length === 0 && (
                  <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>ไม่พบรายชื่อที่ค้นหา</div>
                )}
              </div>
            )}
            {errors.teacherName && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.teacherName}</span>}
          </div>
          <div>
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
            {errors.faculty && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.faculty}</span>}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <label htmlFor="courseCode">รหัสวิชา *</label>
          <input
            id="courseCode"
            type="text"
            autoComplete="off"
            value={courseSearch || formData.courseCode}
            onChange={(e) => {
              const val = e.target.value;
              setCourseSearch(val);
              setFormData(prev => ({ ...prev, courseCode: val }));
              setShowCourseDropdown(true);
              if (errors.courseCode) setErrors(prev => ({ ...prev, courseCode: '' }));
            }}
            onFocus={() => setShowCourseDropdown(true)}
            onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
            placeholder={courses.length > 0 ? 'พิมพ์รหัสวิชาเพื่อค้นหา...' : 'เช่น CS101'}
          />
          {showCourseDropdown && courses.length > 0 && (courseSearch || '').trim() !== '' && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              maxHeight: '200px', overflowY: 'auto',
              background: 'var(--glass-bg, #1a1a2e)', border: '1px solid var(--border-light)',
              borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              {courses
                .filter(c => c.course_code.toLowerCase().includes((courseSearch || '').toLowerCase()))
                .slice(0, 20)
                .map((c, i) => (
                  <div
                    key={i}
                    onMouseDown={() => {
                      setFormData(prev => ({ ...prev, courseCode: c.course_code }));
                      setCourseSearch('');
                      setShowCourseDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--text-main)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(138,75,243,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {c.course_code}
                  </div>
                ))}
              {courses.filter(c => c.course_code.toLowerCase().includes((courseSearch || '').toLowerCase())).length === 0 && (
                <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>ไม่พบรหัสวิชาที่ค้นหา</div>
              )}
            </div>
          )}
          {errors.courseCode && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.courseCode}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="section">กลุ่มเรียน / Section *</label>
            <input
              id="section"
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="เช่น Sec 1"
            />
            {errors.section && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.section}</span>}
          </div>
          <div>
            <label htmlFor="classroom">ห้องเรียน *</label>
            <input
              id="classroom"
              type="text"
              name="classroom"
              value={formData.classroom}
              onChange={handleChange}
              placeholder="เช่น Room 402"
            />
            {errors.classroom && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.classroom}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label htmlFor="date">วันที่สอน *</label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.date}</span>}
          </div>
          <div>
            <label htmlFor="startTime">เวลาเริ่มสอน *</label>
            <input
              id="startTime"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
            {errors.startTime && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.startTime}</span>}
          </div>
          <div>
            <label htmlFor="endTime">เวลาสิ้นสุดสอน *</label>
            <input
              id="endTime"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
            {errors.endTime && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.endTime}</span>}
          </div>
        </div>

        <div>
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
          {errors.problemType && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.problemType}</span>}
        </div>

        <div>
          <label htmlFor="reason">เหตุผลประกอบ *</label>
          <textarea
            id="reason"
            name="reason"
            rows="3"
            value={formData.reason}
            onChange={handleChange}
            placeholder="โปรดระบุรายละเอียดของปัญหาและสาเหตุที่จำเป็นต้องขออนุมัติย้อนหลัง..."
          ></textarea>
          {errors.reason && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.reason}</span>}
        </div>

        <div>
          <label>แนบหลักฐาน (เช่น ภาพหน้าจอ, รูปห้องเรียน, รายชื่อ นศ.)</label>
          <div style={{
            border: '1px dashed var(--border-light)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.01)',
            position: 'relative'
          }}>
            <input
              type="file"
              onChange={handleFileChange}
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
            <Upload size={24} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>
              {attachment ? `หลักฐานที่เลือก: ${attachment.name}` : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', marginTop: '10px' }}>
          <Send size={16} /> ส่งคำร้อง
        </button>
      </form>

      {showSuccessPopup && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '420px', width: '100%', padding: '36px', textAlign: 'center'
          }}>
            <CheckCircle size={56} style={{ color: 'var(--color-success)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
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
              onClick={() => setShowSuccessPopup(false)}
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
