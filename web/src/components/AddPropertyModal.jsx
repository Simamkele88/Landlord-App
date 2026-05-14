/* eslint-disable no-unused-vars */
// ADD PROPERTY MODAL COMPONENT
import { useState } from 'react';
import { exportToCSV, generatePaymentSummary } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExport';
import { usePayments } from '../contexts/PaymentsContext';
import { useToast } from '../contexts/ToastContext';

export default function AddPropertyModal({ onClose ,onAdd }) {
    
  const [formData, setFormData] = useState({
    name:"",
    units:"",
    totalTenant :"",
    DateCreated: "",
    Located :""
  });

  function handleChange(e){
    const {name, value} = e.target;
    setFormData(prev =>({
      ...prev,[name]: value
    }));
  }

  function handleSubmit(){
    onAdd(formData);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 space-y-3">

        <h2 className="text-lg font-semibold">Add Property</h2>

        <input name="name" placeholder="Property Name" onChange={handleChange} className="w-full border p-2 rounded" />
        <input name="units" placeholder="Units" onChange={handleChange} className="w-full border p-2 rounded" />
        <input name="totalTenant" placeholder="Total Tenants" onChange={handleChange} className="w-full border p-2 rounded" />
        <input name="Located" placeholder="Location" onChange={handleChange} className="w-full border p-2 rounded" />
        <input type="date" name="DateCreated" onChange={handleChange} className="w-full border p-2 rounded" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded">
            Cancel
          </button>

          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
            Add
          </button>
        </div>

      </div>
    </div>
  ); 
}