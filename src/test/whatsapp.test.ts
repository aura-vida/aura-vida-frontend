import { describe, it, expect } from "vitest";
import { toWhatsappDigits, isValidPhoneNumber, getWhatsappLink } from "@/lib/whatsapp";

describe("WhatsApp Validation & Utilities", () => {
  it("strips non-digit characters correctly", () => {
    expect(toWhatsappDigits("+91 98765-43210")).toBe("919876543210");
    expect(toWhatsappDigits("+1 (555) 234-5678")).toBe("15552345678");
    expect(toWhatsappDigits("")).toBe("");
    expect(toWhatsappDigits(null)).toBe("");
  });

  it("validates phone numbers with country codes", () => {
    // Valid numbers with country code
    expect(isValidPhoneNumber("+91 9876543210")).toBe(true);
    expect(isValidPhoneNumber("+1 5552345678")).toBe(true);
    expect(isValidPhoneNumber("+44 7911 123456")).toBe(true);
    expect(isValidPhoneNumber("+971 50 123 4567")).toBe(true);

    // 10-digit local number (minimum valid length)
    expect(isValidPhoneNumber("9876543210")).toBe(true);

    // Invalid numbers (too short, too long, empty)
    expect(isValidPhoneNumber("12345")).toBe(false);
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber(null)).toBe(false);
    expect(isValidPhoneNumber("12345678901234567")).toBe(false); // > 15 digits
  });

  it("generates wa.me links with country codes", () => {
    // With 12 digits (already includes 91)
    expect(getWhatsappLink("+91 9876543210")).toBe("https://wa.me/919876543210");

    // Bare 10 digits defaults to 91
    expect(getWhatsappLink("9876543210")).toBe("https://wa.me/919876543210");

    // US number (+1)
    expect(getWhatsappLink("+1 5552345678")).toBe("https://wa.me/15552345678");

    // Invalid/empty returns null
    expect(getWhatsappLink("")).toBe(null);
    expect(getWhatsappLink("12345")).toBe(null);
  });
});

