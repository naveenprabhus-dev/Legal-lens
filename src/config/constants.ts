export const APP_NAME = 'Legal Lens';
export const APP_TAGLINE = 'Understand. Compare. Prepare. Navigate.';
export const APP_HEADLINE = "Legal information shouldn't require a law degree.";
export const APP_SUBHEADLINE = 'Understand your documents. Find what matters. Prepare what comes next.';

export const LEGAL_DISCLAIMER =
  'Legal Lens is an evidence-grounded legal information workspace and does not provide legal advice. It is not an AI lawyer and cannot substitute for a licensed attorney.';

export const TRUST_NOTE = 'Your workspace is protected by your account.';

// Risk & Severity Color Palettes (Pastel system compliant with Section 8)
export const RISK_COLORS = {
  low: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Low Risk',
  },
  moderate: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Moderate Risk',
  },
  high: {
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
    label: 'Elevated Risk',
  },
  critical: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Critical Attention',
  },
} as const;

export const INSIGHT_TYPE_CONFIG = {
  risk: {
    label: 'Legal Risk',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  obligation: {
    label: 'Obligation',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  deadline: {
    label: 'Key Deadline',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  benefit: {
    label: 'Right / Benefit',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  ambiguity: {
    label: 'Ambiguity',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
  },
} as const;
