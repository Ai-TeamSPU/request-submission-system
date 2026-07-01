import { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Trash2, X, UserCheck, UserX } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../utils/api';

const FIELDS = [
  { key: 'teacherName', label: 'ชื่ออาจารย์' },
  { key: 'courseCode', label: 'รหัสวิชา' },
  { key: 'section', label: 'กลุ่ม' },
  { key: 'timeRange', label: 'เวลาเรียน' },
  { key: 'email', label: 'อีเมล' },
  { key: 'faculty', label: 'ชื่อคณะ' },
];

export default function NoCheckinImport() {
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [colMap, setColMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRecords = async () => {
    try {
      const data = await api.getNoCheckinRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch { setRecords([]); }
  };

  useEffect(() => { loadRecords(); }, []);

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

        const autoMap = {};
        hdrs.forEach((h, i) => {
          const lower = h.toLowerCase();
          if (lower.includes('ชื่อ') && (lower.includes('อาจารย์') || lower.includes('ผู้สอน'))) autoMap.teacherName = String(i);
          else if (lower.includes('รหัสวิชา') || lower.includes('course')) autoMap.courseCode = String(i);
          else if (lower.includes('กลุ่ม') || lower.includes('section')) autoMap.section = String(i);
          else if ((lower.includes('เวลา') || lower.includes('time') || lower.includes('คาบ')) && !lower.includes('เช็คอิน') && !lower.includes('เช็กอิน') && !lower.includes('checkin')) autoMap.timeRange = String(i);
          else if (lower.includes('email') || lower.includes('อีเมล')) autoMap.email = String(i);
          else if (lower.includes('คณะ') || lower.includes('faculty')) autoMap.faculty = String(i);
        });
        setColMap(autoMap);
        setStep('mapping');
      } catch {
        setError('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx, .xls)');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const previewData = () => {
    return rows.slice(0, 8).map(r => {
      const obj = {};
      FIELDS.forEach(f => {
        const idx = colMap[f.key];
        obj[f.key] = idx !== undefined && idx !== '' ? String(r[Number(idx)] ?? '').trim() : '-';
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!colMap.teacherName && !colMap.courseCode) {
      setError('กรุณาเลือกคอลัมน์อย่างน้อย "ชื่ออาจารย์" หรือ "รหัสวิชา"');
      return;
    }
    setImporting(true);
    setError('');

    const mapped = rows.map(r => {
      const obj = {};
      FIELDS.forEach(f => {
        const idx = colMap[f.key];
        obj[f.key] = idx !== undefined && idx !== '' ? String(r[Number(idx)] ?? '').trim() : '';
      });
      return obj;
    }).filter(r => r.teacherName || r.courseCode);

    try {
      const res = await api.importNoCheckin(mapped);
      setResult({ success: true, count: res.imported, matched: res.matched || 0, fileName });
      setStep('done');
      loadRecords();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้า');
    } finally { setImporting(false); }
  };

  const handleClear = async () => {
    if (!confirm('ต้องการลบข้อมูลอาจารย์ที่ไม่เช็คอินทั้งหมดในระบบ?')) return;
    try {
      await api.clearNoCheckin();
      loadRecords();
    } catch (err) { alert('ลบไม่สำเร็จ: ' + err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteNoCheckin(id);
      loadRecords();
    } catch (err) { alert(err.message); }
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setColMap({});
    setResult(null);
    setError('');
  };

  const filtered = records.filter(r => {
    const term = searchTerm.toLowerCase();
    const facName = r.faculty?.name_th || r.faculty?.full_name_th || '';
    return (
      (r.teacher_name || '').toLowerCase().includes(term) ||
      (r.course_code || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      facName.toLowerCase().includes(term) ||
      (r.faculty || '').toLowerCase().includes(term)
    );
  });

  const getFacultyDisplay = (r) => {
    if (r.faculty_id && r.faculty) {
      return r.faculty.full_name_th || r.faculty.name_th;
    }
    return r.teacher_name;
  };

  const getDeptDisplay = (r) => {
    if (r.faculty_id && r.faculty?.departments) {
      return r.faculty.departments.name_th;
    }
    return r.faculty || '-';
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Upload size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>นำเข้าข้อมูลอาจารย์ที่ไม่เช็คอินผ่าน Excel</h2>
        </div>
        <button onClick={handleClear} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}>
          <Trash2 size={14} /> ล้างข้อมูลทั้งหมด
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {f.label} {(f.key === 'teacherName' || f.key === 'courseCode') && '*'}
                </label>
                <select
                  value={colMap[f.key] ?? ''}
                  onChange={e => setColMap(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#000' }}
                >
                  <option value="">-- ไม่เลือก --</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          {(colMap.teacherName || colMap.courseCode) && (
            <>
              <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>ตัวอย่างข้อมูล (8 รายการแรก)</h4>
              <div style={{ overflowX: 'auto', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                  <thead>
                    <tr>
                      {FIELDS.map(f => (
                        <th key={f.key} style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData().map((row, i) => (
                      <tr key={i}>
                        {FIELDS.map(f => (
                          <td key={f.key} style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: row[f.key] === '-' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                            {row[f.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={reset} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>ยกเลิก</button>
            <button onClick={handleImport} disabled={importing || (!colMap.teacherName && !colMap.courseCode)} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px', gap: '6px' }}>
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
          <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>นำเข้าข้อมูลทั้งหมด <strong>{result.count}</strong> รายการ</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: 'var(--color-success)' }} />
            จับคู่กับข้อมูลอาจารย์ในระบบได้ <strong>{result.matched}</strong> รายการ
            {result.count - result.matched > 0 && (
              <span style={{ marginLeft: '12px' }}>
                <UserX size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: 'var(--color-warning)' }} />
                ไม่พบ <strong>{result.count - result.matched}</strong> รายการ
              </span>
            )}
          </p>
          <button onClick={reset} className="btn btn-primary" style={{ marginTop: '20px', padding: '8px 24px', fontSize: '13px' }}>นำเข้าไฟล์ใหม่</button>
        </div>
      )}

      {/* รายการในระบบ */}
      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700' }}>อาจารย์ที่ไม่เช็คอินในระบบ ({records.length} รายการ)</h3>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่ออาจารย์, รหัสวิชา, อีเมล..."
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
          />
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
            ยังไม่มีข้อมูลในระบบ — นำเข้าผ่าน Excel ด้านบน
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left', width: '40px' }}>#</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'center', width: '40px' }}>สถานะ</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>ชื่ออาจารย์</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>รหัสวิชา</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>กลุ่ม</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>เวลาเรียน</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>อีเมล</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'left' }}>ต้นสังกัด</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'right', width: '60px' }}>ลบ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {r.faculty_id ? (
                        <UserCheck size={15} style={{ color: 'var(--color-success)' }} title="จับคู่กับข้อมูลอาจารย์ในระบบแล้ว" />
                      ) : (
                        <UserX size={15} style={{ color: 'var(--color-warning)' }} title="ไม่พบข้อมูลอาจารย์ในระบบ" />
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: '500' }}>{getFacultyDisplay(r)}</div>
                      {r.faculty_id && r.teacher_name !== (r.faculty?.name_th || '') && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Excel: {r.teacher_name}</div>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{r.course_code}</td>
                    <td style={{ padding: '8px 10px' }}>{r.section}</td>
                    <td style={{ padding: '8px 10px' }}>{r.time_range}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {r.faculty_id && r.faculty?.email ? r.faculty.email : r.email}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{getDeptDisplay(r)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(r.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        <X size={12} />
                      </button>
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
