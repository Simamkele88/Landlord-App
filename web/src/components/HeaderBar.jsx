/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Icon } from './Icon';
import { FiSearch, FiBell, FiPlus, FiSettings, FiUser, FiLogOut, FiClock, FiCommand } from 'react-icons/fi';

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const NOTIF_ICONS = {
  payment_due: { icon: 'credit-card', color: '#9e3a3a' },
  payment_received: { icon: 'credit-card', color: '#8b6e1a' },
  payment_approved: { icon: 'check-circle', color: '#2b7a4b' },
  payment_rejected: { icon: 'x-circle', color: '#9e3a3a' },
  lease_expiring: { icon: 'calendar', color: '#2c6b9b' },
  lease_expired: { icon: 'calendar', color: '#9e3a3a' },
  maintenance_update: { icon: 'wrench', color: '#54326b' },
  complaint_update: { icon: 'message-square', color: '#c25e1a' },
  message_received: { icon: 'messages', color: '#8b6e1a' },
  document_uploaded: { icon: 'file', color: '#2c6b9b' },
  account_created: { icon: 'user-plus', color: '#2b7a4b' },
  account_status: { icon: 'shield', color: '#54326b' },
  property_assigned: { icon: 'home', color: '#8b6e1a' },
  system: { icon: 'bell', color: '#5f6b7a' },
};

const SEARCH_CATEGORY_META = {
  tenants: {
    label: 'Tenants', icon: 'user', color: '#8b6e1a',
    getPath: (item) => `/tenants/${item.id}`,
  },
  units: {
    label: 'Units', icon: 'home', color: '#2c6b9b',
    getPath: (item) => `/units/${item.id}`,
  },
  invoices: {
    label: 'Invoices', icon: 'file-text', color: '#2b7a4b',
    getPath: (item) => `/payments/invoices/${item.id}`,
  },
  payments: {
    label: 'Payments', icon: 'credit-card', color: '#2c6b9b',
    getPath: (item) => `/payments/${item.id}`,
  },
  complaints: {
    label: 'Complaints', icon: 'message-square', color: '#c25e1a',
    getPath: (item) => `/complaints/${item.id}`,
  },
  maintenance: {
    label: 'Maintenance', icon: 'wrench', color: '#54326b',
    getPath: (item) => `/maintenance/${item.id}`,
  },
};

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT = 5;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
  } catch {
    return [];
  }
}

