// Strips everything except digits — the format WhatsApp's click-to-chat
// (wa.me) URLs require: country code + number, no "+", spaces or dashes.
export const toWhatsappDigits = (value?: string | null) => (value || "").replace(/\D/g, "");

/** Loose check mirroring the backend: 10 (bare local number) to 15 (full E.164) digits. */
export const isValidPhoneNumber = (value?: string | null) => {
  const digits = toWhatsappDigits(value);
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Builds a wa.me click-to-chat link. If the number normalizes to exactly 10
 * digits (a bare Indian mobile number entered without a country code), "91"
 * is assumed since this platform only operates in India. Returns null when
 * there's no usable number, so callers can hide the button instead of
 * linking to an invalid URL.
 */
export const getWhatsappLink = (whatsappNumber?: string | null) => {
  const digits = toWhatsappDigits(whatsappNumber);
  if (digits.length < 10) return null;
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
};
