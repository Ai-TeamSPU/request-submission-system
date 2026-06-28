import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../utils/api';

export default function ExcelImport() {
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [codeCol, setCodeCol] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [courseList, setCourseList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editId, setEditId] = useState(null);
  const [editCode, setEditCode] = useState('');

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourseList(Array.isArray(data) ? data : []);
    } catch { setCourseList([]); }
  };

  useEffect(() => { loadCourses(); }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (json.length < 2) {
          setError('ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย 1 แถวหัวตาราง + 1 แถวข้อมูล)');
          return;
        }

        const hdrs = json[0].map(h => String(h || '').trim());
        setHeaders(hdrs);
        setRows(json.slice(1).filter(r => r.some(cell => cell != null && cell !== '')));

        let auto = '';
        hdrs.forEach((h, i) => {
          const lower = h.toLowerCase();
          if (lower.includes('รหัสวิชา') || lower.includes('course_code') || lower.includes('coursecode') || lower === 'code' || lower.includes('รหัส')) {
            auto = String(i);
          }
        });
        if (!auto && hdrs.length === 1) auto = '0';
        setCodeCol(auto);
        setStep('mapping');
      } catch {
        setError('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx, .xls)');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const previewCodes = () => {
    if (codeCol === '') return [];
    const idx = Number(codeCol);
    return rows.slice(0, 15).map(r => String(r[idx] ?? '').trim()).filter(Boolean);
  };

  const handleImport = async () => {
    if (codeCol === '') { setError('กรุณาเลือกคอลัมน์รหัสวิชา'); return; }
    setImporting(true);
    setError('');
    const idx = Number(codeCol);
    const courses = rows.map(r => ({ courseCode: String(r[idx] ?? '').trim() })).filter(c => c.courseCode);
    const unique = [...new Map(courses.map(c => [c.courseCode, c])).values()];
    try {
      const res = await api.importCourses(unique);
      setResult({ success: true, count: res.imported, fileName });
      setStep('done');
      loadCourses();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้า');
    } finally { setImporting(false); }
  };

  const handleClear = async () => {
    if (!confirm('ต้องการลบข้อมูลรหัสวิชาทั้งหมดในระบบ เพื่อนำเข้าใหม่?')) return;
    try {
      await api.clearCourses();
      loadCourses();
    } catch (err) { alert('ลบไม่สำเร็จ: ' + err.message); }
  };

  const handleAddCourse = async () => {
    if (!newCode.trim()) return;
    try {
      await api.addCourse(newCode.trim());
      setNewCode('');
      loadCourses();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteCourse = async (id) => {
    try {
      await api.deleteCourse(id);
      loadCourses();
    } catch (err) { alert(err.message); }
  };

  const handleSaveEdit = async () => {
    if (!editCode.trim()) return;
    try {
      await api.updateCourse(editId, editCode.trim());
      setEditId(null);
      setEditCode('');
      loadCourses();
    } catch (err) { alert(err.message); }
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setCodeCol('');
    setResult(null);
    setError('');
  };

  const filtered = courseList.filter(c =>
    c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>📥 นำเข้าข้อมูลรหัสวิชาผ่าน Excel</h2>
        <button onClick={handleClear} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}>
          <Trash2 size={14} /> ล้างข้อมูลรหัสวิชาทั้งหมด
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginBottom: '16px', borderRadius: '8px', background: 'rgba(243,18,96,0.08)', border: '1px solid rgba(243,18,96,0.2)', color: 'hsl(355,85%,70%)', fontSize: '13px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border-light)', cursor: 'pointer', position: 'relative' }}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          <Upload size={40} style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
          <p style={{ fontWeight: '600', marginBottom: '6px' }}>ลากไฟล์ Excel (.xlsx, .xls) มาวางที่นี่</p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ</span>
        </div>
      )}

      {step === 'mapping' && (
        <div className="glass-card animate-fade-in">
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>ไฟล์: {fileName}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>พบ {rows.length} แถว, {headers.length} คอลัมน์</p>
          <div style={{ marginBottom: '20px', maxWidth: '300px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>เลือกคอลัมน์ที่เป็นรหัสวิชา *</label>
            <select value={codeCol} onChange={e => setCodeCol(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#000' }}>
              <option value="">-- เลือกคอลัมน์ --</option>
              {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
            </select>
          </div>
          {codeCol !== '' && (
            <>
              <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>ตัวอย่างรหัสวิชา (15 รายการแรก)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {previewCodes().map((code, i) => (
                  <span key={i} style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', background: 'rgba(138,75,243,0.1)', border: '1px solid rgba(138,75,243,0.2)', color: 'var(--text-main)' }}>{code}</span>
                ))}
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={reset} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>ยกเลิก</button>
            <button onClick={handleImport} disabled={importing || codeCol === ''} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px', gap: '6px' }}>
              <Upload size={14} /> {importing ? 'กำลังนำเข้า...' : `นำเข้า ${rows.length} รายการ`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result?.success && (
        <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--color-success)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-success)' }}>นำเข้าสำเร็จ!</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>ไฟล์: {result.fileName}</p>
          <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>นำเข้ารหัสวิชาทั้งหมด <strong>{result.count}</strong> รายการ</p>
          <button onClick={reset} className="btn btn-primary" style={{ marginTop: '20px', padding: '8px 24px', fontSize: '13px' }}>นำเข้าไฟล์ใหม่</button>
        </div>
      )}

      {/* รายวิชาในระบบ */}
      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700' }}>รหัสวิชาในระบบ ({courseList.length} รายการ)</h3>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหารหัสวิชา..."
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
          />
          <input
            type="text"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCourse()}
            placeholder="เพิ่มรหัสวิชาใหม่..."
            style={{ width: '200px', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
          />
          <button onClick={handleAddCourse} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '12px', gap: '4px' }}>
            <Plus size={14} /> เพิ่ม
          </button>
        </div>

        {courseList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
            ยังไม่มีรหัสวิชาในระบบ — นำเข้าผ่าน Excel หรือเพิ่มด้านบน
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left', width: '60px' }}>#</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>รหัสวิชา</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'right', width: '120px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {editId === c.id ? (
                        <input
                          type="text"
                          value={editCode}
                          onChange={e => setEditCode(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                          autoFocus
                          style={{ padding: '4px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-primary)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', width: '100%' }}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-main)' }}>{c.course_code}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {editId === c.id ? (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button onClick={handleSaveEdit} className="btn btn-success" style={{ padding: '4px 8px', fontSize: '11px' }}><Check size={12} /></button>
                          <button onClick={() => { setEditId(null); setEditCode(''); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}><X size={12} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditId(c.id); setEditCode(c.course_code); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteCourse(c.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }}><Trash2 size={12} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
