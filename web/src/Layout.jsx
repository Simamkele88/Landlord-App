/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './App';
import {
  FaChartBar, FaBuilding, FaHome, FaFileAlt, FaUsers, FaCreditCard,
  FaExclamationTriangle, FaWrench, FaCommentAlt, FaCog, FaBell,
  FaEnvelope, FaChevronLeft, FaSignOutAlt, FaCircle, FaQuestionCircle
} from 'react-icons/fa';
import { c as C, f as F } from './styles/theme';
import HeaderBar from './components/HeaderBar';

const API = "http://localhost:4000";
const SIDEBAR_W = 200;
const SIDEBAR_COL_W = 60;
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const MONO = '"SF Mono", "Cascadia Code", "Roboto Mono", monospace';

const ICONS = {
  'bar-chart': FaChartBar,
  'building': FaBuilding,
  'home': FaHome,
  'file-text': FaFileAlt,
  'users': FaUsers,
  'credit-card': FaCreditCard,
  'danger': FaExclamationTriangle,
  'wrench': FaWrench,
  'message-square': FaCommentAlt,
  'settings': FaCog,
  'bell': FaBell,
  'messages': FaEnvelope,
  'chevronLeft': FaChevronLeft,
  'logout': FaSignOutAlt,
};

function Badge({ count, color = C.blue }) {
  if (!count) return null;
  const bg = color === 'red' ? C.redLight : C.blue;
  const fg = '#ffffff';
  return (
    <span style={{
      marginLeft: 'auto', background: bg, color: fg,
      fontFamily: MONO, fontSize: '0.6rem',
      fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '10px',
      lineHeight: 1.3, flexShrink: 0,
    }}>
      {count}
    </span>
  );
}

