// PetHub Design System — Color Tokens & Shadows
// Primary palette: Indigo 600 (#4F46E5) — modern, trustworthy, medical-grade feel

export const colors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:      '#4F46E5',   // Indigo 600 — CTAs, active states, links
  primaryDark:  '#3730A3',   // Indigo 800 — pressed states
  primaryLight: '#EEF2FF',   // Indigo 50  — chip bg, icon backgrounds
  primaryMid:   '#818CF8',   // Indigo 400 — borders, subtle accents

  // ── Semantic ───────────────────────────────────────────────────────────────
  success:      '#059669',   // Emerald 600
  successLight: '#D1FAE5',   // Emerald 100
  warning:      '#D97706',   // Amber 600
  warningLight: '#FEF3C7',   // Amber 100
  error:        '#DC2626',   // Red 600
  errorLight:   '#FEE2E2',   // Red 100
  info:         '#0284C7',   // Sky 600
  infoLight:    '#E0F2FE',   // Sky 100

  // ── Neutrals ───────────────────────────────────────────────────────────────
  bg:           '#F8FAFC',   // Slate 50  — screen background
  surface:      '#FFFFFF',   // White     — card / input background
  surfaceAlt:   '#F1F5F9',   // Slate 100 — subtle sections
  border:       '#E2E8F0',   // Slate 200
  borderLight:  '#F1F5F9',   // Slate 100

  // ── Text ───────────────────────────────────────────────────────────────────
  text:         '#1E293B',   // Slate 800 — primary text
  textSub:      '#64748B',   // Slate 500 — secondary / metadata
  textMuted:    '#94A3B8',   // Slate 400 — placeholders, hints
  textOnPrimary:'#FFFFFF',   // Text on brand color backgrounds

  // ── Pet species accent colours ─────────────────────────────────────────────
  dog:    '#F59E0B',   // Amber  — dogs
  cat:    '#8B5CF6',   // Violet — cats
  bird:   '#06B6D4',   // Cyan   — birds
  rabbit: '#EC4899',   // Pink   — rabbits
  other:  '#6B7280',   // Gray   — other
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
};
