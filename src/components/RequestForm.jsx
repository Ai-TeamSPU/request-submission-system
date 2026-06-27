import React, { useState, useEffect } from 'react';
import { Send, Upload, CheckCircle } from 'lucide-react';
import { db } from '../utils/database';

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
    department: '',
    courseCode: '',
    courseName: '',
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
  const [successMsg, setSuccessMsg] = useState('');
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    const fetchFaculties = async () => {
      const list = await db.getFaculties();
      setFaculties(list);
    };
    fetchFaculties();
  }, []);

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
    if (!formData.faculty.trim()) newErrors.faculty = 'กรุณากรอกคณะ / วิทยาลัย';
    if (!formData.department.trim()) newErrors.department = 'กรุณากรอกสาขาวิชา';
    if (!formData.courseCode.trim()) newErrors.courseCode = 'กรุณากรอกรหัสวิชา';
    if (!formData.courseName.trim()) newErrors.courseName = 'กรุณากรอกชื่อวิชา';
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

    const requestPayload = {
      email: userEmail,
      teacherName: formData.teacherName,
      faculty: formData.faculty,
      department: formData.department,
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      section: formData.section,
      date: formData.date,
      timeRange: `${formData.startTime} - ${formData.endTime}`,
      classroom: formData.classroom,
      problemType: formData.problemType,
      reason: formData.reason,
      attachmentName: attachment ? attachment.name : '',
    };

    const success = await onSubmitSuccess(requestPayload);
    if (success) {
      setSuccessMsg('ส่งคำร้องขอเช็คอินย้อนหลังเรียบร้อยแล้ว!');
      setFormData({
        teacherName: '',
        faculty: '',
        department: '',
        courseCode: '',
        courseName: '',
        section: '',
        date: '',
        startTime: '',
        endTime: '',
        classroom: '',
        problemType: '',
        reason: '',
      });
      setAttachment(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: '100%' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', color: 'var(--text-main)' }}>
        📝 ยื่นคำร้องขอเช็คอินย้อนหลัง
      </h2>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--color-success-glow)',
          border: '1px solid var(--color-success)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: 'var(--color-success)',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="teacherName">ชื่อผู้สอน *</label>
            <input
              id="teacherName"
              type="text"
              name="teacherName"
              value={formData.teacherName}
              onChange={handleChange}
              placeholder="เช่น ดร. สมชาย ใจดี"
            />
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="department">สาขาวิชา *</label>
            <input
              id="department"
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="เช่น เทคโนโลยีสารสนเทศ"
            />
            {errors.department && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.department}</span>}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <label htmlFor="courseCode">รหัสวิชา *</label>
            <input
              id="courseCode"
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="เช่น CS101"
            />
            {errors.courseCode && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.courseCode}</span>}
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="courseName">ชื่อวิชา *</label>
            <input
              id="courseName"
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="เช่น Introduction to Programming"
            />
            {errors.courseName && <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500' }}>{errors.courseName}</span>}
          </div>
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
    </div>
  );
}
