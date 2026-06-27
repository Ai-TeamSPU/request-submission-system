import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatsDashboard({ requests }) {
  const total = requests.length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;
  const pending = requests.filter(r => r.status === 'Pending').length;

  const chartData = {
    labels: ['อนุมัติแล้ว', 'ปฏิเสธ', 'รออนุมัติ'],
    datasets: [
      {
        data: [approved, rejected, pending],
        backgroundColor: [
          'hsl(145, 80%, 45%)', // Success
          'hsl(355, 85%, 55%)', // Danger
          'hsl(40, 95%, 55%)',   // Warning
        ],
        borderColor: [
          'rgba(23, 201, 100, 0.5)',
          'rgba(243, 18, 96, 0.5)',
          'rgba(245, 165, 36, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#fff',
          font: {
            family: 'Sarabun, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.raw || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${val} เคส (${pct}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', color: 'var(--text-main)' }}>
        📊 แดชบอร์ดสรุปสถิติ (Statistics Overview)
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Card 1: Total */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>คำขอทั้งหมด</span>
              <ClipboardList size={18} color="var(--color-primary)" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>{total}</span>
          </div>

          {/* Card 2: Pending */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>รออนุมัติ</span>
              <Clock size={18} color="var(--color-warning)" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-warning)' }}>{pending}</span>
          </div>

          {/* Card 3: Approved */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>อนุมัติแล้ว</span>
              <CheckCircle2 size={18} color="var(--color-success)" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-success)' }}>{approved}</span>
          </div>

          {/* Card 4: Rejected */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>ปฏิเสธ</span>
              <XCircle size={18} color="var(--color-danger)" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-danger)' }}>{rejected}</span>
          </div>
        </div>

        {/* Pie Chart Display */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', padding: '16px' }}>
          {total > 0 ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Pie data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
              ไม่มีข้อมูลเพียงพอสำหรับแสดงแผนภูมิ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
