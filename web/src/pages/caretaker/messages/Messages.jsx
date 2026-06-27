/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// CARETAKER MESSAGES PAGE 
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
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

const MOCK_CONVOS = [
  { id: 1, initials: "MN", name: "Mr Nyambuya", role: "Landlord", color: "rgba(58,143,212,0.15)", text: C.blue, online: true, unread: 1, time: "2m", preview: "Please check the geyser in Unit 301 urgently." },
  { id: 2, initials: "SD", name: "Sipho Dlamini", role: "Tenant · Unit 101", color: "rgba(100,80,200,0.15)", text: C.purple, online: false, unread: 0, time: "1hr", preview: "Thank you, the pipe is fixed now!" },
  { id: 3, initials: "LM", name: "Lerato Mokoena", role: "Tenant · Unit 102", color: "rgba(232,160,18,0.12)", text: C.gold, online: true, unread: 2, time: "4hr", preview: "The window latch is still broken. When can someone come?" },
  { id: 4, initials: "MP", name: "Mike's Plumbing", role: "Contractor", color: "rgba(26,122,74,0.15)", text: C.greenLight, online: false, unread: 0, time: "Tue", preview: "Invoice sent for the geyser repair." },
];

const THREADS = {
  1: [
    { out: false, text: "David, can you check the geyser in Unit 301? Tenant says no hot water.", time: "Yesterday 4:32pm" },
    { out: true, text: "I'll go there first thing tomorrow morning. I'll bring my tools.", time: "Yesterday 4:45pm" },
    { out: false, text: "Perfect, the tenant will be home all day. Please check the geyser in Unit 301 urgently.", time: "Yesterday 4:47pm" },
    { out: true, text: "Got it. I'll assess and let you know if it needs replacement.", time: "Yesterday 4:50pm" },
    { out: false, text: "Thanks David. Send me the quote if it's a big job.", time: "Yesterday 4:52pm" },
    { out: true, text: "Will do. I'll send photos and an estimate once I've inspected it.", time: "Yesterday 4:53pm" },
  ],
  2: [
    { out: false, text: "Hi David, there's water leaking under my kitchen sink.", time: "Mon 11:14am" },
    { out: true, text: "I'll send a plumber tomorrow. Please don't use the sink until then.", time: "Mon 11:22am" },
    { out: false, text: "Okay, thank you!", time: "Mon 11:23am" },
    { out: true, text: "The plumber will be there around 9am. His name is Mike.", time: "Mon 11:30am" },
    { out: false, text: "Thank you, the pipe is fixed now!", time: "Mon 11:45am" },
  ],
  3: [
    { out: false, text: "My bedroom window doesn't close properly. It's cold at night.", time: "Wed 3:20pm" },
    { out: true, text: "I've ordered the replacement latch. It should arrive by Friday.", time: "Wed 3:35pm" },
    { out: false, text: "Okay, please let me know when someone can install it.", time: "Wed 3:36pm" },
    { out: true, text: "I'll come install it myself on Friday afternoon.", time: "Wed 3:40pm" },
    { out: false, text: "The window latch is still broken. When can someone come?", time: "Thu 9:01am" },
  ],
  4: [
    { out: true, text: "Hi Mike, we need a geyser replacement at Hillbrow Heights, Unit 301.", time: "Tue 4:10pm" },
    { out: false, text: "I can do it tomorrow. Cost will be R2,800 including parts.", time: "Tue 4:25pm" },
    { out: true, text: "Great, please go ahead. Send the invoice when done.", time: "Tue 4:28pm" },
    { out: false, text: "Invoice sent for the geyser repair.", time: "Tue 4:47pm" },
  ],
};

const QUICK_REPLIES = ["I'll check and get back to you.", "A contractor has been assigned.", "This has been resolved.", "I'll escalate to the landlord.", "Please send me more details."];

