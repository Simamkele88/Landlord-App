// COLORS
export const c = {
  black: '#111315',
  white: '#FFFFFF',

  gold: '#F2B51D',
  orange: '#E58A17',

  green: '#22C55E',
  greenLight: '#4ADE80',

  redLight: '#EF4444',

  blue: '#4EA3FF',

  purple: '#8B5CF6',

  muted: '#1C222B',
  muted2: '#161B22',

  border: '#313A46',
  borderFocus: 'rgba(242,181,29,0.45)',

  // Brighter text
  textMuted: '#BFC7D3',
  textDim: '#D0D7E2',
  textBody: '#E6EDF7',
  textLabel: '#FFFFFF',

  bubbleOut: '#262C35',
  bubbleIn: '#1F252E',
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
  background: c.muted2,
  border: `1px solid ${c.border}`,
  color: c.white,
  fontFamily: f.dm,
  fontSize: '1rem',
  padding: '0.9rem 1rem',
  borderRadius: '4px',
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
  color: '#111315',
  padding: '0.95rem 2rem',
  fontFamily: f.dm,
  fontWeight: 700,
  fontSize: '1rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export const btnGhost = {
  background: 'transparent',
  color: c.textBody,
  padding: '0.95rem 2rem',
  fontFamily: f.dm,
  fontWeight: 600,
  fontSize: '1rem',
  border: `1px solid ${c.border}`,
  borderRadius: '4px',
  cursor: 'pointer',
};

export const btnSmall = {
  background: c.gold,
  color: c.black,
  padding: '0.55rem 1.2rem',
  fontFamily: f.dm,
  fontWeight: 700,
  fontSize: '1rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
};

// STATUS PILL STYLES 
export const statusStyles = {
   active: {
    bg: 'rgba(34,197,94,.14)',
    color: '#4ADE80',
    border: '1px solid rgba(74,222,128,.25)'
  },

  pending: {
    bg: 'rgba(242,181,29,.14)',
    color: '#F2B51D',
    border: '1px solid rgba(242,181,29,.25)'
  },

  paid: {
    bg: 'rgba(34,197,94,.14)',
    color: '#4ADE80',
    border: '1px solid rgba(74,222,128,.25)'
  },

  failed: {
    bg: 'rgba(239,68,68,.14)',
    color: '#EF4444',
    border: '1px solid rgba(239,68,68,.25)'
  },

  quoting: {
    bg: 'rgba(78,163,255,.14)',
    color: '#4EA3FF',
    border: '1px solid rgba(78,163,255,.25)'
  },

  escrow: {
    bg: 'rgba(78,163,255,.14)',
    color: '#4EA3FF',
    border: '1px solid rgba(78,163,255,.25)'
  },

  online: {
    bg: 'rgba(34,197,94,.14)',
    color: '#4ADE80'
  },

  busy: {
    bg: 'rgba(229,138,23,.14)',
    color: '#E58A17'
  },

  away: {
    bg: 'rgba(255,255,255,.08)',
    color: '#D0D7E2'
  },

  done: {
    bg: 'rgba(255,255,255,.06)',
    color: '#BFC7D3',
    border: `1px solid ${c.border}`
  }
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
     font-size: 16px;
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
