/* eslint-disable no-unused-vars */
// PDF EXPORT UTILITY FUNCTION

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(payments, summary, dateRange = 'Current Month') {
  const doc = new jsPDF();
  
  // THEME
  const gold = [232, 160, 18];
  const black = [10, 10, 10];
  const darkGray = [20, 20, 20];
  const mutedGray = [100, 100, 100];
  const lightGray = [245, 240, 232];
  const green = [26, 122, 74];
  const red = [224, 90, 74];
  const amber = [245, 158, 11];
  const cardBg = [248, 248, 248];
  const borderColor = [220, 220, 220];
  
  // Dark header bar
  doc.setFillColor(black[0], black[1], black[2]);
  doc.rect(0, 0, doc.internal.pageSize.width, 48, 'F');
  
  // Gold accent line
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 48, doc.internal.pageSize.width, 2, 'F');
  
  // Brand name
  doc.setFontSize(22);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Chihwa', 14, 22);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('Rentals', doc.getTextWidth('Chihwa ') + 14, 22);
  
  // Report title
  doc.setFontSize(13);
  doc.setTextColor(180, 180, 180);
  doc.text('Payment Report', 14, 34);
  
  doc.setFontSize(8);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, 60);
  
  // Period badge
  const periodWidth = doc.getTextWidth(dateRange) + 16;
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(14, 66, periodWidth, 16, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text(dateRange, 22, 76);
  
  const summaryY = 92;
  
  doc.setFontSize(11);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text('Summary', 14, summaryY);
  
  // Gold underline
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(14, summaryY + 3, 40, 1.5, 'F');
  
  // Summary cards - Row 1
  const boxY = summaryY + 12;
  const boxW = 58;
  const boxH = 32;
  const gap = 4;
  
  const cards = [
    { label: 'Total Expected', value: `R ${(summary.totalExpected || 0).toLocaleString()}`, color: black },
    { label: 'Total Collected', value: `R ${(summary.totalCollected || 0).toLocaleString()}`, color: green },
    { label: 'Collection Rate', value: `${summary.collectionRate || 0}%`, color: gold },
  ];
  
  cards.forEach((card, i) => {
    const x = 14 + (boxW + gap) * i;
    
    // Card background
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(x, boxY, boxW, boxH, 4, 4, 'FD');
    
    // Left accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, boxY, 3, boxH, 4, 4, 'F');
    doc.rect(x + 3, boxY, 1, boxH, 'F');
    
    // Label
    doc.setFontSize(7);
    doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    doc.text(card.label, x + 10, boxY + 12);
    
    // Value
    doc.setFontSize(14);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + 10, boxY + 26);
  });
  
  // Summary cards - Row 2
  const boxY2 = boxY + boxH + gap;
  const boxH2 = 22;
  
  const statusCards = [
    { label: 'Paid', value: `${summary.paidCount || 0} payments`, color: green },
    { label: 'Pending', value: `${summary.pending || 0} payments`, color: amber },
    { label: 'Late / Collections', value: `${summary.late || 0} payments`, color: red },
  ];
  
  statusCards.forEach((card, i) => {
    const x = 14 + (boxW + gap) * i;
    
    // Card background
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(x, boxY2, boxW, boxH2, 4, 4, 'FD');
    
    // Left accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, boxY2, 3, boxH2, 4, 4, 'F');
    doc.rect(x + 3, boxY2, 1, boxH2, 'F');
    
    // Label
    doc.setFontSize(6);
    doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    doc.text(card.label, x + 10, boxY2 + 10);
    
    // Value
    doc.setFontSize(10);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + 10, boxY2 + 18);
  });
  
  const tableStartY = boxY2 + boxH2 + 14;
  
  // Section title
  doc.setFontSize(11);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text('Payment Details', 14, tableStartY);
  
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(14, tableStartY + 3, 60, 1.5, 'F');
  
  const tableHeaders = ['Tenant', 'Unit', 'Property', 'Amount', 'Due Date', 'Paid Date', 'Status'];
  
  const tableData = payments.map(p => {
    const tenantName = p.tenant_name || p.tenant || 'Unknown';
    const unitInfo = p.unit_number || p.unit || '—';
    const propertyName = p.property_name || p.property || '—';
    const amount = p.amount_paid || p.amount || 0;
    const dueDate = p.due_date || p.due || '—';
    const paidDate = p.payment_date || p.paid || '—';
    const status = (p.status || 'pending').replace(/_/g, ' ');
    
    return [
      tenantName,
      unitInfo,
      propertyName,
      `R ${Number(amount).toLocaleString('en-ZA')}`,
      dueDate,
      paidDate,
      status.charAt(0).toUpperCase() + status.slice(1),
    ];
  });
  
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: tableStartY + 12,
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: black,
      textColor: lightGray,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 22 },
      2: { cellWidth: 32 },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 22 },
    },
    didParseCell: function(data) {
      if (data.column.index === 6 && data.row.section === 'body') {
        const status = data.cell.raw;
        if (status === 'Paid') {
          data.cell.styles.textColor = green;
        } else if (status === 'Pending' || status === 'Pending Approval') {
          data.cell.styles.textColor = amber;
        } else if (status === 'Late' || status === 'Collections' || status === 'Rejected') {
          data.cell.styles.textColor = red;
        }
      }
      if (data.column.index === 3 && data.row.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(14, doc.internal.pageSize.height - 16, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 16);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Chihwa Rentals — Landlord Portal`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  const filename = `Chihwa_Rentals_Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}