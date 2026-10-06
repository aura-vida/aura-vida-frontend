import { api } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export interface CheckoutOptions {
  bookingId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  onDismiss?: () => void;
}

export const startCheckout = async (opts: CheckoutOptions) => {
  const ok = await loadScript();
  if (!ok) return opts.onError?.("Could not load the payment window. Please check your connection.");

  let data;
  try {
    data = await api("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { booking_id: opts.bookingId }
    });
  } catch (e: any) {
    return opts.onError?.(e.message || "Could not start the payment. Please try again.");
  }

  if (!data?.orderId) {
    return opts.onError?.(data?.error ?? "Could not start the payment. Please try again.");
  }

  const rzp = new window.Razorpay!({
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    name: "Kuśala",
    description: data.itemName,
    order_id: data.orderId,
    prefill: {
      name: opts.customerName ?? "",
      email: opts.customerEmail ?? "",
      contact: opts.customerPhone ?? "",
    },
    theme: { color: "#2f8f7f" },
    modal: { ondismiss: () => opts.onDismiss?.() },
    handler: async (response: Record<string, string>) => {
      try {
        await api("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: response
        });
        opts.onSuccess?.();
      } catch (e) {
        return opts.onError?.("We couldn't confirm your payment. Please contact us.");
      }
    },
  });

  rzp.open();
};
