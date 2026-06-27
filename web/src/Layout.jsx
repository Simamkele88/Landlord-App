/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './App';
import { Icon } from './components/Icon';
import { c as C } from './styles/theme';
import HeaderBar from './components/HeaderBar';

const API = "http://localhost:4000";
const SIDEBAR_W = 240;
const SIDEBAR_COL_W = 64;

function Badge({ count, color = C.gold }) {
  if (!count) return null;
  const bg = color === 'red' ? C.red : C.gold;
  const fg = color === 'red' ? C.white : C.black;
  return (
    <span style={{
      marginLeft: 'auto', background: bg, color: fg,
      fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
      fontWeight: 700, padding: '0.1rem 0.42rem', borderRadius: '10px',
      lineHeight: 1.4, flexShrink: 0,
    }}>
      {count}
    </span>
  );
}

function NavItem({ iconName, label, path, active, badge, badgeColor, collapsed, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : '0.65rem',
        padding: collapsed ? '0.65rem 0' : '0.55rem 0.9rem',
        margin: collapsed ? '0 0.5rem' : '0 0.5rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: 'pointer', borderRadius: '3px',
        background: active ? 'rgba(232,160,18,0.08)' : hovered ? 'rgba(245,240,232,0.03)' : 'transparent',
        transition: 'background 0.15s',
        position: 'relative',
      }}
    >
      <Icon name={iconName} size={16} color={active ? C.gold : hovered ? C.white : 'rgba(245,240,232,0.38)'} style={{ transition: 'color 0.15s', flexShrink: 0 }} />
      {!collapsed && (
        <span style={{
          fontSize: '0.78rem', fontWeight: active ? 500 : 400,
          color: active ? C.gold : hovered ? C.white : 'rgba(245,240,232,0.4)',
          transition: 'color 0.15s', flex: 1, whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
      {!collapsed && <Badge count={badge} color={badgeColor} />}
      {collapsed && hovered && (
        <div style={{
          position: 'fixed', left: SIDEBAR_COL_W + 8, zIndex: 300,
          background: C.muted2, border: `1px solid ${C.border}`,
          padding: '0.4rem 0.8rem', borderRadius: '3px',
          fontFamily: "'Space Mono', monospace", fontSize: '0.68rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: C.white, whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {label}{badge ? <span style={{ marginLeft: '0.5rem', color: badgeColor === 'red' ? C.red : C.gold }}>{badge}</span> : null}
        </div>
      )}
    </div>
  );
}

function NavGroup({ title, items, collapsed, currentPath, navigate }) {
  return (
    <div style={{ marginBottom: collapsed ? '0.25rem' : '0.6rem' }}>
      {!collapsed && (
        <div style={{
          padding: '0.35rem 0.9rem', marginBottom: '0.15rem',
          fontSize: '0.58rem', fontWeight: 600,
          fontFamily: "'Space Mono', monospace",
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.18)',
        }}>
          {title}
        </div>
      )}
      {collapsed && (
        <div style={{
          height: 1, background: C.border, margin: '0.5rem 0.9rem',
        }} />
      )}
      {items.map(item => (
        <NavItem
          key={item.label}
          iconName={item.icon}
          label={item.label}
          path={item.path}
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
    } catch {}
  }, []);

  useEffect(() => {
    if (token) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 60000); // Refresh every minute
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
  const avatarBg = isLandlord ? 'rgba(232,160,18,0.15)' : 'rgba(58,143,212,0.15)';
  const avatarColor = isLandlord ? C.gold : C.blue;

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
      ],
    },
    {
      title: "Tenants",
      items: [
        { icon: 'users', label: 'All Tenants', path: '/landlord/tenants' },
        { icon: 'file-text', label: 'Leases', path: '/landlord/leases' },
      ],
    },
    {
      title: "People",
      items: [
        { icon: 'caretakers', label: 'Caretakers', path: '/landlord/caretakers' },
      ],
    },
    {
      title: "Payments",
      items: [
        { icon: 'credit-card', label: 'All Payments', path: '/landlord/payments' },
        { icon: 'id-card', label: 'Repayment Plans', path: '/landlord/payments/plans' },
        { icon: 'settings', label: 'Payment Settings', path: '/landlord/payments/settings' },
      ],
    },
    {
      title: "Issues",
      items: [
        { icon: 'wrench', label: 'Maintenance', path: '/landlord/maintenance' },
        { icon: 'message-square', label: 'Complaints', path: '/landlord/complaints' },
        { icon: 'alert-triangle', label: 'Collections', path: '/landlord/collections' },
      ],
    },
    {
      title: "Insights",
      items: [
        { icon: 'file-text', label: 'Reports', path: '/landlord/reports' },
        { icon: 'messages', label: 'Messages', path: '/landlord/messages' },
        { icon: 'bell', label: 'Notifications', path: '/landlord/notifications', badge: unreadNotifications, badgeColor: unreadNotifications > 0 ? 'red' : 'gold' },
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
  ];

  const navGroups = isLandlord ? LANDLORD_NAV : CARETAKER_NAV;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.black, color: C.white, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; overflow-x: hidden; }
        body::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 9999; opacity: 0.4; }
        input:focus { border-color: ${C.borderFocus} !important; }
        .sidebar-logout:hover { background: rgba(224,90,74,0.08) !important; color: ${C.redLight} !important; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>

      <div className="mobile-overlay" style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }}
        onClick={() => setCollapsed(true)} />

      <nav className={`sidebar ${collapsed ? '' : 'open'}`} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: w, zIndex: 100,
        background: C.muted2, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease, transform 0.25s ease', overflow: 'hidden',
      }}>
        <div style={{
          padding: collapsed ? '1.2rem 0' : '1.3rem 1.2rem 1rem',
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed ? (
            <>
              <span 
                onClick={() => navigate(isLandlord ? '/landlord/dashboard' : '/caretaker/dashboard')}
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.35rem', letterSpacing: '0.06em', color: C.white, cursor: 'pointer' }}>
                Chihwa<span style={{ color: C.gold }}>Rentals</span>
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setCollapsed(true); }} 
                style={{ 
                  background: 'rgba(245,240,232,0.04)', border: `1px solid ${C.border}`, cursor: 'pointer', 
                  padding: '5px 7px', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.04)'; }}
                title="Collapse sidebar">
                <Icon name="chevron-left" size={14} color="rgba(245,240,232,0.5)" />
              </button>
            </>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setCollapsed(false); }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
              title="Expand sidebar">
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '0.04em', color: C.gold }}>CR</span>
            </button>
          )}
        </div>

        {!collapsed && (
          <div style={{
            padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.7rem',
            borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem' }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.3)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', marginTop: '1px' }}>{roleLabel}</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ padding: '0.7rem 0', display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem' }}>
              {initials}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '0.6rem', paddingBottom: '0.5rem' }}>
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

        <div style={{ borderTop: `1px solid ${C.border}`, flexShrink: 0, padding: '0.25rem 0' }}>
          <div className="sidebar-logout" onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '0.6rem',
            padding: collapsed ? '0.6rem 0' : '0.55rem 1.2rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer', color: 'rgba(245,240,232,0.25)',
            transition: 'background 0.15s, color 0.15s', fontSize: '0.75rem',
          }} title={collapsed ? 'Logout' : undefined}>
            <Icon name="logout" size={15} color="inherit" />
            {!collapsed && <span>Logout</span>}
          </div>
        </div>
      </nav>

      <div className="main-content" style={{ flex: 1, marginLeft: w, transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <HeaderBar user={user} onMenuClick={() => setCollapsed(!collapsed)} />
        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}