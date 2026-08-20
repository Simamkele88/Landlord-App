import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  FiChevronRight, FiFileText, FiCreditCard, FiRepeat, FiSettings,
} from "react-icons/fi";
import { MdEditDocument } from "react-icons/md";

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const TABS = [
  { path: "invoices", label: "Invoices", icon: FiFileText },
  { path: "deposits", label: "Deposits", icon: MdEditDocument },
  { path: "history", label: "Payments", icon: FiCreditCard },
  { path: "plans", label: "Repayment Plans", icon: FiRepeat },
  { path: "settings", label: "Settings", icon: FiSettings },
];

export default function PaymentsLayout() {
  const location = useLocation();
  if (location.pathname.replace(/\/$/, "") === "/landlord/payments") {
    return <Navigate to="invoices" replace />;
  }

  return (
    <div style={{
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: FONT,
      color: '#000',
    }}>
      <style>{`
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '0.75rem',
        fontSize: '14px',
        fontWeight: 400,
        color: '#333',
        padding: '0.55rem 0.8rem',
        background: '#fdfdfd',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Payments</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd',
        border: '1px solid #dfe3e8',
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          background: '#e9ecef',
        }}>
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.8rem',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#000' : '#333',
                  background: isActive ? '#fdfdfd' : 'transparent',
                  border: isActive ? '1px solid #e9ecef' : '1px solid transparent',
                  borderBottom: isActive ? '1px solid #fdfdfd' : 'none',
                  borderTop: isActive ? '2px solid #3498db' : '2px solid transparent',
                  textDecoration: 'none',
                  marginBottom: isActive ? '-1px' : '0',
                  position: 'relative',
                  zIndex: isActive ? 2 : 1,
                })}
              >
                <TabIcon size={14} />
                {tab.label}
              </NavLink>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid #e9ecef' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}