// COLORS
export const c = {
  black: '#0a0a0a',
  white: '#f5f0e8',
  gold: '#e8a012',
  orange: '#d45a1a',
  green: '#1a7a4a',
  greenLight: '#4cba7a',
  redLight: '#e05a4a',
  blue: '#3a8fd4',
  purple: '#8b5cf6',
  muted: '#2a2a2a',
  muted2: '#1e1e1e',
  border: '#2e2e2e',
  borderFocus: 'rgba(232,160,18,0.5)',
  textMuted: 'rgba(245,240,232,0.35)',
  textDim: 'rgba(245,240,232,0.25)',
  textBody: 'rgba(245,240,232,0.6)',
  textLabel: 'rgba(245,240,232,0.75)',
  bubbleOut: '#2e2a20',
  bubbleIn: '#222222',
};

// FONTS
export const f = {
  bebas: "'Bebas Neue', sans-serif",
  dm: "'DM Sans', sans-serif",
  mono: "'Space Mono', monospace",
};

// SHARED INPUT STYLES
export const inputStyle = {
  width: '100%',
  background: c.black,
  border: `1px solid ${c.border}`,
  color: c.white,
  fontFamily: f.dm,
  fontSize: '0.88rem',
  padding: '0.8rem 1rem',
  borderRadius: '3px',
  outline: 'none',
};

export const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 90,
  lineHeight: 1.6,
};

// SHARED BUTTON STYLES
export const btnPrimary = {
  background: c.gold,
  color: c.black,
  padding: '0.9rem 2rem',
  fontFamily: f.dm,
  fontWeight: 700,
  fontSize: '0.88rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
};

export const btnGhost = {
  background: 'transparent',
  color: c.textBody,
  padding: '0.9rem 2rem',
  fontFamily: f.dm,
  fontWeight: 500,
  fontSize: '0.88rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: `1px solid ${c.border}`,
  borderRadius: '2px',
  cursor: 'pointer',
};

export const btnSmall = {
  background: c.gold,
  color: c.black,
  padding: '0.55rem 1.2rem',
  fontFamily: f.dm,
  fontWeight: 700,
  fontSize: '0.75rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
};

// STATUS PILL STYLES 
export const statusStyles = {
  active:   { bg: 'rgba(26,122,74,0.15)', color: c.greenLight, border: '1px solid rgba(76,186,122,0.2)' },
  pending:  { bg: 'rgba(232,160,18,0.1)', color: c.gold, border: '1px solid rgba(232,160,18,0.2)' },
  done:     { bg: 'rgba(245,240,232,0.06)', color: c.textMuted, border: `1px solid ${c.border}` },
  quoting:  { bg: 'rgba(58,143,212,0.12)', color: c.blue, border: '1px solid rgba(58,143,212,0.25)' },
  online:   { bg: 'rgba(26,122,74,0.12)', color: c.greenLight },
  busy:     { bg: 'rgba(212,90,26,0.12)', color: c.orange },
  away:     { bg: 'rgba(245,240,232,0.05)', color: c.textBody },
  escrow:   { bg: 'rgba(58,143,212,0.12)', color: c.blue, border: '1px solid rgba(58,143,212,0.2)' },
  paid:     { bg: 'rgba(26,122,74,0.15)', color: c.greenLight, border: '1px solid rgba(76,186,122,0.2)' },
  failed:   { bg: 'rgba(224,90,74,0.1)', color: c.redLight, border: '1px solid rgba(224,90,74,0.2)' },
};

// KEYFRAMES
export const globalKeyframes = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(76,186,122,0.5); }
    50% { box-shadow: 0 0 0 5px rgba(76,186,122,0); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232,160,18,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(232,160,18,0); }
  }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }
  @keyframes popIn {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

//s GLOBAL RESET STYLES
export const globalReset = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #0a0a0a;
    color: #f5f0e8;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    overflow-x: hidden;
  }
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.4;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${c.borderFocus} !important;
  }
`;
