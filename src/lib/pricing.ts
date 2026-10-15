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

