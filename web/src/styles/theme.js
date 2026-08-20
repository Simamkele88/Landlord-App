export const c = {
  black: '#2c3e50',
  white: '#ffffff',
  gold: '#2c3e50',
  orange: '#e67e22',
  green: '#27ae60',
  greenLight: '#2ecc71',
  redLight: '#e74c3c',
  blue: '#3498db',
  purple: '#8e44ad',
  muted: '#95a5a6',
  muted2: '#ecf0f1',
  border: '#e8ecf0',
  borderFocus: 'rgba(52,152,219,0.5)',
  textMuted: 'rgba(44,62,80,0.35)',
  textDim: 'rgba(44,62,80,0.25)',
  textBody: 'rgba(44,62,80,0.6)',
  textLabel: 'rgba(44,62,80,0.75)',
  bubbleOut: '#f0f3f7',
  bubbleIn: '#e8edf2',
  bgLight: '#f8f9fa',
  bgCard: '#ffffff',
  shadow: '0 1px 3px rgba(0,0,0,0.06)',
  shadowHover: '0 4px 16px rgba(0,0,0,0.08)',
};

export const f = {
  bebas: "'Bebas Neue', sans-serif",
  dm: "'DM Sans', sans-serif",
  mono: "'Space Mono', monospace",
};

export const inputStyle = {
  width: '100%',
  background: c.white,
  border: `1px solid ${c.border}`,
  color: c.black,
  fontFamily: f.dm,
  fontSize: '0.88rem',
  padding: '0.8rem 1rem',
  borderRadius: '4px',
  outline: 'none',
  transition: 'all 0.2s ease',
};

export const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 90,
  lineHeight: 1.6,
};

export const btnPrimary = {
  background: c.blue,
  color: c.white,
  padding: '0.9rem 2rem',
  fontFamily: f.dm,
  fontWeight: 600,
  fontSize: '0.88rem',
  letterSpacing: '0.04em',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const btnGhost = {
  background: 'transparent',
  color: c.textBody,
  padding: '0.9rem 2rem',
  fontFamily: f.dm,
  fontWeight: 500,
  fontSize: '0.88rem',
  letterSpacing: '0.04em',
  border: `1px solid ${c.border}`,
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const btnSmall = {
  background: c.blue,
  color: c.white,
  padding: '0.55rem 1.2rem',
  fontFamily: f.dm,
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.04em',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const statusStyles = {
  active:   { bg: 'rgba(52,152,219,0.10)', color: c.blue, border: '1px solid rgba(52,152,219,0.2)' },
  pending:  { bg: 'rgba(241,196,15,0.10)', color: '#f39c12', border: '1px solid rgba(241,196,15,0.2)' },
  done:     { bg: 'rgba(44,62,80,0.04)', color: c.textMuted, border: `1px solid ${c.border}` },
  quoting:  { bg: 'rgba(52,152,219,0.10)', color: c.blue, border: '1px solid rgba(52,152,219,0.2)' },
  online:   { bg: 'rgba(46,204,113,0.10)', color: c.greenLight },
  busy:     { bg: 'rgba(230,126,34,0.10)', color: c.orange },
  away:     { bg: 'rgba(44,62,80,0.04)', color: c.textBody },
  escrow:   { bg: 'rgba(52,152,219,0.10)', color: c.blue, border: '1px solid rgba(52,152,219,0.2)' },
  paid:     { bg: 'rgba(46,204,113,0.10)', color: c.greenLight, border: '1px solid rgba(46,204,113,0.2)' },
  failed:   { bg: 'rgba(231,76,60,0.08)', color: c.redLight, border: '1px solid rgba(231,76,60,0.2)' },
};

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
    0%, 100% { box-shadow: 0 0 0 0 rgba(52,152,219,0.4); }
    50% { box-shadow: 0 0 0 5px rgba(52,152,219,0); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(52,152,219,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(52,152,219,0); }
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

export const globalReset = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #f8f9fa;
    color: #2c3e50;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    overflow-x: hidden;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${c.blue} !important;
    box-shadow: 0 0 0 3px rgba(52,152,219,0.08);
  }
  ::selection {
    background: ${c.blue};
    color: ${c.white};
  }
`;

export const cardStyle = {
  background: c.bgCard,
  borderRadius: '4px',
  boxShadow: c.shadow,
  border: `1px solid ${c.border}`,
  padding: '1.5rem',
  transition: 'all 0.3s ease',
};

export const cardHover = {
  ...cardStyle,
  boxShadow: c.shadowHover,
  transform: 'translateY(-2px)',
};

export const pageContainer = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem 1.5rem',
};

export const sectionTitle = {
  fontFamily: f.dm,
  fontSize: '1.6rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: c.black,
  marginBottom: '0.5rem',
};

export const sectionSubtitle = {
  fontFamily: f.dm,
  fontSize: '0.95rem',
  color: c.textBody,
  marginBottom: '2rem',
};

export const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.88rem',
};

export const tableHead = {
  background: c.bgLight,
  color: c.textLabel,
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.06em',
  padding: '0.8rem 1rem',
  textAlign: 'left',
  borderBottom: `2px solid ${c.border}`,
};

export const tableRow = {
  padding: '0.8rem 1rem',
  borderBottom: `1px solid ${c.border}`,
  color: c.black,
};

export const tagStyle = {
  display: 'inline-block',
  padding: '0.2rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export const formGroup = {
  marginBottom: '1.5rem',
};

export const formLabel = {
  display: 'block',
  fontFamily: f.dm,
  fontSize: '0.82rem',
  fontWeight: 600,
  color: c.textLabel,
  marginBottom: '0.4rem',
  letterSpacing: '0.02em',
};

export const gridLayout = {
  display: 'grid',
  gap: '1.5rem',
};

export const flexBetween = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const flexCenter = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const flexColumn = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

export const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: 500,
};

export const linkStyle = {
  color: c.blue,
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'color 0.2s ease',
};

export const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(44,62,80,0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

export const modalContent = {
  background: c.bgCard,
  borderRadius: '8px',
  padding: '2rem',
  maxWidth: '560px',
  width: '90%',
  boxShadow: c.shadowHover,
  maxHeight: '90vh',
  overflow: 'auto',
};