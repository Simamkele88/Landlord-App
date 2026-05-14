// TOP BAR COMPONENT FOR CARETAKER AREA, RENDERED ON ALL CARETAKER PAGES
// AUTHOR: SIMAMKELE WEKEZA

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../../App";

// PAGE TITLE MAPPING BASED ON ROUTE PATH
const PAGE_TITLES = {
  '/caretaker/dashboard':   'Dashboard',
  '/caretaker/maintenance': 'Maintenance',
  '/caretaker/units':       'Units',
  '/caretaker/tenants':     'Tenants',
  '/caretaker/complaints':  'Complaints',
  '/caretaker/messages':    'Messages',
};

// MOCK NOTIFICATIONS
const INITIAL_NOTIFICATIONS = [
  { id: 1, read: false, icon: 'maintenance', text: 'New maintenance request: Burst pipe in Unit 4A.',  time: '5 min ago' },
  { id: 2, read: false, icon: 'complaint',   text: 'Tenant complaint filed by Sipho Dlamini.',          time: '1 hr ago'  },
  { id: 3, read: true,  icon: 'maintenance', text: 'Maintenance #MR-00001 marked as completed.',         time: '3 hr ago'  },
  { id: 4, read: true,  icon: 'message',     text: 'New message from landlord about Unit 2B.',           time: 'Yesterday' },
];

const ICON_MAP = {
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
  message: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  ),
};

const ICON_COLORS = {
  maintenance: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
  complaint:   'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  message:     'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
};

function Dropdown({ children, open, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  return <div ref={ref} className="relative">{children}</div>;
}

// MAIN TOP BAR COMPONENT
export default function CaretakerTopBar() {
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

  function initials(name) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-6 bg-gray-900 border-b border-gray-700">

      {/* LEFT: PAGE TITLE */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium hidden sm:block">
            Chihwa Rentals
          </p>
          <h1 className="text-white font-semibold text-base sm:text-lg leading-tight truncate">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* NOTIFICATIONS */}
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Mark all as read
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-700">
                {notifications.map(n => (
                  <li key={n.id} onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-700/50 ${!n.read ? 'bg-gray-700/30' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${ICON_COLORS[n.icon]}`}>
                      {ICON_MAP[n.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${n.read ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>{n.text}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Dropdown>

        {/* DIVIDER */}
        <div className="hidden sm:block w-px h-6 bg-gray-700" />

        {/* PROFILE DROPDOWN */}
        <Dropdown open={profileOpen} onClose={() => setProfileOpen(false)}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-700 transition-colors group"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials(user?.first_name + " " + user?.last_name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400 leading-tight">Caretaker</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white hidden sm:block transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <ul className="py-1">
                {[
                  { label: 'My Profile', icon: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z', to: '/caretaker/profile' },
                  { label: 'Settings',   icon: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z', to: '/caretaker/settings' },
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