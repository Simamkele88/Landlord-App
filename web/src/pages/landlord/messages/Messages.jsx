/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// LANDLORD MESSAGES PAGE
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

const QUICK_REPLIES = [
  "Payment received, thank you",
  "I'll look into this",
  "Lease renewal sent",
  "Maintenance has been scheduled",
  "Please upload proof of payment",
  "Your receipt is attached",
];


function ContextMenu({ x, y, children }) {
  return (
    <div style={{
      position: 'fixed',
      left: Math.min(x, window.innerWidth - 200),
      top: Math.min(y, window.innerHeight - 250),
      zIndex: 300,
      background: C.muted2,
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      padding: '4px',
      minWidth: 180,
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      animation: 'contextFadeIn 0.1s ease',
    }}>
      {children}
    </div>
  );
}

function ContextMenuItem({ icon, label, danger, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.5rem 0.8rem', borderRadius: '3px',
      cursor: 'pointer', fontSize: '0.75rem',
      color: hovered ? (danger ? C.redLight : C.white) : (danger ? C.redLight : 'rgba(245,240,232,0.6)'),
      background: hovered ? (danger ? 'rgba(224,90,74,0.1)' : C.muted) : 'transparent',
      transition: 'all 0.1s',
      fontFamily: F.dm,
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <Icon name={icon} size={14} />
      {label}
    </div>
  );
}

