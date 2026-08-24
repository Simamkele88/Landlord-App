/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-empty */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";

const API = "http://localhost:4000";

const C = {
  background: "#f4f5f7",
  card: "#ffffff",
  border: "#e9ecef",
  primary: "#2c3e50",
  blue: "#3498db",
  green: "#2b7a4b",
  red: "#9e3a3a",
  purple: "#6f42c1",
  gold: "#d99e0b",
};

const F = {
  bebas: '"Bebas Neue", sans-serif',
  dm: '"DM Sans", sans-serif',
  mono: '"Space Mono", monospace',
};

const TEXT = "#000";
const SECONDARY_TEXT = "#333";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const NOTIF_ICONS = {
  payment_due:       { icon: 'credit-card', color: C.red, label: 'Payment Due' },
  payment_received:  { icon: 'credit-card', color: C.gold, label: 'Payment Received' },
  payment_approved:  { icon: 'check-circle', color: C.green, label: 'Payment Approved' },
  payment_rejected:  { icon: 'x-circle', color: C.red, label: 'Payment Rejected' },
  lease_expiring:    { icon: 'calendar', color: C.blue, label: 'Lease Expiring' },
  lease_expired:     { icon: 'calendar', color: C.red, label: 'Lease Expired' },
  maintenance_update:{ icon: 'wrench', color: C.purple, label: 'Maintenance Update' },
  complaint_update:  { icon: 'message-square', color: C.primary, label: 'Complaint Update' },
  message_received:  { icon: 'messages', color: C.gold, label: 'Message Received' },
  document_uploaded: { icon: 'file', color: C.blue, label: 'Document Uploaded' },
  account_created:   { icon: 'user-plus', color: C.green, label: 'Account Created' },
  account_status:    { icon: 'shield', color: C.purple, label: 'Account Status' },
  property_assigned: { icon: 'home', color: C.gold, label: 'Property Assigned' },
};

