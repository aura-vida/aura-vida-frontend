import React, { useState, useEffect, useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountryCodeOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "AE", name: "UAE", dialCode: "+971", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
];

interface WhatsAppInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function WhatsAppInput({
  id = "whatsapp-number",
  name = "whatsapp_number",
  value,
  onChange,
  placeholder = "98765 43210",
  required = true,
  disabled = false,
  className,
  autoFocus = false,
}: WhatsAppInputProps) {
  // Parse initial country dial code and phone number
  const initialParsed = useMemo(() => {
    if (!value) return { dialCode: "+91", localNumber: "" };
    const cleaned = value.trim();

    // Check if starts with a known dial code
    for (const c of COUNTRY_CODES) {
      if (cleaned.startsWith(c.dialCode)) {
        return {
          dialCode: c.dialCode,
          localNumber: cleaned.slice(c.dialCode.length).trim(),
        };
      }
    }

    if (cleaned.startsWith("+")) {
      // Custom country code
      const match = cleaned.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        return { dialCode: match[1], localNumber: match[2] };
      }
    }

    // Default to +91
    return { dialCode: "+91", localNumber: cleaned.replace(/^\+91/, "").trim() };
  }, [value]);

  const [selectedDialCode, setSelectedDialCode] = useState<string>(initialParsed.dialCode);
  const [localNumber, setLocalNumber] = useState<string>(initialParsed.localNumber);

  // Sync if value changes externally
  useEffect(() => {
    if (value) {
      for (const c of COUNTRY_CODES) {
        if (value.startsWith(c.dialCode)) {
          setSelectedDialCode(c.dialCode);
          setLocalNumber(value.slice(c.dialCode.length).trim());
          return;
        }
      }
    }
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDial = e.target.value;
    setSelectedDialCode(newDial);
    const combined = localNumber.trim() ? `${newDial} ${localNumber.trim()}` : "";
    onChange(combined);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // Handle user pasting with a country code e.g. +91 98765...
    if (inputVal.startsWith("+")) {
      for (const c of COUNTRY_CODES) {
        if (inputVal.startsWith(c.dialCode)) {
          setSelectedDialCode(c.dialCode);
          const rest = inputVal.slice(c.dialCode.length).trim();
          setLocalNumber(rest);
          onChange(`${c.dialCode} ${rest}`);
          return;
        }
      }
    }

    // Strip non-digits and spacing
    const sanitized = inputVal.replace(/[^\d\s-]/g, "");
    setLocalNumber(sanitized);
    const combined = sanitized.trim() ? `${selectedDialCode} ${sanitized.trim()}` : "";
    onChange(combined);
  };

  return (
    <div className={cn("relative flex items-center rounded-full border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden transition-all", className)}>
      <div className="flex items-center pl-3.5 pr-2 border-r border-border/60 bg-muted/30 h-full py-2">
        <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mr-1.5" />
        <select
          value={selectedDialCode}
          onChange={handleCountryChange}
          disabled={disabled}
          aria-label="Country Code"
          className="bg-transparent text-xs sm:text-sm font-medium text-foreground cursor-pointer focus:outline-none appearance-none pr-3"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right center" }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.code}-${c.dialCode}`} value={c.dialCode} className="bg-background text-foreground">
              {c.flag} {c.code} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      <input
        id={id}
        name={name}
        type="tel"
        autoComplete="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        className="flex-1 h-12 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
      />
    </div>
  );
}

