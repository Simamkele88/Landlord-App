/* eslint-disable no-unused-vars */
// PROPERTIES DASHBOARD FOR LANDLORDS, ALLOWS LANDLORDS TO VIEW AND MANAGE THEIR PROPERTIES
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from '../../../contexts/ToastContext';
import {useState} from 'react';
import AddPropertyModal from "../../../components/AddPropertyModal";

function PropertiesDetails(){
    return(
      <>
      <label>Name : </label>
      <input> </input>
      <label> Number Of units   : </label>
      <input> </input>
      <label>Number Of Tenant: </label>
      <input> </input>
      <label>Location : </label>
      <input> </input>
      <label>Date : </label>
      <input type='Date' > </input>
      
      </>
    );
       
}

export default function PropertyDashboard() {

    /**Creating hard coded values for properties */
const [properties, setProperties]  = useState([
  {
    name:"Gray Town",
    units : 10,
    totalTenant : 20,
    DateCreated : "2026/04/10",
    Located : "Johannesburg",
 },
 {
    name:"Yoeville",
    units : 20,
    totalTenant : 35,
    DateCreated : "2020/03/10",
    Located : "Johannesburg",
 },
 {
    name:"Aesthetic touch",
    units : 15,
    totalTenant : 30,
    DateCreated : "2020/12/10",
    Located : "Pretoria",
 },
 {
    name:"Last Lands",
    units : 10,
    totalTenant : 5,
    DateCreated : "2021/03/10",
    Located : "Durban",
 },
]);
  
  //const { user, logout } = useAuth();
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useDocumentTitle("Properties");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleAddProperty(newProperty){
       setProperties(prev => [...prev, newProperty]);
  }

  function testFunction(){
       const value = prompt("Enter Property Name");
        let newProp  = {
            name: value,
            units: 10,
            totalTenant : 5,
            DateCreated: "2016/05/20",
            Located: "witBank"

        };
        setProperties(prev => [...prev, newProp]);
  }


  return (
    <>
    
          <button  onClick={() => setShowPropertyModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Add Property
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
           
            </div>
          <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for a property"
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Number of Units</th>
                  <th className="px-6 py-3">Total tenants</th>
                  <th className="px-6 py-3">Date Created</th>
                  <th className="px-6 py-3">Location </th>
                  <th className="px-6 py-3">Edit </th>
                  <th className="px-6 py-3">Remove</th>
                  
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {properties.map((pro, index) => (
                  <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {pro.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {pro.units}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {pro.totalTenant}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {pro.DateCreated}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {pro.Located}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        Edit property
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        Remove Property
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              {showPropertyModal && (
            <AddPropertyModal 
              onClose={() => setShowPropertyModal(false)}
              onAdd={handleAddProperty}
            />
          )}
          </div>

    </>
  )
 
}