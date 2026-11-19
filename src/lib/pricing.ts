// Group pricing: the base price covers one person, each extra person adds 60%.
export const EXTRA_PERSON_RATE = 0.6;
export const MAX_GROUP_SIZE = 10;

// Master toggle for GST/tax calculations platform-wide.
// Set to false to temporarily disable GST/tax across the application.
// Set to true to re-enable in the future.
export const ENABLE_GST = false;

// Preserved original rates for re-enabling in the future:
export const ORIGINAL_SESSION_TAX_RATE = 0.05;
export const ORIGINAL_SPACE_GST_RATE = 0.18;

// Keep in sync with SESSION_TAX_RATE in Kusala-backend/src/controllers/payment.controller.js —
// the backend is the authority on the charged amount; this is only for display here.
export const SESSION_TAX_RATE = ENABLE_GST ? ORIGINAL_SESSION_TAX_RATE : 0;

// Space GST — mirrors SPACE_GST_RATE in backend/src/config/spacePricing.js
export const SPACE_GST_RATE = ENABLE_GST ? ORIGINAL_SPACE_GST_RATE : 0;

export const parsePrice = (price?: string) =>
  price ? Number(price.replace(/[^\d]/g, "")) : 0;

/** Total in rupees for a session of `groupSize` people at `base` rupees. */
export const groupTotal = (base: number, groupSize: number) =>
  base + Math.round(base * EXTRA_PERSON_RATE) * Math.max(0, groupSize - 1);

/** 5% tax on the session subtotal, in rupees, rounded the same way the backend does. */
export const sessionTax = (subtotal: number) =>
  ENABLE_GST ? Math.round(subtotal * SESSION_TAX_RATE) : 0;

/**
 * Splits a tax-inclusive total (e.g. a booking's stored `amount`) back into
 * its session-price and tax parts, for previewing a refund before it's
 * requested. Mirrors the backend's refund math (session price only; tax is
 * non-refundable) for the common case with no referral credit applied — if
 * credit was used, the actual refund (computed server-side) may be lower
 * than this preview, since it's capped at what was really charged.
 */
export const splitTaxInclusiveTotal = (total: number) => {
  if (!ENABLE_GST || SESSION_TAX_RATE === 0) {
    return { subtotal: total, tax: 0 };
  }
  const subtotal = Math.round(total / (1 + SESSION_TAX_RATE));
  return { subtotal, tax: total - subtotal };
};

export const formatINR = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

/**
 * Calculates the exact subtotal matching the backend's dynamic mode-based pricing.
 */
export const calculateSessionSubtotal = (
  practitioner: any,
  mode: string,
  groupSize: number = 1
): number => {
  if (!practitioner) return 0;
  const size = Math.max(1, groupSize || 1);
  const normalizedMode = (mode || "").toLowerCase();
  let privatePrice = 0;
  let groupPricePerPerson = 0;

  if (normalizedMode === "studio") {
    privatePrice = Number(practitioner.price_studio_private) || 0;
    groupPricePerPerson = Number(practitioner.price_studio_group) || 0;
  } else if (normalizedMode === "online") {
    privatePrice = Number(practitioner.price_online_private) || 0;
    groupPricePerPerson = Number(practitioner.price_online_group) || 0;
  } else if (normalizedMode === "centre") {
    privatePrice = Number(practitioner.price_centre_private) || 0;
    groupPricePerPerson = Number(practitioner.price_centre_group) || 0;
  } else if (normalizedMode === "host") {
    privatePrice = Number(practitioner.price_host_private) || 0;
    groupPricePerPerson = Number(practitioner.price_host_group) || 0;
  }

  if (size > 1 && groupPricePerPerson > 0) {
    return groupPricePerPerson * size;
  }
  if (size === 1 && privatePrice > 0) {
    return privatePrice;
  }
  if (size > 1 && privatePrice > 0) {
    return privatePrice + Math.round(privatePrice * EXTRA_PERSON_RATE) * (size - 1);
  }
  const fallback = Number(practitioner.price_inr) || 0;
  return groupTotal(fallback, size);
};

/**
 * Computes the starting baseline price across a practitioner's active formats.
 */
export const getStartingPrice = (practitioner: any): number => {
  if (!practitioner) return 0;
  const rates = [
    practitioner.offers_studio ? (Number(practitioner.price_studio_private) || Number(practitioner.price_studio_group) || 0) : 0,
    practitioner.offers_online ? (Number(practitioner.price_online_private) || Number(practitioner.price_online_group) || 0) : 0,
    practitioner.offers_centre ? (Number(practitioner.price_centre_private) || Number(practitioner.price_centre_group) || 0) : 0,
    practitioner.offers_host ? (Number(practitioner.price_host_private) || Number(practitioner.price_host_group) || 0) : 0,
  ].filter(r => r > 0);
  if (rates.length > 0) return Math.min(...rates);
  return Number(practitioner.price_inr) || 0;
};

// ─── Space Pricing ────────────────────────────────────────────────────────────
// Mirrors backend/src/config/spacePricing.js — display-only; backend is authoritative.

export interface SpacePricingResult {
  spaceType: string;
  hourlyRate: number;
  durationHours: number;
  spaceSubtotal: number;
  gstPercent: number;
  gstAmount: number;
  totalSpaceCost: number;
}