export default function LandlordMessages() {
  useDocumentTitle("Messages");
  const toast = useToast();
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const fileInputRef = useRef(null);

  
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (messageContextMenu) {
          setMessageContextMenu(null);
        } else if (contextMenu) {
          setContextMenu(null);
        } else if (activeConvo) {
          setActiveConvo(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeConvo, contextMenu, messageContextMenu]);

  
  useEffect(() => {
    function handleClick() {
      setContextMenu(null);
      setMessageContextMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setCurrentUserId(user.id);

      const [convRes, recipRes] = await Promise.all([
        axios.get(`${API}/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { conversations: [] } })),
        axios.get(`${API}/messages/recipients`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { recipients: [] } })),
      ]);

      const mappedConvos = (convRes.data.conversations || []).map(c => ({
      ...c,
      initials: initials(c.with_name),
      unread: c.unread_count || 0,
      preview: c.last_message || "No messages yet",
      time: timeAgo(c.last_message_at || c.created_at),
      online: c.with_online || false,
    }));

    mappedConvos.sort((a, b) =>
      new Date(b.last_message_at || b.created_at || 0) - new Date(a.last_message_at || a.created_at || 0)
    );

    setConversations(mappedConvos);
    setRecipients(recipRes.data.recipients || []);
    } catch (err) {
      console.error("Fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [activeConvo?.messages]);

  const filteredConvos = conversations.filter(c =>
    c.with_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function openConvo(convo) {
    setActiveConvo(convo);
    setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c));
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/messages/read-all/${convo.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  }

  function closeConvo() {
    setActiveConvo(null);
    setAttachments([]);
    setMsgInput("");
  }

  async function handleSend() {
    const text = msgInput.trim();
    if ((!text && attachments.length === 0) || !activeConvo) return;

    setUploading(true);

    const newMsg = {
      id: Date.now(),
      sender_id: currentUserId,
      message: text,
      created_at: new Date().toISOString(),
      read: false,
      is_mine: true,
      attachments: attachments.map((f, i) => ({
        id: `temp-${i}`,
        name: f.name,
        url: URL.createObjectURL(f),
        mime_type: f.type,
        file_size: f.size,
      })),
    };

    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== activeConvo.id) return c;
        return {
          ...c,
          messages: [...(c.messages || []), newMsg],
          last_message: text || (attachments.length > 0 ? `📎 ${attachments.length} attachment(s)` : ""),
          last_message_at: new Date().toISOString(),
          preview: text || (attachments.length > 0 ? `📎 ${attachments.length} attachment(s)` : ""),
          time: "Just now",
        };
      });
      return updated.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
    });
    setActiveConvo(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMsg] } : prev);
    setMsgInput("");
    setAttachments([]);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("message", text || "");
      attachments.forEach(file => formData.append("attachments", file));

      await axios.post(`${API}/messages/${activeConvo.id}/reply`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchData();
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickReply(text) {
    setMsgInput(text);
    inputRef.current?.focus();
  }

  async function handleSendAnnouncement(data) {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/announcements`, data, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Announcement sent!");
      setShowAnnouncement(false);
    } catch { toast.error("Failed to send announcement"); }
  }

  async function handleSendNewMessage(data) {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/messages`, data, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Message sent!");
      setShowNewMessage(false);
      fetchData();
    } catch { toast.error("Failed to send message"); }
  }

  return (
    <div style={{ fontFamily: F.dm, fontWeight: 300, background: C.black, color: C.white, height: 'calc(100vh - 4rem)', overflow: 'hidden', margin: '-2rem -2.5rem', borderRadius: '0' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fadeMsg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes contextFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .convos-list::-webkit-scrollbar, .messages-area::-webkit-scrollbar { width: 3px; }
        .convos-list::-webkit-scrollbar-track, .messages-area::-webkit-scrollbar-track { background: transparent; }
        .convos-list::-webkit-scrollbar-thumb, .messages-area::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @media (max-width: 700px) {
          .convos-panel { width: 100% !important; }
          .chat-panel { display: none !important; }
          .chat-panel.active { display: flex !important; }
        }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' }}>
          <span style={{ width: 24, height: 24, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          Loading messages...
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

          {/* CONVERSATIONS PANEL */}
          <div className="convos-panel" style={{ width: 340, minWidth: 280, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.muted2, flexShrink: 0 }}>
            <div style={{ padding: '1.2rem 1.2rem 0.8rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ fontFamily: F.bebas, fontSize: '1.3rem', letterSpacing: '0.04em', lineHeight: 1 }}>Messages</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => setShowAnnouncement(true)} title="New Announcement" style={{
                    width: 30, height: 30, background: C.black, border: `1px solid ${C.border}`,
                    borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgba(245,240,232,0.4)', transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = C.white}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.4)'}>
                    <Icon name="bell" size={14} />
                  </button>
                  <button onClick={() => setShowNewMessage(true)} title="New Message" style={{
                    width: 30, height: 30, background: C.gold, border: 'none',
                    borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: C.black,
                  }}>
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <Icon name="search" size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', padding: '0.55rem 0.8rem 0.55rem 2rem', borderRadius: '3px', outline: 'none' }}
                />
              </div>
            </div>

            <div className="convos-list" style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConvos.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(245,240,232,0.2)' }}>
                  <Icon name="messages" size={28} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.75rem', fontFamily: F.mono }}>No conversations</p>
                </div>
              ) : (
                filteredConvos.map(convo => (
                  <div key={convo.id}
                    onClick={() => openConvo(convo)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, type: 'conversation', data: convo });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.85rem 1rem',
                      cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                      background: activeConvo?.id === convo.id ? 'rgba(232,160,18,0.06)' : 'transparent',
                      borderLeft: activeConvo?.id === convo.id ? `2px solid ${C.gold}` : '2px solid transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (activeConvo?.id !== convo.id) e.currentTarget.style.background = C.muted; }}
                    onMouseLeave={e => { if (activeConvo?.id !== convo.id) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: 'rgba(232,160,18,0.1)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.85rem', flexShrink: 0 }}>
                      {convo.initials}
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', border: `2px solid ${C.muted2}`, background: convo.online ? C.greenLight : 'rgba(245,240,232,0.2)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: convo.unread > 0 ? 600 : 400, color: C.white }}>{convo.with_name}</span>
                        <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, flexShrink: 0 }}>{convo.time}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: convo.unread > 0 ? 'rgba(245,240,232,0.7)' : 'rgba(245,240,232,0.35)', fontWeight: convo.unread > 0 ? 500 : 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {convo.preview}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '1px' }}>
                        {convo.with_role} · {convo.property || convo.unit || "—"}
                      </div>
                    </div>
                    {convo.unread > 0 && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CHAT PANEL */}
          <div className={`chat-panel ${activeConvo ? 'active' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.black }}>
            {activeConvo ? (
              <>
                <div style={{ padding: '0.85rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0, background: C.muted2 }}>
                  <button onClick={closeConvo} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.white}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
                    <Icon name="x" size={18} />
                  </button>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,160,18,0.1)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.8rem', flexShrink: 0 }}>
                    {activeConvo.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: C.white }}>{activeConvo.with_name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                      {activeConvo.with_role}{activeConvo.property ? ` · ${activeConvo.property}` : ''}
                    </div>
                  </div>
                </div>

                <div ref={messagesRef} className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '0.8rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(activeConvo.messages || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.15)' }}>
                      <Icon name="messages" size={36} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                      <p style={{ fontSize: '0.78rem', fontFamily: F.mono }}>No messages yet</p>
                    </div>
                  )}

                  {(activeConvo.messages || []).map((msg, i) => {
                    const isMine = msg.sender_id === currentUserId || msg.is_mine;
                    return (
                      <div key={msg.id || i}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMessageContextMenu({ x: e.clientX, y: e.clientY, message: msg, isMine });
                        }}
                        style={{
                          display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
                          flexDirection: isMine ? 'row-reverse' : 'row',
                          animation: `fadeMsg 0.25s ease forwards`, opacity: 0,
                        }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: F.bebas, fontSize: '0.6rem', marginBottom: '2px',
                          background: isMine ? 'rgba(58,143,212,0.15)' : 'rgba(232,160,18,0.1)',
                          color: isMine ? C.blue : C.gold,
                        }}>
                          {isMine ? 'ME' : activeConvo.initials}
                        </div>
                        <div style={{ maxWidth: '480px' }}>
                          {(msg.message || msg.body) ? (
                            <div style={{
                              padding: '0.6rem 0.9rem',
                              borderRadius: isMine ? '10px 4px 10px 10px' : '4px 10px 10px 10px',
                              fontSize: '0.84rem', lineHeight: 1.55, wordBreak: 'break-word',
                              background: isMine ? 'rgba(58,143,212,0.15)' : C.muted2, color: C.white,
                            }}>
                              {msg.message || msg.body}
                            </div>
                          ) : null}

                          {(msg.attachments || []).length > 0 && (
                            <div style={{
                              display: 'flex', flexDirection: 'column', gap: '0.3rem',
                              marginTop: (msg.message || msg.body) ? '0.4rem' : 0,
                            }}>
                              {msg.attachments.map((att, j) => {
                                const isImage = att.mime_type?.startsWith('image/');
                                const isPDF = att.mime_type?.includes('pdf');
                                
                                if (isImage) {
                                  return (
                                    <a key={att.id || j}
                                      href={att.url?.startsWith('blob:') ? att.url : `${API}${att.url}`}
                                      target="_blank" rel="noopener noreferrer"
                                      style={{
                                        display: 'block', width: 200, borderRadius: '10px',
                                        overflow: 'hidden', textDecoration: 'none',
                                        borderBottomLeftRadius: isMine ? '10px' : '3px',
                                        borderBottomRightRadius: isMine ? '3px' : '10px',
                                      }}>
                                      <img
                                        src={att.url?.startsWith('blob:') ? att.url : `${API}${att.url}`}
                                        alt={att.name || "Image"}
                                        style={{
                                          width: '100%', height: 160, objectFit: 'cover',
                                          display: 'block', borderRadius: '10px',
                                          borderBottomLeftRadius: isMine ? '10px' : '3px',
                                          borderBottomRightRadius: isMine ? '3px' : '10px',
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.parentElement.innerHTML = `
                                            <div style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0.6rem;border-radius:4px;background:rgba(0,0,0,0.25);font-size:0.72rem;color:${isMine ? C.white : C.blue};cursor:pointer;">
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.blue}" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${att.name || 'Image'}</span>
                                              <span style="font-size:0.6rem;color:rgba(245,240,232,0.3);">${att.file_size ? (att.file_size / 1024).toFixed(0) + 'KB' : ''}</span>
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            </div>
                                          `;
                                        }}
                                      />
                                    </a>
                                  );
                                }
                                
                                
                                return (
                                  <a key={att.id || j}
                                    href={att.url?.startsWith('blob:') ? att.url : `${API}${att.url}`}
                                    target="_blank" rel="noopener noreferrer"
                                    download={att.name}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                                      padding: '0.4rem 0.6rem', borderRadius: '4px',
                                      background: 'rgba(0,0,0,0.25)', textDecoration: 'none',
                                      fontSize: '0.72rem', color: isMine ? C.white : C.blue,
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}>
                                    <Icon name={isPDF ? "file-text" : "file"} size={14} color={isPDF ? C.redLight : "rgba(245,240,232,0.4)"} />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {att.name}
                                    </span>
                                    <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, flexShrink: 0 }}>
                                      {att.file_size ? `${(att.file_size / 1024).toFixed(0)}KB` : ''}
                                    </span>
                                    <Icon name="download" size={12} style={{ flexShrink: 0 }} />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          <span style={{
                            fontSize: '0.58rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono,
                            marginTop: '0.2rem', display: 'block',
                            textAlign: isMine ? 'right' : 'left',
                          }}>
                            {timeAgo(msg.created_at)}
                            {isMine && msg.read && <span style={{ marginLeft: '0.3rem', color: C.greenLight }}>✓ Read</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* INPUT BAR WITH ATTACHMENTS */}
                <div style={{ padding: '0.8rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.muted2 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    {QUICK_REPLIES.map((qr, i) => (
                      <button key={i} onClick={() => handleQuickReply(qr)} style={{
                        background: C.black, border: `1px solid ${C.border}`, padding: '0.25rem 0.6rem',
                        borderRadius: '12px', fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)',
                        cursor: 'pointer', fontFamily: F.dm, transition: 'border-color 0.2s, color 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; }}>
                        {qr}
                      </button>
                    ))}
                  </div>

                  {attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      {attachments.map((file, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          background: C.black, border: `1px solid ${C.border}`,
                          borderRadius: '4px', padding: '0.35rem 0.6rem',
                        }}>
                          {file.type?.startsWith('image/') ? (
                            <Icon name="image" size={12} color={C.blue} />
                          ) : (
                            <Icon name="file" size={12} color="rgba(245,240,232,0.4)" />
                          )}
                          <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.5)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)', padding: '1px',
                          }}>
                            <Icon name="x" size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => fileInputRef.current?.click()} style={{
                        width: 34, height: 34, background: C.black, border: `1px solid ${C.border}`,
                        borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'rgba(245,240,232,0.3)', transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = C.white}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
                        <Icon name="paperclip" size={14} />
                      </button>
                      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                        onChange={e => { const files = Array.from(e.target.files || []); setAttachments(prev => [...prev, ...files]); e.target.value = ''; }}
                        style={{ display: 'none' }} />
                    </div>
                    <textarea ref={inputRef} rows={1} placeholder="Type a message…" value={msgInput}
                      onChange={e => setMsgInput(e.target.value)} onKeyDown={handleKeyDown}
                      style={{ flex: 1, background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.84rem', padding: '0.55rem 0.9rem', borderRadius: '3px', outline: 'none', resize: 'none', maxHeight: '100px', lineHeight: 1.5 }} />
                    <button onClick={handleSend} disabled={(!msgInput.trim() && attachments.length === 0) || uploading} style={{
                      width: 36, height: 36, borderRadius: '3px', border: 'none', cursor: 'pointer',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: (msgInput.trim() || attachments.length > 0) ? C.gold : C.border,
                      color: (msgInput.trim() || attachments.length > 0) ? C.black : 'rgba(245,240,232,0.3)',
                      opacity: (msgInput.trim() || attachments.length > 0) ? 1 : 0.5,
                    }}>
                      {uploading ? (
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      ) : (
                        <Icon name="send" size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.1)', gap: '0.8rem' }}>
                <Icon name="messages" size={56} style={{ opacity: 0.25 }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontFamily: F.mono, color: 'rgba(245,240,232,0.25)', marginBottom: '0.3rem' }}>Select a conversation</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.15)' }}>or start a new message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEXT MENUS */}
      {contextMenu && contextMenu.type === 'conversation' && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}>
          <ContextMenuItem icon="messages" label="Open Conversation" onClick={() => { openConvo(contextMenu.data); setContextMenu(null); }} />
          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
          <ContextMenuItem icon="check" label="Mark as Read" onClick={() => {
            setConversations(prev => prev.map(c => c.id === contextMenu.data.id ? { ...c, unread: 0 } : c));
            setContextMenu(null);
            toast.success("Marked as read");
          }} />
          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
          <ContextMenuItem icon="x-circle" label="Close Conversation" danger onClick={() => { setActiveConvo(null); setContextMenu(null); }} />
        </ContextMenu>
      )}

      {messageContextMenu && (
        <ContextMenu x={messageContextMenu.x} y={messageContextMenu.y}>
          <ContextMenuItem icon="copy" label="Copy Text" onClick={() => {
            navigator.clipboard.writeText(messageContextMenu.message.message || messageContextMenu.message.body || "");
            toast.success("Copied to clipboard");
            setMessageContextMenu(null);
          }} />
          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
          <ContextMenuItem icon="corner-down-right" label="Reply" onClick={() => {
            inputRef.current?.focus();
            setMessageContextMenu(null);
          }} />
          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
          {messageContextMenu.isMine && (
            <ContextMenuItem icon="trash" label="Delete Message" danger onClick={() => {
              if (window.confirm("Delete this message?")) {
                setMessageContextMenu(null);
                toast.success("Message deleted");
              }
            }} />
          )}
        </ContextMenu>
      )}

      {/* NEW MESSAGE MODAL */}
      {showNewMessage && (
        <NewMessageModal recipients={recipients} onClose={() => setShowNewMessage(false)} onSend={handleSendNewMessage} />
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnouncement && (
        <AnnouncementModal onClose={() => setShowAnnouncement(false)} onSend={handleSendAnnouncement} />
      )}
    </div>
  );
}


function NewMessageModal({ recipients, onClose, onSend }) {
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selectedRecipient || !message.trim()) return;
    setLoading(true);
    await onSend({ recipient_id: selectedRecipient, message: message.trim() });
    setLoading(false);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>New Message</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <select value={selectedRecipient} onChange={e => setSelectedRecipient(e.target.value)} style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, padding: '0.6rem', borderRadius: '3px', fontFamily: F.dm, fontSize: '0.82rem' }}>
            <option value="">Select recipient...</option>
            {recipients.map(r => <option key={r.user_id} value={r.user_id}>{r.name} ({r.role}){r.property ? ` · ${r.property}` : ''}</option>)}
          </select>
        </div>
        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, padding: '0.6rem', borderRadius: '3px', fontFamily: F.dm, fontSize: '0.82rem', resize: 'vertical', minHeight: 80 }} />
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm, background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.5)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!selectedRecipient || !message.trim()} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, background: C.gold, color: C.black, border: 'none', cursor: 'pointer', opacity: (!selectedRecipient || !message.trim()) ? 0.5 : 1 }}>Send</button>
        </div>
      </div>
    </div>
  );
}


function AnnouncementModal({ onClose, onSend }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all_tenants");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    await onSend({ subject, message: message.trim(), recipient_type: recipientType });
    setLoading(false);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>New Announcement</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <select value={recipientType} onChange={e => setRecipientType(e.target.value)} style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, padding: '0.6rem', borderRadius: '3px', fontFamily: F.dm, fontSize: '0.82rem' }}>
            <option value="all_tenants">All Tenants</option>
            <option value="caretakers">All Caretakers</option>
          </select>
        </div>
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, padding: '0.6rem', borderRadius: '3px', fontFamily: F.dm, fontSize: '0.82rem', marginBottom: '0.8rem' }} />
        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your announcement..." style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, padding: '0.6rem', borderRadius: '3px', fontFamily: F.dm, fontSize: '0.82rem', resize: 'vertical', minHeight: 80 }} />
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm, background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.5)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!message.trim()} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, background: C.gold, color: C.black, border: 'none', cursor: 'pointer', opacity: !message.trim() ? 0.5 : 1 }}>Send Announcement</button>
        </div>
      </div>
    </div>
  );
}