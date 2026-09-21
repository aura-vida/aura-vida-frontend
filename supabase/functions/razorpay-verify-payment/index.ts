import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(JSON.stringify({ error: "Payments are not configured yet." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = String(body.razorpay_order_id ?? "");
    const paymentId = String(body.razorpay_payment_id ?? "");
    const signature = String(body.razorpay_signature ?? "");
    if (!orderId || !paymentId || !signature) {
      return new Response(JSON.stringify({ error: "Missing payment details." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${orderId}|${paymentId}`));
    const expected = toHex(mac);
    const valid = expected.length === signature.length &&
      expected.split("").every((c, i) => c === signature[i]);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (valid) {
      const { data: order } = await supabase
        .from("orders")
        .select("status, details")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      // Deduct referral credit once, when the order first becomes paid.
      const creditApplied = Number(order?.details?.credit_applied_inr ?? 0);
      const userId = typeof order?.details?.user_id === "string" ? order.details.user_id : null;
      if (order?.status !== "paid" && creditApplied > 0 && userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credit_inr")
          .eq("id", userId)
          .maybeSingle();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ credit_inr: Math.max(0, Number(profile.credit_inr ?? 0) - creditApplied) })
            .eq("id", userId);
        }
      }
    }

    await supabase
      .from("orders")
      .update({
        razorpay_payment_id: paymentId,
        status: valid ? "paid" : "failed",
        paid_at: valid ? new Date().toISOString() : null,
      })
      .eq("razorpay_order_id", orderId);

    if (!valid) {
      return new Response(JSON.stringify({ error: "Payment could not be verified." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Unexpected error verifying payment." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