function NavItem({ iconName, label, active, badge, badgeColor, collapsed, onClick }) {
  const [hovered, setHovered] = useState(false);
  const IconComponent = ICONS[iconName] || FaQuestionCircle;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : '0.6rem',
        padding: collapsed ? '0.6rem 0' : '0.45rem 0.8rem',
        margin: collapsed ? '0 0.5rem' : '0 0.4rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: 'pointer', borderRadius: '3px',
        background: active ? 'rgba(52,152,219,0.08)' : hovered ? 'rgba(44,62,80,0.04)' : 'transparent',
        transition: 'background 0.15s',
        position: 'relative',
      }}
    >
      <IconComponent
        size={15}
        color={active ? C.blue : hovered ? '#000' : '#555'}
        style={{ transition: 'color 0.15s', flexShrink: 0 }}
      />
      {!collapsed && (
        <span style={{
          fontSize: '0.85rem', fontWeight: active ? 600 : 400,
          color: active ? C.blue : hovered ? '#000' : '#333',
          transition: 'color 0.15s', flex: 1, whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
      {!collapsed && <Badge count={badge} color={badgeColor} />}
      {collapsed && hovered && (
        <div style={{
          position: 'fixed', left: SIDEBAR_COL_W + 8, zIndex: 300,
          background: '#fdfdfd', border: '1px solid #ddd',
          padding: '0.3rem 0.7rem', borderRadius: '3px',
          fontFamily: MONO, fontSize: '0.65rem',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          color: '#000', whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {label}{badge ? <span style={{ marginLeft: '0.5rem', color: badgeColor === 'red' ? '#9e3a3a' : C.blue }}>{badge}</span> : null}
        </div>
      )}
    </div>
  );
}

function NavGroup({ title, items, collapsed, currentPath, navigate }) {
  return (
    <div style={{ marginBottom: collapsed ? '0.2rem' : '0.5rem' }}>
      {!collapsed && (
        <div style={{
          padding: '0.3rem 0.8rem', marginBottom: '0.1rem',
          fontSize: '0.7rem', fontWeight: 600,
          fontFamily: MONO,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#555',
        }}>
          {title}
        </div>
      )}
      {collapsed && (
        <div style={{ height: 1, background: '#ddd', margin: '0.4rem 0.8rem' }} />
      )}
      {items.map(item => (
        <NavItem
          key={item.label}
          iconName={item.icon}
          label={item.label}
          active={currentPath === item.path || (item.path !== '/landlord/dashboard' && item.path !== '/caretaker/dashboard' && currentPath.startsWith(item.path + '/'))}
          badge={item.badge}
          badgeColor={item.badgeColor}
          collapsed={collapsed}
          onClick={() => navigate(item.path)}
        />
      ))}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const w = collapsed ? SIDEBAR_COL_W : SIDEBAR_W;

  const fetchNotificationCount = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      const unread = (data.notifications || []).filter(n => !n.is_read).length;
      setUnreadNotifications(unread);
    } catch {/* ignore errors */}
  }, []);

  useEffect(() => {
    if (token) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 60000);
      return () => clearInterval(interval);
    }
  }, [token, fetchNotificationCount]);

  if (!token || !user) return <Navigate to="/login" replace />;

  const isLandlord = user.role === 'landlord';
  const isCaretaker = user.role === 'caretaker';
  if (!isLandlord && !isCaretaker) return <Navigate to="/login" replace />;

  const roleLabel = isLandlord ? 'Landlord' : 'Caretaker';
  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || roleLabel;
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarBg = 'rgba(52,152,219,0.10)';
  const avatarColor = C.blue;

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    navigate('/login');
  }

  const LANDLORD_NAV = [
    {
      title: "Overview",
      items: [
        { icon: 'bar-chart', label: 'Dashboard', path: '/landlord/dashboard' },
      ],
    },
    {
      title: "Property",
      items: [
        { icon: 'building', label: 'Properties', path: '/landlord/properties' },
        { icon: 'home', label: 'Units', path: '/landlord/units' },
        { icon: 'file-text', label: 'Leases', path: '/landlord/leases' },
      ],
    },
    {
      title: "People",
      items: [
        { icon: 'users', label: 'Tenants', path: '/landlord/tenants' },
        { icon: 'users', label: 'Caretakers', path: '/landlord/caretakers' },
      ],
    },
    {
      title: "Financial",
      items: [
        { icon: 'credit-card', label: 'Payments', path: '/landlord/payments' },
        { icon: 'danger', label:'Collections', path: '/landlord/collections'},
        { icon: 'file-text', label: 'Reports', path: '/landlord/reports' },
      ],
    },
    {
      title: "Issues",
      items: [
        { icon: 'wrench', label: 'Maintenance', path: '/landlord/maintenance' },
        { icon: 'message-square', label: 'Complaints', path: '/landlord/complaints' },
      ],
    },
    {
      title: "System",
      items: [
        { icon: 'settings', label: 'Settings', path: '/landlord/settings' },
        { icon: 'bell', label: 'Notifications', path: '/landlord/notifications', badge: unreadNotifications, badgeColor: unreadNotifications > 0 ? 'red' : 'gold' },
        { icon: 'messages', label: 'Messages', path: '/landlord/messages' },
      ],
    },
  ];

  const CARETAKER_NAV = [
    {
      title: "Overview",
      items: [
        { icon: 'bar-chart', label: 'Dashboard', path: '/caretaker/dashboard' },
      ],
    },
    {
      title: "Work",
      items: [
        { icon: 'wrench', label: 'Maintenance', path: '/caretaker/maintenance' },
        { icon: 'message-square', label: 'Complaints', path: '/caretaker/complaints' },
      ],
    },
    {
      title: "People",
      items: [
        { icon: 'users', label: 'Tenants', path: '/caretaker/tenants' },
        { icon: 'messages', label: 'Messages', path: '/caretaker/messages' },
      ],
    },
    {
      title: "System",
      items: [
        { icon: 'bell', label: 'Notifications', path: '/caretaker/notifications', badge: unreadNotifications, badgeColor: unreadNotifications > 0 ? 'red' : 'gold' },
      ],
    },
  ];

  const navGroups = isLandlord ? LANDLORD_NAV : CARETAKER_NAV;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa', color: '#000', fontFamily: FONT, fontWeight: 400 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fafafa; overflow-x: hidden; }
        input:focus { border-color: #3498db !important; box-shadow: 0 0 0 2px rgba(52,152,219,0.1); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #fafafa; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #aaa; }
        .sidebar-logout:hover { background: rgba(231,76,60,0.06) !important; color: #9e3a3a !important; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>

      <div className="mobile-overlay" style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(44,62,80,0.5)' }}
        onClick={() => setCollapsed(true)} />

      <nav className={`sidebar ${collapsed ? '' : 'open'}`} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: w, zIndex: 100,
        background: '#fdfdfd', borderRight: '1px solid #e9ecef',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease, transform 0.25s ease', overflow: 'hidden',
      }}>
        <div style={{
          padding: collapsed ? '1rem 0' : '1rem 1rem',
          borderBottom: '1px solid #e9ecef', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed ? (
            <>
              <span 
                onClick={() => navigate(isLandlord ? '/landlord/dashboard' : '/caretaker/dashboard')}
                style={{ fontFamily: FONT, fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.02em', color: '#000', cursor: 'pointer' }}>
                Chihwa<span style={{ color: '#3498db' }}>Rentals</span>
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setCollapsed(true); }} 
                style={{ 
                  background: 'transparent', border: '1px solid #ccc', cursor: 'pointer', 
                  padding: '4px 6px', borderRadius: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f4f5f6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                title="Collapse sidebar">
                <FaChevronLeft size={13} color="#555" />
              </button>
            </>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setCollapsed(false); }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
              title="Expand sidebar">
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: '1rem', letterSpacing: '0.02em', color: '#3498db' }}>CR</span>
            </button>
          )}
        </div>

        {!collapsed && (
          <div style={{
            padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
            borderBottom: '1px solid #e9ecef', flexShrink: 0,
          }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: '0.8rem', fontWeight: 600 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: '0.7rem', color: '#555', fontFamily: MONO, letterSpacing: '0.04em', marginTop: '1px' }}>{roleLabel}</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: '0.7rem', fontWeight: 600 }}>
              {initials}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '0.5rem', paddingBottom: '0.4rem' }}>
          {navGroups.map((group) => (
            <NavGroup
              key={group.title}
              title={group.title}
              items={group.items}
              collapsed={collapsed}
              currentPath={location.pathname}
              navigate={navigate}
            />
          ))}
        </div>

        <div style={{ borderTop: '1px solid #e9ecef', flexShrink: 0, padding: '0.2rem 0' }}>
          <div className="sidebar-logout" onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '0.6rem',
            padding: collapsed ? '0.5rem 0' : '0.45rem 1rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer', color: '#555',
            transition: 'background 0.15s, color 0.15s', fontSize: '0.85rem',
          }} title={collapsed ? 'Logout' : undefined}>
            <FaSignOutAlt size={14} color="inherit" />
            {!collapsed && <span>Logout</span>}
          </div>
        </div>
      </nav>

      <div className="main-content" style={{ flex: 1, marginLeft: w, transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <HeaderBar user={user} onMenuClick={() => setCollapsed(!collapsed)} />
        <main style={{ flex: 1, padding: '1.2rem 1.8rem', overflowY: 'auto', background: '#fafafa' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}