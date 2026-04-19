/* eslint-disable no-unused-vars */
// This component is a modal for generating and exporting payment reports in CSV or PDF format.
//  It allows users to select a date range and export their payment data with a summary preview. 
// The modal handles export logic, shows loading states, and provides feedback on success or failure of exports.
import { useState } from 'react';
import { exportToCSV, generatePaymentSummary } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExport';
import { usePayments } from '../contexts/PaymentsContext';
import { useToast } from '../contexts/ToastContext';

export default function AddPropertyModal({ onClose }) {
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
                  R unfortunate
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Collected</p>
                <p className="text-xl font-bold text-green-600">
                  R Nathan Smith
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Collection Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  banaki%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Records</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  
                </p>
              </div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* CSV Option */}
              <button
               
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
                    <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                      .csv file
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
          
          
            <div className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating 
            </div>
          
        </div>
      </div>
    </div>
  );
}