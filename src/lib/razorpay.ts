import { supabase } from "@/integrations/supabase/client";

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
  itemId: string;
  groupSize?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  details?: Record<string, unknown>;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  onDismiss?: () => void;
}

export const startCheckout = async (opts: CheckoutOptions) => {
  const ok = await loadScript();
  if (!ok) return opts.onError?.("Could not load the payment window. Please check your connection.");

  const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
    body: {
      itemId: opts.itemId,
      groupSize: opts.groupSize ?? 1,
      customerName: opts.customerName,
      customerEmail: opts.customerEmail,
      customerPhone: opts.customerPhone,
      details: opts.details ?? {},
    },
  });

  if (error || !data?.orderId) {
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
      const { data: v, error: vErr } = await supabase.functions.invoke("razorpay-verify-payment", {
        body: response,
      });
      if (vErr || !v?.verified) return opts.onError?.("We couldn't confirm your payment. Please contact us.");
      opts.onSuccess?.();
    },
  });

  rzp.open();
};
