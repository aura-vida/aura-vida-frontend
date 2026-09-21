import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { CATALOG, MAX_GROUP_SIZE, amountForGroup } from "../_shared/catalog.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Payments are not configured yet." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    const item = CATALOG[itemId];
    if (!item) {
      return new Response(JSON.stringify({ error: "Unknown item." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requested = Number(body.groupSize ?? 1);
    if (item.type === "booking" && requested > MAX_GROUP_SIZE) {
      return new Response(
        JSON.stringify({
          error: `For groups larger than ${MAX_GROUP_SIZE} please email sahil.dhanani@kusala.in for a personalised quote.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const groupSize = item.type === "booking"
      ? Math.min(Math.max(Math.floor(requested) || 1, 1), MAX_GROUP_SIZE)
      : 1;
    let amount = amountForGroup(item, groupSize);
    const itemName = groupSize > 1 ? `${item.name} (group of ${groupSize})` : item.name;

    const customer = {
      name: String(body.customerName ?? "").slice(0, 120),
      email: String(body.customerEmail ?? "").slice(0, 200),
      phone: String(body.customerPhone ?? "").slice(0, 30),
    };
    const details = typeof body.details === "object" && body.details !== null ? body.details : {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Apply referral credit for signed-in users on bookings (never below ₹100 payable).
    let creditAppliedInr = 0;
    let userId: string | null = null;
    const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (jwt && item.type === "booking") {
      const { data: { user } } = await supabase.auth.getUser(jwt);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credit_inr")
          .eq("id", user.id)
          .maybeSingle();
        const credit = Number(profile?.credit_inr ?? 0);
        if (credit > 0) {
          creditAppliedInr = Math.min(credit, Math.max(0, Math.floor(amount / 100) - 100));
          amount -= creditAppliedInr * 100;
          userId = user.id;
        }
      }
    }

    const auth = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `kusala_${Date.now()}`,
        notes: { item_id: item.id, item_name: itemName, group_size: String(groupSize) },
      }),
    });

    const order = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error("Razorpay order error", order);
      return new Response(JSON.stringify({ error: order?.error?.description ?? "Could not start payment." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("orders").insert({
      razorpay_order_id: order.id,
      amount,
      currency: "INR",
      item_id: item.id,
      item_name: itemName,
      item_type: item.type,
      customer_name: customer.name || null,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      details: { ...details, group_size: groupSize, user_id: userId, credit_applied_inr: creditAppliedInr },
      status: "created",
    });

    return new Response(
      JSON.stringify({ orderId: order.id, amount, currency: "INR", keyId, itemName, groupSize, creditAppliedInr }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Unexpected error starting payment." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
