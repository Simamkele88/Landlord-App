// COLORS
export const c = {
  black: '#000000',
  white: '#fdfdfd',
  gold: '#8b6e1a',
  orange: '#c25e1a',
  green: '#2b7a4b',
  greenLight: '#2b7a4b',
  redLight: '#9e3a3a',
  blue: '#2c6b9b',
  purple: '#54326b',
  muted: '#f9fafb',
  muted2: '#f7f8fa',
  border: '#dfe3e8',
  borderFocus: 'rgba(52,152,219,0.5)',
  textMuted: '#5f6b7a',
  textDim: '#95a5a6',
  textBody: '#333333',
  textLabel: '#4a4a4a',
  bubbleOut: '#e9ecef',
  bubbleIn: '#f5f5f5',
  bgLight: '#fafafa',
  bgCard: '#fdfdfd',
  shadowHover: '0 4px 20px rgba(0,0,0,0.12)',
};

// FONTS
export const f = {
  bebas: "'Segoe UI', sans-serif",
  dm: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif",
  mono: "'SF Mono', 'Cascadia Code', 'Roboto Mono', monospace",
};

// SHARED INPUT STYLES
export const inputStyle = {
  width: '100%',
  background: c.white,
  border: `1px solid #dee2e6`,
  color: c.black,
  fontFamily: f.dm,
  fontSize: '0.85rem',
  padding: '0.5rem 0.8rem',
  borderRadius: '2px',
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
  background: '#2c3e50',
  color: '#ffffff',
  padding: '0.5rem 1.2rem',
  fontFamily: f.dm,
  fontWeight: 500,
  fontSize: '0.85rem',
  letterSpacing: '0.02em',
  border: '1px solid #2c3e50',
  borderRadius: '2px',
  cursor: 'pointer',
};

export const btnGhost = {
  background: 'transparent',
  color: c.black,
  padding: '0.5rem 1.2rem',
  fontFamily: f.dm,
  fontWeight: 400,
  fontSize: '0.85rem',
  letterSpacing: '0.02em',
  border: `1px solid #ccc`,
  borderRadius: '2px',
  cursor: 'pointer',
};

export const btnSmall = {
  background: '#2c3e50',
  color: '#ffffff',
  padding: '0.3rem 0.8rem',
  fontFamily: f.dm,
  fontWeight: 500,
  fontSize: '0.75rem',
  letterSpacing: '0.02em',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
};

// STATUS PILL STYLES
export const statusStyles = {
  active:   { bg: '#eef5e8', color: '#2b7a4b', border: '1px solid #c5d9b8' },
  pending:  { bg: '#faf6ed', color: '#8b6e1a', border: '1px solid #e5dbb8' },
  done:     { bg: '#f5f5f5', color: '#5f6b7a', border: '1px solid #ddd' },
  quoting:  { bg: '#e8f0f5', color: '#2c6b9b', border: '1px solid #b0cfe0' },
  online:   { bg: '#eef5e8', color: '#2b7a4b' },
  busy:     { bg: '#fbeaea', color: '#c25e1a' },
  away:     { bg: '#f5f5f5', color: '#5f6b7a' },
  escrow:   { bg: '#e8f0f5', color: '#2c6b9b', border: '1px solid #b0cfe0' },
  paid:     { bg: '#eef5e8', color: '#2b7a4b', border: '1px solid #c5d9b8' },
  failed:   { bg: '#fbeaea', color: '#9e3a3a', border: '1px solid #e5bdbd' },
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
    0%, 100% { box-shadow: 0 0 0 0 rgba(43,122,75,0.5); }
    50% { box-shadow: 0 0 0 5px rgba(43,122,75,0); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139,110,26,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(139,110,26,0); }
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

// GLOBAL RESET STYLES
export const globalReset = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #fafafa;
    color: #000000;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 400;
    overflow-x: hidden;
  }
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.15;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${c.borderFocus} !important;
    box-shadow: 0 0 0 2px rgba(52,152,219,0.1);
  }
`;