function pushRecentSearch(term) {
  if (!term || term.length < 2) return;
  const existing = getRecentSearches().filter(s => s.toLowerCase() !== term.toLowerCase());
  const updated = [term, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

function flattenResults(results) {
  const flat = [];
  Object.keys(results || {}).forEach(category => {
    (results[category] || []).forEach(item => {
      flat.push({ category, item });
    });
  });
  return flat;
}

function getResultLabel(category, item) {
  switch (category) {
    case 'tenants': return item.full_name;
    case 'units': return `Unit ${item.unit_number}`;
    case 'invoices': return item.invoice_number;
    case 'payments': return item.bank_reference || `Payment · ${item.tenant_name}`;
    case 'complaints': return item.subject;
    case 'maintenance': return item.title;
    default: return 'Result';
  }
}

function getResultSub(category, item) {
  switch (category) {
    case 'tenants': return item.unit_number ? `Unit ${item.unit_number}` : item.email;
    case 'units': { const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1); return `${item.property_name} · ${statusLabel}`; }
    case 'invoices': return `R${Number(item.amount_due).toFixed(2)} · ${item.status}`;
    case 'payments': return `R${Number(item.amount_paid).toFixed(2)} · ${item.status}`;
    case 'complaints': return `${item.category} · ${item.status}`;
    case 'maintenance': return `${item.request_number} · ${item.status}`;
    default: return '';
  }
}
export default function HeaderBar({ user, onMenuClick }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const [activeIndex, setActiveIndex] = useState(-1);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const addRef = useRef(null);
  const profileRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const flatResults = flattenResults(searchResults);
  const hasQuery = searchQuery.length >= 2;

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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (addRef.current && !addRef.current.contains(e.target)) setAddOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runSearch = useCallback(async (value) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API}/search`, {
        params: { q: value },
        headers: { Authorization: `Bearer ${token}` },
        signal: abortRef.current.signal,
      });
      setSearchResults(data.results || {});
      setActiveIndex(-1);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Search failed:', err);
        setSearchResults({});
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleSearchChange(value) {
    setSearchQuery(value);
    setSearchOpen(true);
    clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSearchResults({});
      abortRef.current?.abort();
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(value), 250);
  }

  function handleResultSelect(category, item) {
    const meta = SEARCH_CATEGORY_META[category];
    pushRecentSearch(searchQuery);
    setRecentSearches(getRecentSearches());
    navigate(`${basePath}${meta.getPath(item)}`);
    closeSearch();
  }

  function handleRecentSelect(term) {
    setSearchQuery(term);
    handleSearchChange(term);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults({});
    setActiveIndex(-1);
  }

  function handleSearchKeyDown(e) {
    if (!searchOpen || !hasQuery || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const { category, item } = flatResults[activeIndex];
      handleResultSelect(category, item);
    }
  }

  async function markAllRead() {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { }
  }

  async function markOneRead(notifId) {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/notifications/${notifId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch { }
  }

  const isLandlord = user && user.role === 'landlord';
  const basePath = isLandlord ? '/landlord' : '/caretaker';

  const addOptions = [
    { icon: 'user-plus', label: 'Add Tenant', path: basePath + '/tenants/create' },
    { icon: 'home', label: 'Add Unit', path: basePath + '/units' },
  ];

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const iconBtnStyle = {
    width: 34,
    height: 34,
    borderRadius: '6px',
    background: '#fdfdfd',
    border: '1px solid #ccc',
    color: '#555',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, border-color 0.15s, background 0.15s',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#fdfdfd',
    border: '1px solid #e9ecef',
    borderRadius: '3px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 200,
    animation: 'fadeIn 0.15s ease',
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.6rem 0.9rem',
    cursor: 'pointer',
    transition: 'background 0.1s',
    fontSize: '0.85rem',
    color: '#000',
  };

  let flatCursor = -1;

  return (
    <header style={{
      height: 70,
      background: '#fdfdfd',
      borderBottom: '1px solid #e9ecef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      gap: '1rem',
      flexShrink: 0,
      zIndex: 50,
      position: 'sticky',
      top: 0,
      fontFamily: FONT,
      fontWeight: 400,
      color: '#000',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .header-input:focus { border-color: #3498db !important; }
        .header-scroll::-webkit-scrollbar { width: 3px; }
        .header-scroll::-webkit-scrollbar-track { background: transparent; }
        .header-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
        .search-result-active { background: #eef4fa !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <button onClick={onMenuClick} style={{ ...iconBtnStyle, borderRadius: '6px' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#999'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#ccc'; }}
          title="Toggle sidebar">
          <Icon name="menu" size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

        {/* SEARCH */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search anything..."
              autoComplete="off"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              className="header-input"
              style={{
                width: 240,
                padding: '0.45rem 3.2rem 0.45rem 2rem',
                borderRadius: '3px',
                background: '#fdfdfd',
                border: '1px solid #ccc',
                color: '#000',
                fontFamily: FONT,
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {!searchQuery && (
              <span style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', gap: '2px',
                fontSize: '0.7rem', color: '#999', border: '1px solid #ddd',
                borderRadius: '3px', padding: '0.1rem 0.35rem', pointerEvents: 'none',
              }}>
                <FiCommand size={10} />K
              </span>
            )}
            {searchQuery && (
              <button onClick={() => closeSearch()} style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '2px',
              }}>
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          {searchOpen && (
            <div className="header-dropdown" style={{ ...dropdownStyle, width: 360 }}>

              {/* Empty state: recent searches */}
              {!hasQuery && (
                <>
                  <div style={{ padding: '0.6rem 0.9rem', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '0.75rem', color: '#555', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Recent Searches
                    </span>
                  </div>
                  {recentSearches.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                      Start typing to search tenants, units, invoices, payments, complaints, and maintenance requests.
                    </div>
                  ) : (
                    recentSearches.map((term, i) => (
                      <div key={i} onClick={() => handleRecentSelect(term)} style={dropdownItemStyle}
                        onMouseEnter={e => e.currentTarget.style.background = '#f4f5f6'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FiClock size={13} color="#999" />
                        <span style={{ fontSize: '0.85rem', color: '#000' }}>{term}</span>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Loading */}
              {hasQuery && searchLoading && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                </div>
              )}

              {/* Results */}
              {hasQuery && !searchLoading && flatResults.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                  No results for &quot;{searchQuery}&quot;
                </div>
              )}

              {hasQuery && !searchLoading && Object.keys(searchResults).map(category => {
                const items = searchResults[category];
                if (!items || items.length === 0) return null;
                const meta = SEARCH_CATEGORY_META[category];

                return (
                  <div key={category}>
                    <div style={{ padding: '0.5rem 0.9rem 0.3rem', fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {meta.label}
                    </div>
                    {items.map(item => {
                      flatCursor += 1;
                      const idx = flatCursor;
                      const isActive = idx === activeIndex;
                      return (
                        <div
                          key={`${category}-${item.id}`}
                          className={isActive ? 'search-result-active' : ''}
                          onClick={() => handleResultSelect(category, item)}
                          onMouseEnter={e => { setActiveIndex(idx); }}
                          style={dropdownItemStyle}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: '4px',
                            background: meta.color + '15',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Icon name={meta.icon} size={13} color={meta.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#000' }}>
                              {getResultLabel(category, item)}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#555' }}>
                              {getResultSub(category, item)}
                            </p>
                          </div>
                          <Icon name="chevronRight" size={12} color="#999" />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
            style={{ ...iconBtnStyle, background: notifOpen ? '#f4f5f6' : '#fdfdfd', borderColor: notifOpen ? '#3498db' : '#ccc' }}>
            <FiBell size={15} color={notifOpen ? '#2c3e50' : '#555'} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 16, height: 16, borderRadius: '8px',
                background: '#9e3a3a', color: '#fff',
                fontSize: '0.55rem', fontWeight: 700,
                fontFamily: FONT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 0.25rem', border: '2px solid #fdfdfd',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="header-dropdown" style={{ ...dropdownStyle, width: 380 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', borderBottom: '1px solid #e9ecef' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#000' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: '#2471a3', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="header-scroll" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {loadingNotifs ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <span style={{ width: 20, height: 20, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    <FiBell size={24} style={{ marginBottom: '0.4rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.85rem' }}>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const ncfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
                    return (
                      <div key={notif.id} onClick={() => { if (!notif.is_read) markOneRead(notif.id); }} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                        padding: '0.75rem 1rem', cursor: 'pointer',
                        borderBottom: '1px solid #f1f3f5',
                        background: !notif.is_read ? '#fafbfc' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f4f5f6'}
                        onMouseLeave={e => e.currentTarget.style.background = !notif.is_read ? '#fafbfc' : 'transparent'}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
                          background: ncfg.color + '15', border: '1px solid ' + ncfg.color + '25',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name={ncfg.icon} size={15} color={ncfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: !notif.is_read ? 600 : 400, color: '#000', lineHeight: 1.4, marginBottom: '2px' }}>{notif.title}</p>
                          <p style={{ fontSize: '0.8rem', color: !notif.is_read ? '#333' : '#555', lineHeight: 1.3, marginBottom: '3px' }}>
                            {notif.body}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#999' }}>{timeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2c3e50', flexShrink: 0, marginTop: '5px' }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ borderTop: '1px solid #e9ecef' }}>
                <button onClick={() => { navigate(basePath + '/notifications'); setNotifOpen(false); }} style={{
                  width: '100%', padding: '0.6rem', textAlign: 'center',
                  fontSize: '0.75rem', fontWeight: 500, color: '#2471a3',
                  fontFamily: FONT, letterSpacing: '0.02em',
                  background: 'transparent', border: 'none', cursor: 'pointer',
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
            <button onClick={() => setAddOpen(!addOpen)} style={{ ...iconBtnStyle, background: '#2c3e50', borderColor: '#2c3e50', color: '#fff' }}>
              <FiPlus size={16} />
            </button>
            {addOpen && (
              <div className="header-dropdown" style={{ ...dropdownStyle, width: 200 }}>
                {addOptions.map((opt, i) => (
                  <div key={i} onClick={() => { navigate(opt.path); setAddOpen(false); }} style={dropdownItemStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4f5f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Icon name={opt.icon} size={14} color="#555" />
                    <span style={{ fontSize: '0.85rem', color: '#000' }}>{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        <button onClick={() => navigate(basePath + '/settings')} style={iconBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#999'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#ccc'; }}
          title="Settings">
          <FiSettings size={16} />
        </button>

        {/* PROFILE */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button onClick={() => setProfileOpen(!profileOpen)} style={{
            ...iconBtnStyle,
            borderRadius: '50%',
            background: isLandlord ? '#faf6ed' : '#e8f0f5',
            borderColor: isLandlord ? '#e5dbb8' : '#b0cfe0',
            color: isLandlord ? '#8b6e1a' : '#2c6b9b',
            fontWeight: 600,
          }}>
            {user ? (user.first_name || '').charAt(0).toUpperCase() + (user.last_name || '').charAt(0).toUpperCase() : 'U'}
          </button>

          {profileOpen && (
            <div className="header-dropdown" style={{ ...dropdownStyle, width: 220 }}>
              <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#000' }}>
                  {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#555' }}>{isLandlord ? 'Landlord' : 'Caretaker'}</p>
              </div>
              <div onClick={() => { navigate(basePath + '/account'); setProfileOpen(false); }} style={dropdownItemStyle}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f5f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <FiUser size={14} color="#555" />
                <span>My Account</span>
              </div>
              <div onClick={() => { navigate(basePath + '/settings'); setProfileOpen(false); }} style={dropdownItemStyle}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f5f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <FiSettings size={14} color="#555" />
                <span>Settings</span>
              </div>
              <div onClick={handleLogout} style={{ ...dropdownItemStyle, color: '#9e3a3a' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fbeaea'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <FiLogOut size={14} color="#9e3a3a" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}