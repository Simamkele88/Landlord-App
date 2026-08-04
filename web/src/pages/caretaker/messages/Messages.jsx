/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const QUICK_REPLIES = [
  "I'll check and get back to you.",
  "A contractor has been assigned.",
  "This has been resolved.",
  "I'll escalate to the landlord.",
  "Please send me more details.",
];

export default function CaretakerMessages() {
  useDocumentTitle("Messages");
  const navigate = useNavigate();
  const toast = useToast();

  const [convos, setConvos] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [activeThread, setActiveThread] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  const fetchConvos = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setCurrentUserId(user.id);

      const { data } = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = (data.conversations || []).map(c => ({
        ...c,
        initials: initials(c.with_name),
        unread: c.unread_count || 0,
        preview: c.last_message || "No messages yet",
        time: timeAgo(c.last_message_at || c.created_at),
        online: c.with_online || false,
        color: 'rgba(58,143,212,0.15)',
        text: C.blue,
        role: c.with_role || "",
      }));

      mapped.sort((a, b) =>
        new Date(b.last_message_at || b.created_at || 0) - new Date(a.last_message_at || a.created_at || 0)
      );

      setConvos(mapped);
    } catch (err) {
      console.error("Fetch conversations:", err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConvos(); }, [fetchConvos]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [activeThread]);

  async function openConvo(convo) {
    setActiveConvo(convo.id);
    setConvos(prev => prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c));
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/messages/${convo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveThread(data.messages || []);
      await axios.put(`${API}/messages/read-all/${convo.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Fetch thread:", err);
    }
  }

  async function handleSend() {
    const text = msgInput.trim();
    if (!text || !activeConvo) return;
    setSending(true);

    const newMsg = {
      id: Date.now(),
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
      is_mine: true,
    };

    setActiveThread(prev => [...prev, newMsg]);
    setConvos(prev => prev.map(c => c.id === activeConvo ? { ...c, preview: text, time: "Just now" } : c));
    setMsgInput("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/messages/${activeConvo}/reply`, { body: text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      toast.error("Failed to send message");
    } finally { setSending(false); }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const filteredConvos = convos.filter(c =>
    c.with_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvoData = convos.find(c => c.id === activeConvo);

  return (
    <div style={{ fontFamily: F.dm, fontWeight: 300, background: C.black, color: C.white, height: 'calc(100vh - 60px)', overflow: 'hidden', margin: '-1.5rem -2rem' }}>
      <style>{`
        @keyframes fadeMsg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
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
          <span style={{ width: 24, height: 24, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          Loading messages...
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

          <div className="convos-panel" style={{ width: 340, minWidth: 280, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.muted2, flexShrink: 0 }}>
            <div style={{ padding: '1.2rem 1.2rem 0.8rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ fontFamily: F.bebas, fontSize: '1.3rem', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '0.8rem' }}>Messages</div>
              <div style={{ position: 'relative' }}>
                <Icon name="search" size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                <input type="text" placeholder="Search conversations…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.82rem', padding: '0.6rem 0.9rem 0.6rem 2rem', borderRadius: '3px', outline: 'none' }} />
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
                  <div key={convo.id} onClick={() => openConvo(convo)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.2rem',
                    cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                    background: activeConvo === convo.id ? 'rgba(58,143,212,0.06)' : 'transparent',
                    borderLeft: activeConvo === convo.id ? `2px solid ${C.blue}` : '2px solid transparent',
                    transition: 'background 0.15s',
                  }}>
                    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: convo.color || 'rgba(58,143,212,0.15)', color: convo.text || C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.9rem', flexShrink: 0 }}>
                      {convo.initials}
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', border: `2px solid ${C.muted2}`, background: convo.online ? C.greenLight : 'rgba(245,240,232,0.2)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: convo.unread ? 600 : 400, color: C.white }}>{convo.with_name}</span>
                        <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{convo.time}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: convo.unread ? 'rgba(245,240,232,0.7)' : 'rgba(245,240,232,0.35)', fontWeight: convo.unread ? 500 : 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{convo.preview}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '2px' }}>{convo.role}</div>
                    </div>
                    {convo.unread > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`chat-panel ${activeConvoData ? 'active' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.black }}>
            {activeConvoData ? (
              <>
                <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, background: C.muted2 }}>
                  <button onClick={() => setActiveConvo(null)} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.white}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
                    <Icon name="x" size={18} />
                  </button>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: activeConvoData.color || 'rgba(58,143,212,0.15)', color: activeConvoData.text || C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.9rem', flexShrink: 0 }}>
                    {activeConvoData.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: C.white }}>{activeConvoData.with_name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                      {activeConvoData.role}
                    </div>
                  </div>
                </div>

                <div ref={messagesRef} className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeThread.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.15)' }}>
                      <Icon name="messages" size={36} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                      <p style={{ fontSize: '0.78rem', fontFamily: F.mono }}>No messages yet</p>
                    </div>
                  )}
                  {activeThread.map((msg, i) => {
                    const isMine = msg.sender_id === currentUserId || msg.is_mine;
                    return (
                      <div key={msg.id || i} style={{
                        display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
                        flexDirection: isMine ? 'row-reverse' : 'row',
                        animation: `fadeMsg 0.25s ease forwards`, opacity: 0,
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: F.bebas, fontSize: '0.6rem', marginBottom: '2px',
                          background: isMine ? 'rgba(58,143,212,0.15)' : (activeConvoData.color || 'rgba(58,143,212,0.15)'),
                          color: isMine ? C.blue : (activeConvoData.text || C.blue),
                        }}>
                          {isMine ? 'ME' : activeConvoData.initials}
                        </div>
                        <div>
                          <div style={{
                            maxWidth: '480px', padding: '0.65rem 0.9rem',
                            borderRadius: isMine ? '10px 4px 10px 10px' : '4px 10px 10px 10px',
                            fontSize: '0.84rem', lineHeight: 1.55, wordBreak: 'break-word',
                            background: isMine ? 'rgba(58,143,212,0.12)' : C.muted2,
                            color: C.white,
                          }}>
                            {msg.body}
                          </div>
                          <span style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.2rem', display: 'block', textAlign: isMine ? 'right' : 'left' }}>
                            {timeAgo(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: '0.8rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.muted2 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    {QUICK_REPLIES.map((qr, i) => (
                      <button key={i} onClick={() => { setMsgInput(qr); inputRef.current?.focus(); }} style={{
                        background: C.black, border: `1px solid ${C.border}`, padding: '0.25rem 0.6rem',
                        borderRadius: '10px', fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)',
                        cursor: 'pointer', fontFamily: F.mono, transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; }}>
                        {qr}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <textarea ref={inputRef} rows={1} placeholder="Type a message…" value={msgInput}
                      onChange={e => setMsgInput(e.target.value)} onKeyDown={handleKeyDown}
                      style={{ flex: 1, background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.84rem', padding: '0.6rem 0.9rem', borderRadius: '3px', outline: 'none', resize: 'none', maxHeight: '100px', lineHeight: 1.5 }} />
                    <button onClick={handleSend} disabled={!msgInput.trim() || sending} style={{
                      background: msgInput.trim() ? C.blue : C.border, color: C.white, border: 'none',
                      width: 36, height: 36, borderRadius: '3px', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: msgInput.trim() ? 1 : 0.5,
                    }}>
                      {sending ? (
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      ) : (
                        <Icon name="send" size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.08)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Icon name="messages" size={56} style={{ opacity: 0.1, marginBottom: '0.8rem' }} />
                  <p style={{ fontSize: '0.85rem', fontFamily: F.mono, color: 'rgba(245,240,232,0.15)' }}>Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}