export default function CaretakerMessages() {
  useDocumentTitle("Messages");
  const navigate = useNavigate();

  const [activeConvo, setActiveConvo] = useState(null);
  const [convos, setConvos] = useState(MOCK_CONVOS);
  const [threads, setThreads] = useState(THREADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  const activeConvoData = convos.find(c => c.id === activeConvo);
  const activeThread = threads[activeConvo] || [];

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [activeThread, typing]);

  const filteredConvos = convos.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  function openConvo(id) {
    setActiveConvo(id);
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }

  function handleSend() {
    const text = msgInput.trim();
    if (!text) return;
    const newMsg = { out: true, text, time: "Just now" };
    setThreads(prev => ({ ...prev, [activeConvo]: [...(prev[activeConvo] || []), newMsg] }));
    setConvos(prev => prev.map(c => c.id === activeConvo ? { ...c, preview: text, time: "Just now" } : c));
    setMsgInput("");
    if (activeConvoData?.online) {
      setTimeout(() => setTyping(true), 600);
      const replies = ["Got it, thanks!", "Perfect, I'll take care of it.", "Thanks for letting me know!", "Okay, noted."];
      setTimeout(() => {
        setTyping(false);
        const replyMsg = { out: false, text: replies[Math.floor(Math.random() * replies.length)], time: "Just now" };
        setThreads(prev => ({ ...prev, [activeConvo]: [...(prev[activeConvo] || []), replyMsg] }));
      }, 2200);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ fontFamily: F.dm, fontWeight: 300, background: C.black, color: C.white, height: 'calc(100vh - 60px)', overflow: 'hidden', margin: '-1.5rem -2rem' }}>
      <style>{`
        @keyframes fadeMsg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        .convos-list::-webkit-scrollbar, .messages-area::-webkit-scrollbar { width: 3px; }
        .convos-list::-webkit-scrollbar-track, .messages-area::-webkit-scrollbar-track { background: transparent; }
        .convos-list::-webkit-scrollbar-thumb, .messages-area::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: '100%', overflow: 'hidden' }}>
        
        {/* ── CONVERSATIONS LIST ──────────────────────────── */}
        <div style={{ borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.muted2 }}>
          <div style={{ padding: '1.2rem 1.2rem 0.8rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ fontFamily: F.bebas, fontSize: '1.4rem', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '0.8rem' }}>Messages</div>
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
              <input type="text" placeholder="Search conversations…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.82rem', padding: '0.6rem 0.9rem 0.6rem 2rem', borderRadius: '3px', outline: 'none' }} />
            </div>
          </div>

          <div className="convos-list" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConvos.map(convo => (
              <div key={convo.id} onClick={() => openConvo(convo.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.2rem',
                cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                background: activeConvo === convo.id ? 'rgba(58,143,212,0.06)' : 'transparent',
                borderLeft: activeConvo === convo.id ? `2px solid ${C.blue}` : '2px solid transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: convo.color, color: convo.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.9rem', flexShrink: 0 }}>
                  {convo.initials}
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', border: `2px solid ${C.muted2}`, background: convo.online ? C.greenLight : 'rgba(245,240,232,0.2)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: convo.unread ? 600 : 400, color: C.white }}>{convo.name}</span>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{convo.time}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: convo.unread ? 'rgba(245,240,232,0.7)' : 'rgba(245,240,232,0.35)', fontWeight: convo.unread ? 500 : 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{convo.preview}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '2px' }}>{convo.role}</div>
                </div>
                {convo.unread > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── CHAT AREA ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.black }}>
          {activeConvoData ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, background: C.muted2 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: activeConvoData.color, color: activeConvoData.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.9rem', flexShrink: 0 }}>
                  {activeConvoData.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: C.white }}>{activeConvoData.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: activeConvoData.online ? C.greenLight : 'rgba(245,240,232,0.2)' }}>{activeConvoData.online ? 'Online' : 'Offline'}</span>
                    <span>· {activeConvoData.role}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ width: 30, height: 30, background: C.black, border: `1px solid ${C.border}`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}>
                    <Icon name="user" size={13} />
                  </button>
                  <button style={{ width: 30, height: 30, background: C.black, border: `1px solid ${C.border}`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}>
                    <Icon name="phone" size={13} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesRef} className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.8rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: C.border }} />
                  <span style={{ fontFamily: F.mono, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)', whiteSpace: 'nowrap' }}>Today</span>
                  <div style={{ flex: 1, height: '1px', background: C.border }} />
                </div>
                {activeThread.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
                    flexDirection: msg.out ? 'row-reverse' : 'row',
                    animation: `fadeMsg 0.3s ease forwards`, opacity: 0,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: F.bebas, fontSize: '0.6rem', marginBottom: '2px',
                      background: msg.out ? 'rgba(58,143,212,0.15)' : activeConvoData.color,
                      color: msg.out ? C.blue : activeConvoData.text,
                    }}>
                      {msg.out ? "DN" : activeConvoData.initials}
                    </div>
                    <div>
                      <div style={{
                        maxWidth: '480px', padding: '0.65rem 0.9rem',
                        borderRadius: msg.out ? '10px 4px 10px 10px' : '4px 10px 10px 10px',
                        fontSize: '0.84rem', lineHeight: 1.55, wordBreak: 'break-word',
                        background: msg.out ? 'rgba(58,143,212,0.12)' : C.muted2,
                        border: `1px solid ${msg.out ? 'rgba(58,143,212,0.15)' : C.border}`,
                        color: C.white,
                      }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.2rem', display: 'block', textAlign: msg.out ? 'right' : 'left' }}>{msg.time}</span>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: activeConvoData.color, color: activeConvoData.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.6rem', marginBottom: '2px' }}>
                      {activeConvoData.initials}
                    </div>
                    <div style={{ background: C.muted2, border: `1px solid ${C.border}`, padding: '0.6rem 0.9rem', borderRadius: '4px 10px 10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {[0, 1, 2].map(d => <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(245,240,232,0.3)', animation: `bounce 1.2s ease infinite ${d * 0.2}s` }} />)}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>typing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
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
                  <button onClick={handleSend} style={{
                    background: C.blue, color: C.white, border: 'none', width: 36, height: 36,
                    borderRadius: '3px', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="send" size={15} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.08)' }}>
              <div style={{ textAlign: 'center' }}>
                <Icon name="messages" size={56} style={{ opacity: 0.1, marginBottom: '0.8rem' }} />
                <p style={{ fontSize: '0.85rem', fontFamily: F.mono, color: 'rgba(245,240,232,0.15)' }}>Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}