export default function NotificationsPage() {
  useDocumentTitle("Notifications");
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activeNotification, setActiveNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifs = data.notifications || [];
      setNotifications(notifs);
      if (!activeNotification && notifs.length > 0) {
        setActiveNotification(notifs[0]);
      }
    } catch (err) {
      console.error("Fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markRead(notifId) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      if (activeNotification?.id === notifId) {
        setActiveNotification(prev => prev ? { ...prev, is_read: true } : prev);
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (activeNotification) {
        setActiveNotification(prev => prev ? { ...prev, is_read: true } : prev);
      }
      toast.success("All notifications marked as read");
    } catch {}
  }

  function openNotification(notif) {
    setActiveNotification(notif);
    if (!notif.is_read) {
      markRead(notif.id);
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = notifications.filter(n => {
    const matchFilter = filter === "all" 
      ? true 
      : filter === "unread" 
        ? !n.is_read 
        : n.type === filter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || 
      (n.title || "").toLowerCase().includes(q) || 
      (n.body || "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "payment_due", label: "Payments" },
    { key: "lease_expiring", label: "Leases" },
    { key: "maintenance_update", label: "Maintenance" },
    { key: "complaint_update", label: "Complaints" },
  ];

  return (
    <div style={{ fontFamily: F.dm, fontWeight: 400, background: C.background, color: TEXT, height: 'calc(100vh - 4rem)', overflow: 'hidden', margin: '-2rem -2.5rem', borderRadius: '0' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .notif-list::-webkit-scrollbar, .notif-detail::-webkit-scrollbar { width: 3px; }
        .notif-list::-webkit-scrollbar-track, .notif-detail::-webkit-scrollbar-track { background: transparent; }
        .notif-list::-webkit-scrollbar-thumb, .notif-detail::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @media (max-width: 700px) {
          .notif-panel { width: 100% !important; }
          .detail-panel { display: none !important; }
          .detail-panel.active { display: flex !important; }
        }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: SECONDARY_TEXT, gap: '0.8rem' }}>
          <span style={{ width: 24, height: 24, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          Loading notifications...
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

          {/* Sidebar */}
          <div className="notif-panel" style={{ width: 380, minWidth: 300, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.card, flexShrink: 0 }}>
            
            <div style={{ padding: '1.2rem 1.2rem 0.8rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: F.bebas, fontSize: '1.3rem', letterSpacing: '0.04em', lineHeight: 1, color: TEXT }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ background: C.red, color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 700, fontFamily: F.mono }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} title="Mark All Read" style={{
                      width: 30, height: 30, background: C.background, border: `1px solid ${C.border}`,
                      borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: TEXT, transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = C.primary}
                      onMouseLeave={e => e.currentTarget.style.color = TEXT}>
                      <Icon name="check" size={14} />
                    </button>
                  )}
                  <button onClick={fetchNotifications} title="Refresh" style={{
                    width: 30, height: 30, background: C.background, border: `1px solid ${C.border}`,
                    borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: TEXT, transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = C.primary}
                    onMouseLeave={e => e.currentTarget.style.color = TEXT}>
                    <Icon name="refresh" size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600,
                    fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${filter === f.key ? C.primary : C.border}`,
                    background: filter === f.key ? 'rgba(44,62,80,0.08)' : C.background,
                    color: filter === f.key ? C.primary : TEXT,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Icon name="search" size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: SECONDARY_TEXT }} />
                <input
                  type="text"
                  placeholder="Search notifications…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: C.background, border: `1px solid ${C.border}`, color: TEXT, fontFamily: F.dm, fontSize: '0.78rem', padding: '0.55rem 0.8rem 0.55rem 2rem', borderRadius: '3px', outline: 'none' }}
                />
              </div>
            </div>

            <div className="notif-list" style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: SECONDARY_TEXT }}>
                  <Icon name="bell" size={28} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.75rem', fontFamily: F.mono, color: TEXT }}>No notifications</p>
                </div>
              ) : (
                filtered.map(notif => {
                  const iconCfg = NOTIF_ICONS[notif.type] || { icon: 'bell', color: C.primary, label: notif.type };
                  const isActive = activeNotification?.id === notif.id;
                  return (
                    <div key={notif.id} onClick={() => openNotification(notif)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.85rem 1rem',
                      cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                      background: isActive ? 'rgba(44,62,80,0.06)' : notif.is_read ? 'transparent' : 'rgba(44,62,80,0.04)',
                      borderLeft: isActive ? `3px solid ${C.primary}` : notif.is_read ? '3px solid transparent' : `3px solid ${C.primary}`,
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(44,62,80,0.04)'; }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                        background: iconCfg.color + '15', border: `1px solid ${iconCfg.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name={iconCfg.icon} size={16} color={iconCfg.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: notif.is_read ? 500 : 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {notif.title}
                          </span>
                          {!notif.is_read && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: SECONDARY_TEXT, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {notif.body}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem' }}>
                          <span style={{ fontSize: '0.6rem', color: SECONDARY_TEXT, fontFamily: F.mono }}>
                            {timeAgo(notif.created_at)}
                          </span>
                          <span style={{
                            fontSize: '0.55rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '2px',
                            fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                            color: iconCfg.color, background: iconCfg.color + '12',
                          }}>
                            {iconCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className={`detail-panel ${activeNotification ? 'active' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.background }}>
            {activeNotification ? (
              <>
                <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0, background: C.card }}>
                  <button onClick={() => setActiveNotification(null)} style={{
                    padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none',
                    cursor: 'pointer', color: TEXT, display: 'none',
                  }}>
                    <Icon name="chevronLeft" size={18} />
                  </button>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                    background: (NOTIF_ICONS[activeNotification.type]?.color || C.primary) + '15',
                    border: `1px solid ${(NOTIF_ICONS[activeNotification.type]?.color || C.primary)}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={NOTIF_ICONS[activeNotification.type]?.icon || 'bell'} size={18} color={NOTIF_ICONS[activeNotification.type]?.color || C.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: TEXT }}>{activeNotification.title}</div>
                    <div style={{ fontSize: '0.65rem', color: SECONDARY_TEXT, fontFamily: F.mono, marginTop: '1px' }}>
                      {NOTIF_ICONS[activeNotification.type]?.label || activeNotification.type} · {timeAgo(activeNotification.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '3px',
                    fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: activeNotification.is_read ? SECONDARY_TEXT : C.green,
                    background: activeNotification.is_read ? 'rgba(0,0,0,0.05)' : 'rgba(43,122,75,0.1)',
                    border: `1px solid ${activeNotification.is_read ? C.border : 'rgba(43,122,75,0.2)'}`,
                  }}>
                    {activeNotification.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>

                <div className="notif-detail" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: '6px',
                      padding: '1.2rem 1.5rem', animation: 'fadeIn 0.3s ease',
                    }}>
                      <p style={{ fontSize: '0.9rem', color: TEXT, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {activeNotification.body}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{
                      fontSize: '0.6rem', fontWeight: 600, color: TEXT,
                      fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
                      marginBottom: '0.6rem',
                    }}>
                      Details
                    </p>
                    <div style={{
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: '6px',
                      overflow: 'hidden',
                    }}>
                      {[
                        ["Type", (NOTIF_ICONS[activeNotification.type]?.label || activeNotification.type).replace(/_/g, ' ')],
                        ["Status", activeNotification.is_read ? "Read" : "Unread"],
                        ["Received", formatDate(activeNotification.created_at)],
                        ["Read At", activeNotification.read_at ? formatDate(activeNotification.read_at) : "Not yet read"],
                        ["Category", activeNotification.type?.replace(/_/g, ' ') || "—"],
                        ["Reference ID", activeNotification.related_entity_id ? String(activeNotification.related_entity_id).slice(0, 8) + "..." : "—"],
                        ["Entity Type", activeNotification.related_entity_type || "—"],
                      ].map(([label, val], i) => (
                        <div key={label} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.7rem 1rem',
                          background: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                          borderBottom: `1px solid ${C.border}`,
                        }}>
                          <span style={{ fontSize: '0.75rem', color: TEXT }}>{label}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: TEXT }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    {!activeNotification.is_read && (
                      <button onClick={() => markRead(activeNotification.id)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '3px',
                        fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm,
                        letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
                        background: C.primary, color: '#fff',
                      }}>
                        <Icon name="check" size={14} /> Mark as Read
                      </button>
                    )}
                    <button onClick={() => setActiveNotification(null)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '3px',
                      fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
                      letterSpacing: '0.04em', border: `1px solid ${C.border}`,
                      background: 'transparent', color: TEXT,
                      cursor: 'pointer',
                    }}>
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(44,62,80,0.05)', border: '2px solid rgba(44,62,80,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="bell" size={36} style={{ opacity: 0.5, color: TEXT }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontFamily: F.mono, color: TEXT, marginBottom: '0.3rem' }}>Select a notification</p>
                  <p style={{ fontSize: '0.7rem', color: SECONDARY_TEXT }}>Click on a notification to view its details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}