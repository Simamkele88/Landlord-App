import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../../App";

// ─── Page title map (mirrors sidebar nav) ────────────────────────────────────
const PAGE_TITLES = {
  '/landlord/dashboard':        'Dashboard',
  '/landlord/properties':       'Properties',
  '/landlord/units':            'Units',
  '/landlord/tenants':          'Tenants',
  '/landlord/payments':         'Payments',
  '/landlord/maintenance':      'Maintenance',
  '/landlord/complaints':       'Complaints',
  '/landlord/collections':      'Collections',
  '/landlord/caretakers':       'Caretakers',
  '/landlord/messages':         'Messages',
  '/landlord/payments/review':  'Payments-Review',
  '/landlord/payments/receipt': 'Payments-Receipt'
};

// ─── Mock notifications ───────────────────────────────────────────────────────
const INITIAL_NOTIFICATIONS = [
  { id: 1, read: false, icon: 'payment',     text: 'Lerato Mokoena uploaded proof of payment for Unit 2B.',  time: '2 min ago' },
  { id: 2, read: false, icon: 'late',        text: 'Ahmed Patel (Unit 1C) is 14 days overdue — R 7,200.',   time: '1 hr ago'  },
  { id: 3, read: false, icon: 'maintenance', text: 'New maintenance request: Burst pipe in Unit 3A.',        time: '3 hr ago'  },
  { id: 4, read: true,  icon: 'complaint',   text: 'Complaint resolved: Noise disturbance in Unit 5D.',      time: 'Yesterday' },
  { id: 5, read: true,  icon: 'payment',     text: 'Priya Naidoo uploaded proof of payment for Unit 2A.',   time: 'Yesterday' },
];

const ICON_MAP = {
  payment: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
    </svg>
  ),
  late: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  maintenance: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  ),
  complaint: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
};

const ICON_COLORS = {
  payment:     'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  late:        'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  maintenance: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
  complaint:   'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
};

// ─── Dropdown wrapper ─────────────────────────────────────────────────────────
function Dropdown({ children, open, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  return <div ref={ref} className="relative">{children}</div>;
}

// ─── Main TopBar ──────────────────────────────────────────────────────────────
export default function LandlordTopBar() {
  const { user }  = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  function markAllRead() {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }

  function markRead(id) {
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-6 bg-gray-900 border-b border-gray-700">

      {/* ── Left: Page title ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Breadcrumb-style title */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium hidden sm:block">
            Chihwa Rentals
          </p>
          <h1 className="text-white font-semibold text-base sm:text-lg leading-tight truncate">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Search */}
        <div className="relative hidden md:block">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tenants, units..."
            className="pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-52 transition-all"
          />
        </div>

        {/* Notifications */}
        <Dropdown open={notifOpen} onClose={() => setNotifOpen(false)}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* List */}
              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-700">
                {notifications.map(n => (
                  <li
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-700/50
                      ${!n.read ? 'bg-gray-700/30' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${ICON_COLORS[n.icon]}`}>
                      {ICON_MAP[n.icon]}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${n.read ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                        {n.text}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{n.time}</p>
                    </div>
                    {/* Unread dot */}
                    {!n.read && (
                      <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                    )}
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-700 text-center">
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </Dropdown>

        {/* Messages shortcut */}
        <button
          onClick={() => navigate('/landlord/messages')}
          className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Messages"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-700" />

        {/* Profile dropdown */}
        <Dropdown open={profileOpen} onClose={() => setProfileOpen(false)}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-700 transition-colors group"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              L
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 leading-tight">Landlord</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white hidden sm:block transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Identity */}
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              {/* Menu items */}
              <ul className="py-1">
                {[
                  { label: 'My Profile',    icon: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z', to: '/landlord/profile' },
                  { label: 'Settings',      icon: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z', to: '/landlord/settings' },
                ].map(item => (
                  <li key={item.label}>
                    <button
                      onClick={() => { navigate(item.to); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={item.icon} clipRule="evenodd" />
                      </svg>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Logout */}
              <div className="border-t border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </Dropdown>

      </div>
    </header>
  );
}