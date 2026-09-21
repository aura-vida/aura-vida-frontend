// Server-side price catalogue. Amounts are in paise (INR * 100).
// Prices must never be trusted from the client.

export type CatalogItem = {
  id: string;
  name: string;
  amount: number; // paise
  type: "booking" | "digital";
};

export const CATALOG: Record<string, CatalogItem> = {
  // Practitioner sessions
  "session-lila-moreau": { id: "session-lila-moreau", name: "Session with Lila Moreau", amount: 750000, type: "booking" },
  "session-mateo-aren": { id: "session-mateo-aren", name: "Session with Mateo Aren", amount: 850000, type: "booking" },
  "session-anouk-vidal": { id: "session-anouk-vidal", name: "Session with Anouk Vidal", amount: 980000, type: "booking" },
  "session-priya-shah": { id: "session-priya-shah", name: "Session with Priya Shah", amount: 100, type: "booking" },

  // Digital products
  "digital-programme": { id: "digital-programme", name: "Structured Healing Programme", amount: 249900, type: "digital" },
  "digital-audio": { id: "digital-audio", name: "Guided Meditation Library", amount: 49900, type: "digital" },
  "digital-ebook": { id: "digital-ebook", name: "Educational E-books & Guides", amount: 79900, type: "digital" },
};

// Group sessions: base price covers one person, each extra person adds 60%.
export const EXTRA_PERSON_RATE = 0.6;
export const MAX_GROUP_SIZE = 6;

export const amountForGroup = (item: CatalogItem, groupSize: number) => {
  if (item.type !== "booking") return item.amount;
  const n = Math.min(Math.max(Math.floor(groupSize) || 1, 1), MAX_GROUP_SIZE);
  return item.amount + Math.round(item.amount * EXTRA_PERSON_RATE) * (n - 1);
};
