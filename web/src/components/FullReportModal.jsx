/* eslint-disable no-unused-vars */
// FULL REPORT MODAL COMPONENT 
import { useState } from 'react';
import { usePayments } from '../contexts/PaymentsContext';
import { useToast } from '../contexts/ToastContext';
import { exportToPDF } from '../utils/pdfExport';
import { Icon } from './Icon';
import { c as C, f as F } from '../styles/theme';

function generatePaymentSummary(payments) {
  const totalExpected = payments.reduce((s, p) => s + Number(p.amount_paid || p.amount || 0), 0);
  const totalCollected = payments.filter(p => p.status === 'paid' || p.status === 'Paid').reduce((s, p) => s + Number(p.amount_paid || p.amount || 0), 0);
  const paidCount = payments.filter(p => p.status === 'paid' || p.status === 'Paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'pending_approval' || p.status === 'Pending Approval').length;
  const lateCount = payments.filter(p => p.status === 'late' || p.status === 'collections' || p.status === 'Late' || p.status === 'Collections').length;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return { totalExpected, totalCollected, paidCount, pending: pendingCount, late: lateCount, collectionRate };
}

function exportToCSV(payments, filename) {
  if (!payments.length) return;
  const headers = ['Tenant', 'Unit', 'Property', 'Amount', 'Due Date', 'Paid Date', 'Method', 'Status'];
  const rows = payments.map(p => [
    p.tenant_name || p.tenant || '',
    p.unit_number || p.unit || '',
    p.property_name || p.property || '',
    p.amount_paid || p.amount || 0,
    p.due_date || p.due || '',
    p.payment_date || p.paid || '',
    p.payment_method || p.method || '',
    p.status || '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.6rem 1.2rem',
  fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
};

export default function FullReportModal({ onClose }) {
  const { payments } = usePayments();
  const toast = useToast();
  const [dateRange, setDateRange] = useState('current');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  const summary = generatePaymentSummary(payments);

  function getFilteredData() {
    let filteredData = payments;
    let rangeText = 'Current Month';
    
    const today = new Date();
    if (dateRange === 'current') {
      filteredData = payments.filter(p => {
        const d = new Date(p.due_date || p.due);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
      rangeText = `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
    } else if (dateRange === 'last3') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      filteredData = payments.filter(p => new Date(p.due_date || p.due) >= threeMonthsAgo);
      rangeText = 'Last 3 Months';
    } else if (dateRange === 'last6') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      filteredData = payments.filter(p => new Date(p.due_date || p.due) >= sixMonthsAgo);
      rangeText = 'Last 6 Months';
    } else if (dateRange === 'year') {
      filteredData = payments.filter(p => {
        const d = new Date(p.due_date || p.due);
        return d.getFullYear() === today.getFullYear();
      });
      rangeText = `Year ${today.getFullYear()}`;
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      filteredData = payments.filter(p => {
        const d = new Date(p.due_date || p.due);
        return d >= new Date(customStartDate) && d <= new Date(customEndDate);
      });
      rangeText = `${customStartDate} to ${customEndDate}`;
    } else if (dateRange === 'all') {
      rangeText = 'All Time';
    }
    
    return { filteredData, rangeText };
  }

  function handleExport(format) {
    setExportFormat(format);
    setExporting(true);
    
    setTimeout(() => {
      try {
        const { filteredData, rangeText } = getFilteredData();
        const filteredSummary = generatePaymentSummary(filteredData);
        const filename = `payment_report_${new Date().toISOString().split('T')[0]}`;
        
        if (format === 'csv') {
          exportToCSV(filteredData, `${filename}.csv`);
          toast.success("CSV report exported successfully!");
        } else if (format === 'pdf') {
          exportToPDF(filteredData, filteredSummary, rangeText);
          toast.success("PDF report generated successfully!");
        }
        
        setTimeout(() => onClose(), 500);
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export report');
      } finally {
        setExporting(false);
        setExportFormat(null);
      }
    }, 500);
  }

  const { filteredData, rangeText } = getFilteredData();
  const filteredSummary = generatePaymentSummary(filteredData);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 640, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(232,160,18,0.12)', border: '1px solid rgba(232,160,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="file-text" size={18} color={C.gold} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Generate Report</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Export payment data in your preferred format</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Preview Stats */}
          <div style={{ padding: '1rem', borderRadius: '6px', background: 'rgba(232,160,18,0.04)', border: '1px solid rgba(232,160,18,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Report Preview</span>
              <span style={{ fontSize: '0.58rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(232,160,18,0.1)', color: C.gold, fontFamily: F.mono, fontWeight: 600 }}>{rangeText}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Total Expected', value: `R ${filteredSummary.totalExpected.toLocaleString()}`, color: C.white },
                { label: 'Collected', value: `R ${filteredSummary.totalCollected.toLocaleString()}`, color: C.greenLight },
                { label: 'Collection Rate', value: `${filteredSummary.collectionRate}%`, color: C.gold },
                { label: 'Records', value: filteredData.length, color: 'rgba(245,240,232,0.5)' },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{stat.label}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color, fontFamily: F.bebas }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Date Range
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              {[
                { value: 'current', label: 'Current Month' },
                { value: 'last3', label: 'Last 3 Months' },
                { value: 'last6', label: 'Last 6 Months' },
                { value: 'year', label: 'This Year' },
                { value: 'all', label: 'All Time' },
                { value: 'custom', label: 'Custom Range' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setDateRange(value)} style={{
                  padding: '0.5rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 500,
                  fontFamily: F.mono, letterSpacing: '0.04em', textAlign: 'center',
                  border: `1px solid ${dateRange === value ? C.gold : C.border}`,
                  background: dateRange === value ? 'rgba(232,160,18,0.1)' : 'transparent',
                  color: dateRange === value ? C.gold : 'rgba(245,240,232,0.4)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, display: 'block', marginBottom: '0.3rem' }}>Start Date</label>
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, display: 'block', marginBottom: '0.3rem' }}>End Date</label>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          {/* Export Format */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Select Export Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {/* CSV */}
              <button onClick={() => handleExport('csv')} disabled={exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))} style={{
                padding: '1.2rem', borderRadius: '6px', textAlign: 'center',
                background: C.black, border: `2px solid ${C.border}`,
                cursor: (exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))) ? 'not-allowed' : 'pointer',
                opacity: (exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))) ? 0.4 : 1,
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => { if (!exporting) e.currentTarget.style.borderColor = C.greenLight; }}
                onMouseLeave={e => { if (!exporting) e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(26,122,74,0.1)', border: '1px solid rgba(76,186,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                  <Icon name="file-text" size={28} color={C.greenLight} />
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white, marginBottom: '0.2rem' }}>CSV Format</p>
                <span style={{ fontSize: '0.62rem', color: C.greenLight, fontFamily: F.mono, background: 'rgba(26,122,74,0.1)', padding: '0.15rem 0.6rem', borderRadius: '8px' }}>.csv file</span>
              </button>

              {/* PDF */}
              <button onClick={() => handleExport('pdf')} disabled={exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))} style={{
                padding: '1.2rem', borderRadius: '6px', textAlign: 'center',
                background: C.black, border: `2px solid ${C.border}`,
                cursor: (exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))) ? 'not-allowed' : 'pointer',
                opacity: (exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))) ? 0.4 : 1,
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => { if (!exporting) e.currentTarget.style.borderColor = C.redLight; }}
                onMouseLeave={e => { if (!exporting) e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(224,90,74,0.1)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                  <Icon name="file" size={28} color={C.redLight} />
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white, marginBottom: '0.2rem' }}>PDF Format</p>
                <span style={{ fontSize: '0.62rem', color: C.redLight, fontFamily: F.mono, background: 'rgba(224,90,74,0.1)', padding: '0.15rem 0.6rem', borderRadius: '8px' }}>.pdf file</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={exporting} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
          {exporting && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: C.gold, color: C.black, padding: '0.6rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm }}>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Generating {exportFormat?.toUpperCase()}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}