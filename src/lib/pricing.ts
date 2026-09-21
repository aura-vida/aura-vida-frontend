// Group pricing: the base price covers one person, each extra person adds 60%.
export const EXTRA_PERSON_RATE = 0.6;
export const MAX_GROUP_SIZE = 6;

export const parsePrice = (price?: string) =>
  price ? Number(price.replace(/[^\d]/g, "")) : 0;

/** Total in rupees for a session of `groupSize` people at `base` rupees. */
export const groupTotal = (base: number, groupSize: number) =>
  base + Math.round(base * EXTRA_PERSON_RATE) * Math.max(0, groupSize - 1);

export const formatINR = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;