const HOUR_SPACE_PRICING = {
  weekday: [
    { max_clients: 2, rate: 825 },
    { max_clients: 4, rate: 1100 },
    { max_clients: Infinity, rate: 1485 },
  ],
  sunday: [
    { max_clients: 2, rate: 1100 },
    { max_clients: 4, rate: 1485 },
    { max_clients: Infinity, rate: 1650 },
  ],
};

const ECLIPSE_PRICING = [
  { max_persons: 5, rate: 1500 },
  { max_persons: Infinity, rate: 3000 },
];

const BOHEMISO_PRICING = [
  { max_persons: Infinity, rate: 1500 },
];

function resolveSlab(slabs: { max_clients?: number; max_persons?: number; rate: number }[], count: number): number {
  for (const slab of slabs) {
    const limit = slab.max_clients ?? slab.max_persons ?? Infinity;
    if (count <= limit) return slab.rate;
  }
  return slabs[slabs.length - 1].rate;
}

export function identifySpaceCategory(spaceType?: string, spaceName?: string): string | null {
  const combined = `${spaceType || ''} ${spaceName || ''}`.toLowerCase();
  if (combined.includes('hour')) return 'hour_space';
  if (combined.includes('eclipse')) return 'eclipse';
  if (combined.includes('bohemiso')) return 'bohemiso';
  return null;
}

export interface SpacePricingDetails {
  category: 'hour_space' | 'eclipse' | 'bohemiso' | 'general';
  startingPrice: number;
  startingPriceText: string;
  hasSlabs: boolean;
  slabs: { label: string; rate: number }[];
  weekendSlabs?: { label: string; rate: number }[];
  policy?: string;
  gstNote: string;
}

export function getSpacePricingInfo(spaceType?: string, spaceName?: string): SpacePricingDetails | null {
  const cat = identifySpaceCategory(spaceType, spaceName);
  if (cat === 'hour_space') {
    return {
      category: 'hour_space',
      startingPrice: 825,
      startingPriceText: 'From ₹825/hr',
      hasSlabs: true,
      slabs: [
        { label: '1–2 persons', rate: 825 },
        { label: '3–4 persons', rate: 1100 },
        { label: '5+ persons', rate: 1485 },
      ],
      weekendSlabs: [
        { label: '1–2 persons', rate: 1100 },
        { label: '3–4 persons', rate: 1485 },
        { label: '5+ persons', rate: 1650 },
      ],
      policy: 'Cancellation accepted only if 12 hours prior notification is provided.',
      gstNote: ENABLE_GST ? '+ 18% GST applicable on space hire' : '',
    };
  }
  if (cat === 'eclipse') {
    return {
      category: 'eclipse',
      startingPrice: 1500,
      startingPriceText: 'From ₹1,500/hr',
      hasSlabs: true,
      slabs: [
        { label: '1–5 persons', rate: 1500 },
        { label: '6–20 persons', rate: 3000 },
      ],
      gstNote: ENABLE_GST ? '+ 18% GST applicable on space hire' : '',
    };
  }
  if (cat === 'bohemiso') {
    return {
      category: 'bohemiso',
      startingPrice: 1500,
      startingPriceText: '₹1,500/hr',
      hasSlabs: false,
      slabs: [
        { label: 'Up to 20 persons', rate: 1500 },
      ],
      gstNote: ENABLE_GST ? '+ 18% GST applicable on space hire' : '',
    };
  }
  return null;
}

/**
 * Calculate partner space fee for display purposes.
 * The backend recalculates this authoritatively — this is only for the preview UI.
 *
 * @param spaceType       'hour_space' | 'eclipse' | 'bohemiso' or general string
 * @param participantCount total group size (client participants)
 * @param bookingDate     'YYYY-MM-DD' in IST
 * @param durationHours   number of booked hours (>= 1)
 * @param spaceName       optional space name for fallback detection
 */
export const calculateSpaceFee = (
  spaceType: string,
  participantCount: number,
  bookingDate: string,
  durationHours: number,
  spaceName?: string
): SpacePricingResult | null => {
  const category = identifySpaceCategory(spaceType, spaceName);
  if (!category) return null;

  const hours = Math.max(1, Math.round(durationHours || 1));
  const count = Math.max(1, Math.round(participantCount || 1));

  let hourlyRate = 0;

  if (category === 'hour_space') {
    const [y, m, d] = (bookingDate || '').split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    const dayType = dayOfWeek === 0 ? 'sunday' : 'weekday';
    hourlyRate = resolveSlab(HOUR_SPACE_PRICING[dayType], count);
  } else if (category === 'eclipse') {
    hourlyRate = resolveSlab(ECLIPSE_PRICING, count);
  } else if (category === 'bohemiso') {
    hourlyRate = resolveSlab(BOHEMISO_PRICING, count);
  } else {
    return null;
  }

  const spaceSubtotal = hourlyRate * hours;
  const gstAmount = ENABLE_GST ? Math.round(spaceSubtotal * SPACE_GST_RATE) : 0;
  const totalSpaceCost = spaceSubtotal + gstAmount;

  return { spaceType: category, hourlyRate, durationHours: hours, spaceSubtotal, gstPercent: ENABLE_GST ? 18 : 0, gstAmount, totalSpaceCost };
};


