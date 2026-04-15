// src/utils/exportUtils.js
export function exportToCSV(data, filename = 'report.csv') {
  // Convert data to CSV format
  const headers = [
    'Tenant',
    'Unit',
    'Property',
    'Amount',
    'Due Date',
    'Date Paid',
    'Method',
    'Status',
    'Rejection Reason'
  ];

  const rows = data.map(payment => [
    payment.tenant,
    payment.unit,
    payment.property,
    payment.amount,
    payment.due,
    payment.paid || '—',
    payment.method || '—',
    payment.status,
    payment.rejectionReason || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Generate summary statistics
export function generatePaymentSummary(payments) {
  const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const pending = payments.filter(p => p.status === 'Pending Approval').length;
  const late = payments.filter(p => p.status === 'Late' || p.status === 'Collections').length;
  const collectionRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;

  return {
    totalExpected,
    totalCollected,
    pending,
    late,
    collectionRate,
    totalTenants: payments.length,
    paidCount: payments.filter(p => p.status === 'Paid').length,
  };
}