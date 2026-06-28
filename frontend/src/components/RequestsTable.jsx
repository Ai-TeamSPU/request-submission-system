import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Eye, Calendar, MapPin, User, FileImage } from 'lucide-react';
import { api } from '../utils/api';

export default function RequestsTable({ requests, role, userEmail, onApprove, onReject, onComplete }) {
  const [selectedReq, setSelectedReq] = useState(null);
  const [managerNote, setManagerNote] = useState('');
  const [errorNote, setErrorNote] = useState('');
  const [attachmentData, setAttachmentData] = useState(null);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

  // Filter requests based on role
  const displayedRequests = role === 'employee' 
    ? requests.filter(r => r.email === userEmail)
    : requests;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge badge-approved">อนุมัติแล้ว</span>;
      case 'Completed':
        return <span className="badge badge-approved" style={{ background: 'rgba(59,130,246,0.15)', color: 'hsl(217,90%,70%)' }}>เช็กอินเรียบร้อย</span>;
      case 'Rejected':
        return <span className="badge badge-rejected">ปฏิเสธ</span>;
      default:
        return <span className="badge badge-pending">รออนุมัติ</span>;
    }
  };

  const openDetails = async (req) => {
    setSelectedReq(req);
    setManagerNote(req.managerNote || '');
    setErrorNote('');
    setAttachmentData(null);
    if (req.attachmentName) {
      setLoadingAttachment(true);
      try {
        const res = await api.getAttachment(req.id);
        setAttachmentData(res.attachmentData || null);
      } catch {}
      setLoadingAttachment(false);
    }
  };

  const closeDetails = () => {
    setSelectedReq(null);
    setManagerNote('');
    setErrorNote('');
    setAttachmentData(null);
  };

  const handleAction = async (isApprove) => {
    if (!managerNote.trim()) {
      setErrorNote('กรุณากรอกเหตุผลประกอบการพิจารณา');
      return;
    }
    setErrorNote('');
    
    if (isApprove) {
      await onApprove(selectedReq.id, managerNote);
    } else {
      await onReject(selectedReq.id, managerNote);
    }
    
    closeDetails();
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', color: 'var(--text-main)' }}>
        {role === 'manager' ? '📥 คิวพิจารณาคำร้องและจัดการเคส' : '📋 ประวัติคำร้องขอของคุณ'}
      </h2>

      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>รหัสคำขอ</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>ผู้สอน</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>วิชา / กลุ่ม</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>วันที่สอน</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>สถานะ</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {displayedRequests.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  ไม่มีข้อมูลคำร้องในระบบ
                </td>
              </tr>
            ) : (
              displayedRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{req.id}</td>
                  <td style={{ padding: '14px 8px', fontSize: '13px', color: 'var(--text-main)' }}>
                    <div>{req.teacherName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.email}</div>
                  </td>
                  <td style={{ padding: '14px 8px', fontSize: '13px', color: 'var(--text-main)' }}>
                    <div>{req.courseCode}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.section}</div>
                  </td>
                  <td style={{ padding: '14px 8px', fontSize: '13px', color: 'var(--text-main)' }}>{req.date}</td>
                  <td style={{ padding: '14px 8px' }}>{getStatusBadge(req.status)}</td>
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openDetails(req)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}
                      >
                        <Eye size={14} /> รายละเอียด
                      </button>
                      {role === 'manager' && req.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => openDetails(req)}
                            className="btn btn-success"
                            style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                          >
                            <Check size={14} /> อนุมัติ
                          </button>
                          <button
                            onClick={() => openDetails(req)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                          >
                            <X size={14} /> ปฏิเสธ
                          </button>
                        </>
                      )}
                      {role === 'academic' && req.status === 'Approved' && (
                        <button
                          onClick={() => openDetails(req)}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                        >
                          <Check size={14} /> ยืนยันเช็กอิน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details / Action Modal — rendered via portal to escape backdrop-filter containing block */}
      {selectedReq && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '650px',
            width: '100%',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-main)' }}>
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

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ประเภทปัญหา</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)', display: 'block', marginTop: '4px' }}>
                {selectedReq.problemType}
              </span>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>เหตุผลประกอบ</span>
              <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>{selectedReq.reason}</p>
            </div>

            {selectedReq.attachmentName && (
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(138, 75, 243, 0.05)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: attachmentData ? '10px' : '0' }}>
                  <FileImage size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>หลักฐานแนบ: <strong>{selectedReq.attachmentName}</strong></span>
                </div>
                {loadingAttachment && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>กำลังโหลดไฟล์แนบ...</p>
                )}
                {attachmentData && (
                  attachmentData.startsWith('data:image') ? (
                    <img
                      src={attachmentData}
                      alt={selectedReq.attachmentName}
                      style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  ) : attachmentData.startsWith('data:application/pdf') ? (
                    <iframe
                      src={attachmentData}
                      title={selectedReq.attachmentName}
                      style={{ width: '100%', height: '500px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  ) : (
                    <a
                      href={attachmentData}
                      download={selectedReq.attachmentName}
                      className="btn btn-secondary"
                      style={{ fontSize: '13px', gap: '6px', marginTop: '4px' }}
                    >
                      ดาวน์โหลดไฟล์แนบ
                    </a>
                  )
                )}
              </div>
            )}

            {/* Academic Complete Action */}
            {role === 'academic' && selectedReq.status === 'Approved' && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={closeDetails} className="btn btn-secondary">ปิด</button>
                <button
                  onClick={async () => { await onComplete(selectedReq.id); closeDetails(); }}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  <Check size={16} /> เช็กอินย้อนหลังเรียบร้อย
                </button>
              </div>
            )}

            {/* Approval Flow Section */}
            {role === 'manager' && selectedReq.status === 'Pending' ? (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '20px' }}>
                <label htmlFor="managerNote">ความคิดเห็น/เหตุผลประกอบการตัดสินใจ *</label>
                <textarea
                  id="managerNote"
                  rows="3"
                  value={managerNote}
                  onChange={(e) => {
                    setManagerNote(e.target.value);
                    if (errorNote) setErrorNote('');
                  }}
                  placeholder="กรอกเหตุผลในการอนุมัติหรือปฏิเสธคำร้องนี้..."
                  style={{ marginBottom: '10px' }}
                ></textarea>
                {errorNote && <span style={{ color: 'var(--color-danger)', fontSize: '12px', display: 'block', marginBottom: '10px', fontWeight: '500' }}>{errorNote}</span>}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={closeDetails} className="btn btn-secondary">ยกเลิก</button>
                  <button onClick={() => handleAction(false)} className="btn btn-danger" style={{ gap: '6px' }}>
                    <X size={16} /> ปฏิเสธคำขอ
                  </button>
                  <button onClick={() => handleAction(true)} className="btn btn-success" style={{ gap: '6px' }}>
                    <Check size={16} /> อนุมัติคำขอ
                  </button>
                </div>
              </div>
            ) : (
              // Display Manager Note if already approved/rejected
              (selectedReq.managerNote && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '20px' }}>
                  {selectedReq.approvedBy && (
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        {selectedReq.status === 'Approved' ? 'อนุมัติโดย: ' : 'พิจารณาโดย: '}
                        <strong>{selectedReq.approvedBy}</strong>
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ความคิดเห็นประกอบการพิจารณา</span>
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: selectedReq.status === 'Approved' ? 'rgba(23, 201, 100, 0.05)' : 'rgba(243, 18, 96, 0.05)',
                    border: `1px solid ${selectedReq.status === 'Approved' ? 'rgba(23, 201, 100, 0.2)' : 'rgba(243, 18, 96, 0.2)'}`,
                    color: selectedReq.status === 'Approved' ? 'hsl(145, 80%, 75%)' : 'hsl(355, 85%, 75%)'
                  }}>
                    {selectedReq.managerNote}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button onClick={closeDetails} className="btn btn-secondary">ปิด</button>
                  </div>
                </div>
              )) || (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button onClick={closeDetails} className="btn btn-secondary">ปิด</button>
                </div>
              )
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
