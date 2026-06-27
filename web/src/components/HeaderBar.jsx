/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Icon } from './Icon';
import { c as C } from '../styles/theme';

const API = "http://localhost:4000";

const NOTIF_ICONS = {
  payment_due:       { icon: 'credit-card', color: C.redLight },
  payment_received:  { icon: 'credit-card', color: C.gold },
  payment_approved:  { icon: 'check-circle', color: C.greenLight },
  payment_rejected:  { icon: 'x-circle', color: C.redLight },
  lease_expiring:    { icon: 'calendar', color: C.blue },
  lease_expired:     { icon: 'calendar', color: C.redLight },
  maintenance_update:{ icon: 'wrench', color: C.purple },
  complaint_update:  { icon: 'message-square', color: '#f59e0b' },
  message_received:  { icon: 'messages', color: C.gold },
  document_uploaded: { icon: 'file', color: C.blue },
  account_created:   { icon: 'user-plus', color: C.greenLight },
  account_status:    { icon: 'shield', color: C.purple },
  property_assigned: { icon: 'home', color: C.gold },
  system:            { icon: 'bell', color: 'rgba(245,240,232,0.3)' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

export default function HeaderBar({ user, onMenuClick }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const addRef = useRef(null);

  const unreadCount = notifications.filter(function(n) { return !n.is_read; }).length;

  // Fetch real notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoadingNotifs(true);
      const { data } = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((data.notifications || []).slice(0, 20));
    } catch (err) {
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(function() {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (addRef.current && !addRef.current.contains(e.target)) {
        setAddOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  async function markAllRead() {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(function(prev) { return prev.map(function(n) { return { ...n, is_read: true }; }); });
    } catch {}
  }

  async function markOneRead(notifId) {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(function(prev) { 
        return prev.map(function(n) { return n.id === notifId ? { ...n, is_read: true } : n; }); 
      });
    } catch {}
  }

  const isLandlord = user && user.role === 'landlord';
  const basePath = isLandlord ? '/landlord' : '/caretaker';

  const searchResults = searchQuery.length >= 2 ? [
    { type: 'tenant', label: 'Search tenants...', sub: 'Find a tenant by name', path: basePath + '/tenants' },
    { type: 'payment', label: 'Search payments...', sub: 'Find payments', path: basePath + '/payments' },
    { type: 'unit', label: 'Search units...', sub: 'Find a unit', path: basePath + '/units' },
    { type: 'complaint', label: 'Search complaints...', sub: 'Find complaints', path: basePath + '/complaints' },
  ] : [];

  const addOptions = [
    { icon: 'user-plus', label: 'Add Tenant', path: basePath + '/tenants' },
    { icon: 'home', label: 'Add Unit', path: basePath + '/units' },
    { icon: 'wrench', label: 'Log Maintenance', path: basePath + '/maintenance' },
  ];

  function handleSearchSelect(path) {
    const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    navigate(path + searchParam);
    setSearchOpen(false);
    setSearchQuery('');
  }

  return (
    <header style={{
      height: 70, background: C.muted2, borderBottom: '1px solid ' + C.border,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', gap: '1rem', flexShrink: 0, zIndex: 50,
      position: 'sticky', top: 0,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .header-dropdown { animation: fadeIn 0.15s ease; }
        .header-input:focus { border-color: ${C.borderFocus || C.gold} !important; }
        .header-scroll::-webkit-scrollbar { width: 3px; }
        .header-scroll::-webkit-scrollbar-track { background: transparent; }
        .header-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>

      {/* LEFT — Mobile menu toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <button onClick={onMenuClick} style={{
          width: 34, height: 34, borderRadius: '6px',
          background: C.black, border: '1px solid ' + C.border,
          color: 'rgba(245,240,232,0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.15s, border-color 0.15s',
        }}
          onMouseEnter={function(e) { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.3)'; }}
          onMouseLeave={function(e) { e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; e.currentTarget.style.borderColor = C.border; }}
          title="Toggle sidebar">
          <Icon name="menu" size={16} />
        </button>
      </div>

      {/* RIGHT — Search, Notifications, Add, Settings, Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

        {/* SEARCH */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={function(e) { 
                setSearchQuery(e.target.value); 
                if (e.target.value.length >= 2) setSearchOpen(true);
                else setSearchOpen(false);
              }}
              onFocus={function() { 
                if (searchQuery.length >= 2) setSearchOpen(true); 
              }}
              className="header-input"
              style={{
                width: 220, padding: '0.45rem 0.8rem 0.45rem 2rem',
                borderRadius: '3px', background: C.black,
                border: '1px solid ' + C.border, color: C.white,
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.74rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button onClick={function() { setSearchQuery(''); setSearchOpen(false); }} style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(245,240,232,0.3)', padding: '2px',
              }}>
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          {searchOpen && (
            <div className="header-dropdown" style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 320,
              background: C.muted2, border: '1px solid ' + C.border,
              borderRadius: '6px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ padding: '0.6rem 0.9rem', borderBottom: '1px solid ' + C.border }}>
                <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Search for &quot;{searchQuery}&quot;
                </span>
              </div>
              {searchResults.map(function(result, i) {
                const iconName = result.type === 'tenant' ? 'user' : 
                                 result.type === 'payment' ? 'credit-card' : 
                                 result.type === 'complaint' ? 'message-square' : 'home';
                return (
                  <div key={i} onClick={function() { handleSearchSelect(result.path); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.9rem',
                    cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? '1px solid ' + C.border : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = C.muted; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '4px',
                      background: result.type === 'tenant' ? 'rgba(232,160,18,0.08)' :
                                  result.type === 'payment' ? 'rgba(58,143,212,0.08)' :
                                  'rgba(245,240,232,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name={iconName} size={13} color={result.type === 'tenant' ? C.gold : 'rgba(245,240,232,0.4)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, color: C.white }}>{result.label}</p>
                      <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: "'Space Mono', monospace" }}>{result.sub}</p>
                    </div>
                    <Icon name="chevronRight" size={12} color="rgba(245,240,232,0.2)" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={function() { 
            setNotifOpen(!notifOpen); 
            if (!notifOpen) fetchNotifications();
          }} style={{
            width: 34, height: 34, borderRadius: '6px', background: notifOpen ? C.muted : C.black,
            border: '1px solid ' + (notifOpen ? C.gold : C.border), cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'border-color 0.15s',
          }}>
            <Icon name="bell" size={15} color={notifOpen ? C.gold : 'rgba(245,240,232,0.35)'} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 16, height: 16, borderRadius: '8px',
                background: C.redLight || '#E05A4A', color: C.white,
                fontSize: '0.55rem', fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 0.25rem', border: '2px solid ' + C.muted2,
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="header-dropdown" style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 380,
              background: C.muted2, border: '1px solid ' + C.border,
              borderRadius: '6px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', borderBottom: '1px solid ' + C.border }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>Notifications</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ fontSize: '0.62rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="header-scroll" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {loadingNotifs ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(245,240,232,0.2)' }}>
                    <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(245,240,232,0.2)' }}>
                    <Icon name="bell" size={24} style={{ marginBottom: '0.4rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.7rem' }}>No notifications</p>
                  </div>
                ) : (
                  notifications.map(function(notif) {
                    var ncfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
                    return (
                      <div key={notif.id} onClick={function() { if (!notif.is_read) markOneRead(notif.id); }} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                        padding: '0.75rem 1rem', cursor: 'pointer',
                        borderBottom: '1px solid ' + C.border,
                        background: !notif.is_read ? 'rgba(232,160,18,0.03)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = C.muted; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = !notif.is_read ? 'rgba(232,160,18,0.03)' : 'transparent'; }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
                          background: ncfg.color + '15', border: '1px solid ' + ncfg.color + '25',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name={ncfg.icon} size={15} color={ncfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: !notif.is_read ? 600 : 400, color: C.white, lineHeight: 1.4, marginBottom: '2px' }}>{notif.title}</p>
                          <p style={{ fontSize: '0.72rem', color: !notif.is_read ? 'rgba(245,240,232,0.6)' : 'rgba(245,240,232,0.4)', lineHeight: 1.3, marginBottom: '3px' }}>
                            {notif.message_}
                          </p>
                          <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)', fontFamily: "'Space Mono', monospace" }}>{timeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: '5px' }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ borderTop: '1px solid ' + C.border }}>
                <button onClick={function() { navigate(basePath + '/notifications'); setNotifOpen(false); }} style={{
                  width: '100%', padding: '0.6rem', textAlign: 'center',
                  fontSize: '0.65rem', fontWeight: 500, color: C.gold,
                  fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textTransform: 'uppercase',
                }}>
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QUICK ADD */}
        {isLandlord && (
          <div ref={addRef} style={{ position: 'relative' }}>
            <button onClick={function() { setAddOpen(!addOpen); }} style={{
              width: 34, height: 34, borderRadius: '6px',
              background: C.gold, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.black, transition: 'opacity 0.15s',
            }}
              onMouseEnter={function(e) { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={function(e) { e.currentTarget.style.opacity = '1'; }}>
              <Icon name="plus" size={16} />
            </button>

            {addOpen && (
              <div className="header-dropdown" style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 200,
                background: C.muted2, border: '1px solid ' + C.border,
                borderRadius: '6px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                overflow: 'hidden', zIndex: 200,
              }}>
                {addOptions.map(function(opt, i) {
                  return (
                    <div key={i} onClick={function() { navigate(opt.path); setAddOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.6rem 0.9rem', cursor: 'pointer',
                      borderBottom: i < addOptions.length - 1 ? '1px solid ' + C.border : 'none',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = C.muted; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
                      <Icon name={opt.icon} size={14} color="rgba(245,240,232,0.4)" />
                      <span style={{ fontSize: '0.75rem', color: C.white }}>{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        <button onClick={function() { navigate(basePath + '/settings'); }} style={{
          width: 34, height: 34, borderRadius: '6px',
          background: C.black, border: '1px solid ' + C.border,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(245,240,232,0.35)', transition: 'color 0.15s, border-color 0.15s',
        }}
          onMouseEnter={function(e) { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.3)'; }}
          onMouseLeave={function(e) { e.currentTarget.style.color = 'rgba(245,240,232,0.35)'; e.currentTarget.style.borderColor = C.border; }}
          title="Settings">
          <Icon name="settings" size={16} />
        </button>

        {/* USER AVATAR */}
        <button onClick={function() { navigate(basePath + '/settings'); }} style={{
          width: 34, height: 34, borderRadius: '50%',
          background: isLandlord ? 'rgba(232,160,18,0.12)' : 'rgba(58,143,212,0.12)',
          color: isLandlord ? C.gold : C.blue,
          border: 'none', cursor: 'pointer',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={function(e) { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={function(e) { e.currentTarget.style.opacity = '1'; }}>
          {user ? (user.first_name || '').charAt(0).toUpperCase() + (user.last_name || '').charAt(0).toUpperCase() : 'U'}
        </button>
      </div>
    </header>
  );
}