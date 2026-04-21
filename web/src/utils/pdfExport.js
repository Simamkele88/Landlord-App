/* eslint-disable no-unused-vars */
// PDF EXPORT UTILITY FUNCTION, GENERATES A DETAILED PDF REPORT OF PAYMENTS WITH SUMMARY AND TABLE, USING JSPDF AND AUTOTABLE
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU HAVE ANY QUESTIONS REGARDING ANYTHING ASK ME.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


export function exportToPDF(payments, summary, dateRange = 'Current Month') {
  const doc = new jsPDF();
  
  // COLORS
  const primaryColor = [37, 99, 235]; // BLUE
  const successColor = [5, 150, 105]; // GREEN
  const warningColor = [245, 158, 11]; // YELLOW
  const dangerColor = [220, 38, 38]; // RED
  
  // ADD TITLE
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Chihwa Rentals', 14, 20);
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Report', 14, 32);
  
  // ADD DATE AND RANGE
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, 42);
  
  doc.text(`Period: ${dateRange}`, 14, 49);
  
  // ADD SUMMARY SECTION
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 14, 65);
  
  // SUMMARY BOXES
  const boxY = 72;
  const boxHeight = 35;
  
  // TOTAL EXPECTED BOX
  doc.setFillColor(240, 240, 240);
  doc.rect(14, boxY, 55, boxHeight, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Expected', 16, boxY + 10);
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`R ${summary.totalExpected.toLocaleString()}`, 16, boxY + 25);
  
  // TOTAL COLLECTED BOX
  doc.setFillColor(240, 240, 240);
  doc.rect(73, boxY, 55, boxHeight, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Collected', 75, boxY + 10);
  doc.setFontSize(14);
  doc.setTextColor(successColor[0], successColor[1], successColor[2]);
  doc.text(`R ${summary.totalCollected.toLocaleString()}`, 75, boxY + 25);
  
  // COLLECTION RATE BOX
  doc.setFillColor(240, 240, 240);
  doc.rect(132, boxY, 55, boxHeight, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Collection Rate', 134, boxY + 10);
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${summary.collectionRate}%`, 134, boxY + 25);
  
  // SECOND ROW OF SUMMARY BOXES FOR STATUS BREAKDOWN
  const boxY2 = boxY + boxHeight + 5;
  
  // PAID BOX
  doc.setFillColor(240, 240, 240);
  doc.rect(14, boxY2, 55, 25, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Paid', 16, boxY2 + 10);
  doc.setFontSize(12);
  doc.setTextColor(successColor[0], successColor[1], successColor[2]);
  doc.text(`${summary.paidCount} payments`, 16, boxY2 + 20);
  
  // PENDING APPROVAL BOX
  doc.setFillColor(240, 240, 240);
  doc.rect(73, boxY2, 55, 25, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Pending Approval', 75, boxY2 + 10);
  doc.setFontSize(12);
  doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
  doc.text(`${summary.pending} payments`, 75, boxY2 + 20);
  
  // LATE/COLLECTIONS BOX
  doc.setFillColor(240, 240, 240);
  doc.rect(132, boxY2, 55, 25, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Late/Collections', 134, boxY2 + 10);
  doc.setFontSize(12);
  doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
  doc.text(`${summary.late} payments`, 134, boxY2 + 20);
  
  // ADD STATUS BREAKDOWN
  const statusBreakdown = {
    'Paid': payments.filter(p => p.status === 'Paid').length,
    'Pending Approval': payments.filter(p => p.status === 'Pending Approval').length,
    'Late': payments.filter(p => p.status === 'Late').length,
    'Collections': payments.filter(p => p.status === 'Collections').length,
  };
  
  // CREATE TABLE
  const tableHeaders = [
    'Tenant', 
    'Unit', 
    'Property', 
    'Amount', 
    'Due Date', 
    'Paid Date', 
    'Status'
  ];
  
  const tableData = payments.map(p => [
    p.tenant,
    p.unit,
    p.property,
    `R ${p.amount.toLocaleString()}`,
    p.due,
    p.paid || '—',
    p.status
  ]);
  
  // ADD TABLE USING AUTOTABLE
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 145,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 40 }, // TENANT
      1: { cellWidth: 25 }, // UNIT
      2: { cellWidth: 35 }, // PROPERTY
      3: { cellWidth: 25 }, // AMOUNT
      4: { cellWidth: 25 }, // DUE DATE
      5: { cellWidth: 25 }, // PAID DATE
      6: { cellWidth: 25 }, // STATUS
    },
  });
  
  // ADD FOOTER WITH PAGE NUMBERS
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Chihwa Rentals Landlord Portal`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // SAVE PDF WITH DYNAMIC FILENAME
  const filename = `payment_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}