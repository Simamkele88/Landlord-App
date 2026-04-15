/* eslint-disable no-unused-vars */
// src/components/FullReportModal.jsx
import { useState } from 'react';
import { exportToCSV, generatePaymentSummary } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExport';
import { usePayments } from '../contexts/PaymentsContext';
import { useToast } from '../contexts/ToastContext';

export default function FullReportModal({ onClose }) {
  const { payments } = usePayments();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('current');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // 'csv', 'pdf', null

  const summary = generatePaymentSummary(payments);

  function getFilteredData() {
    let filteredData = payments;
    let rangeText = 'Current Month';
    
    const today = new Date();
    if (dateRange === 'current') {
      filteredData = payments.filter(p => {
        const dueDate = new Date(p.due);
        return dueDate.getMonth() === today.getMonth() && 
               dueDate.getFullYear() === today.getFullYear();
      });
      rangeText = `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
    } else if (dateRange === 'last3') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      filteredData = payments.filter(p => new Date(p.due) >= threeMonthsAgo);
      rangeText = 'Last 3 Months';
    } else if (dateRange === 'last6') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      filteredData = payments.filter(p => new Date(p.due) >= sixMonthsAgo);
      rangeText = 'Last 6 Months';
    } else if (dateRange === 'year') {
      filteredData = payments.filter(p => {
        const dueDate = new Date(p.due);
        return dueDate.getFullYear() === today.getFullYear();
      });
      rangeText = `Year ${today.getFullYear()}`;
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      filteredData = payments.filter(p => {
        const dueDate = new Date(p.due);
        return dueDate >= new Date(customStartDate) && 
               dueDate <= new Date(customEndDate);
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
          showToast(`CSV report exported successfully!`, 'success');
        } else if (format === 'pdf') {
          exportToPDF(filteredData, filteredSummary, rangeText);
          showToast(`PDF report generated successfully!`, 'success');
        }
        
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export report', 'error');
      } finally {
        setExporting(false);
        setExportFormat(null);
      }
    }, 500);
  }

  const { filteredData, rangeText } = getFilteredData();
  const filteredSummary = generatePaymentSummary(filteredData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Export payment data in your preferred format</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          
          {/* Preview Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-5 border border-blue-100 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Report Preview</h4>
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                {rangeText}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Expected</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  R {filteredSummary.totalExpected.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Collected</p>
                <p className="text-xl font-bold text-green-600">
                  R {filteredSummary.totalCollected.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Collection Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  {filteredSummary.collectionRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Records</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {filteredData.length}
                </p>
              </div>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'current', label: 'Current Month' },
                { value: 'last3', label: 'Last 3 Months' },
                { value: 'last6', label: 'Last 6 Months' },
                { value: 'year', label: 'This Year' },
                { value: 'all', label: 'All Time' },
                { value: 'custom', label: 'Custom Range' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDateRange(value)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                    dateRange === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* CSV Option */}
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
                className="relative group"
              >
                <div className="p-6 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-400 transition-all">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-1">CSV Format</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Excel compatible • Easy to edit
                    </p>
                    <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                      .csv file
                    </span>
                  </div>
                </div>
              </button>

              {/* PDF Option */}
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
                className="relative group"
              >
                <div className="p-6 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-red-400 transition-all">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-1">PDF Format</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Professional • Ready to share
                    </p>
                    <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                      .pdf file
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          {exporting && (
            <div className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating {exportFormat?.toUpperCase()}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}