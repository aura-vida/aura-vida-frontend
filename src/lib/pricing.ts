// Group pricing: the base price covers one person, each extra person adds 60%.
export const EXTRA_PERSON_RATE = 0.6;
export const MAX_GROUP_SIZE = 10;

// Keep in sync with SESSION_TAX_RATE in aura-vida-backend/src/controllers/payment.controller.js —
// the backend is the authority on the charged amount; this is only for display here.
export const SESSION_TAX_RATE = 0.05;

export const parsePrice = (price?: string) =>
  price ? Number(price.replace(/[^\d]/g, "")) : 0;

/** Total in rupees for a session of `groupSize` people at `base` rupees. */
export const groupTotal = (base: number, groupSize: number) =>
  base + Math.round(base * EXTRA_PERSON_RATE) * Math.max(0, groupSize - 1);

/** 5% tax on the session subtotal, in rupees, rounded the same way the backend does. */
export const sessionTax = (subtotal: number) => Math.round(subtotal * SESSION_TAX_RATE);

/**
 * Splits a tax-inclusive total (e.g. a booking's stored `amount`) back into
 * its session-price and tax parts, for previewing a refund before it's
 * requested. Mirrors the backend's refund math (session price only; tax is
 * non-refundable) for the common case with no referral credit applied — if
 * credit was used, the actual refund (computed server-side) may be lower
 * than this preview, since it's capped at what was really charged.
 */
export const splitTaxInclusiveTotal = (total: number) => {
  const subtotal = Math.round(total / (1 + SESSION_TAX_RATE));
  return { subtotal, tax: total - subtotal };
};

export const formatINR = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;
