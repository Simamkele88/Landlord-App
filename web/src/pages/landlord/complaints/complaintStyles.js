export const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

export const C = {
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

export const F = {
  bebas: '"Bebas Neue", sans-serif',
  dm: '"DM Sans", sans-serif',
  mono: '"Space Mono", monospace',
};

export const TEXT = "#000";
export const SECONDARY_TEXT = "#333";

export const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: C.red,
    bg: "rgba(158,58,58,0.06)",
    border: "1px solid rgba(158,58,58,0.12)",
    dot: C.red,
    icon: "alert-circle",
  },
  under_review: {
    label: "Under Review",
    color: C.gold,
    bg: "rgba(217,158,11,0.06)",
    border: "1px solid rgba(217,158,11,0.12)",
    dot: C.gold,
    icon: "search",
  },
  awaiting_clarification: {
    label: "Needs Clarification",
    color: C.primary,
    bg: "rgba(44,62,80,0.06)",
    border: "1px solid rgba(44,62,80,0.12)",
    dot: C.primary,
    icon: "help-circle",
  },
  approved: {
    label: "Approved",
    color: C.blue,
    bg: "rgba(52,152,219,0.06)",
    border: "1px solid rgba(52,152,219,0.12)",
    dot: C.blue,
    icon: "thumbs-up",
  },
  resolved: {
    label: "Resolved",
    color: C.green,
    bg: "rgba(43,122,75,0.06)",
    border: "1px solid rgba(43,122,75,0.12)",
    dot: C.green,
    icon: "check-circle",
  },
  dismissed: {
    label: "Dismissed",
    color: SECONDARY_TEXT,
    bg: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.1)",
    dot: SECONDARY_TEXT,
    icon: "archive",
  },
  escalated: {
    label: "Escalated",
    color: C.purple,
    bg: "rgba(111,66,193,0.06)",
    border: "1px solid rgba(111,66,193,0.12)",
    dot: C.purple,
    icon: "trending-up",
  },
  rejected: {
    label: "Rejected",
    color: SECONDARY_TEXT,
    bg: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.1)",
    dot: SECONDARY_TEXT,
    icon: "x-circle",
  },
};

export const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

export const SCOPE_ICONS = {
  specific_tenant: "user",
  common_area: "home",
  unknown: "help-circle",
  property_wide: "grid",
};

export const CATEGORY_CONFIG = {
  noise: { label: "Noise", color: C.primary, icon: "volume-2" },
  cleanliness: { label: "Cleanliness", color: C.green, icon: "sparkles" },
  neighbor_dispute: {
    label: "Neighbor Dispute",
    color: C.purple,
    icon: "users",
  },
  parking: { label: "Parking", color: C.blue, icon: "truck" },
  security: { label: "Security", color: C.red, icon: "shield" },
  pets: { label: "Pets", color: C.green, icon: "github" },
  smoking: { label: "Smoking", color: C.red, icon: "wind" },
  property_damage: { label: "Property Damage", color: C.red, icon: "tool" },
  maintenance_issue: { label: "Maintenance", color: C.primary, icon: "wrench" },
  other: { label: "Other", color: SECONDARY_TEXT, icon: "more-horizontal" },
};

export const VERDICT_LABELS = {
  warning: "Warning Issued",
  fine: "Fine Issued",
  dismissed: "Dismissed",
};

export const VERDICT_COLORS = {
  warning: {
    color: C.primary,
    bg: "rgba(44,62,80,0.06)",
    border: "1px solid rgba(44,62,80,0.15)",
    icon: "alert-triangle",
  },
  fine: {
    color: C.red,
    bg: "rgba(158,58,58,0.06)",
    border: "1px solid rgba(158,58,58,0.15)",
    icon: "rand",
  },
  dismissed: {
    color: SECONDARY_TEXT,
    bg: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.1)",
    icon: "x",
  },
};
