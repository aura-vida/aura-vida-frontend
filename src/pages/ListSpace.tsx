import { useState } from "react";
import { z } from "zod";
import { submitSpace } from "@/lib/spacesApi";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  contact_name: z.string().trim().min(1, "Please add your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(20).optional(),
  space_name: z.string().trim().min(1, "Please name your space").max(150),
  space_type: z.string().trim().max(100).optional(),
  address: z.string().trim().min(1, "Please add the address").max(400),
  city: z.string().trim().min(1, "Please add the city").max(100),
  pin: z.string().trim().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  capacity: z.coerce.number().int().min(1, "At least 1 person").max(500),
  amenities: z.string().trim().max(1000).optional(),
  availability: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const empty = { contact_name: "", email: "", phone: "", space_name: "", space_type: "", address: "", city: "", pin: "", capacity: "4", amenities: "", availability: "", notes: "" };

const ListSpace = () => {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(""); setBusy(true);
    const d = parsed.data;
    try {
      await submitSpace({
        contact_name: d.contact_name,
        space_name: d.space_name,
        address: d.address,
        city: d.city,
        pin: d.pin,
        capacity: d.capacity,
        email: d.email.toLowerCase(),
        phone: d.phone || null,
        space_type: d.space_type || null,
        amenities: d.amenities ? d.amenities.split(",").map((s) => s.trim()).filter(Boolean) : null,
        availability: d.availability || null,
        notes: d.notes || null,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">For spaces</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 text-foreground">List your space</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Have a calm studio, room or retreat? Share a few details and our team will be in touch to make it a Kuśala partner space.
        </p>

        {done ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8">
            <p className="font-display text-2xl text-foreground">Thank you — we've received your space.</p>
            <p className="mt-2 text-muted-foreground">We'll review the details and contact you within a few days.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8 grid sm:grid-cols-2 gap-5">
            <div><Label>Your name *</Label><Input value={form.contact_name} onChange={set("contact_name")} maxLength={100} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} maxLength={255} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} maxLength={20} placeholder="+91" /></div>
            <div><Label>Type of space</Label><Input value={form.space_type} onChange={set("space_type")} maxLength={100} placeholder="Yoga studio, therapy room…" /></div>
            <div className="sm:col-span-2"><Label>Name of the space *</Label><Input value={form.space_name} onChange={set("space_name")} maxLength={150} /></div>
            <div className="sm:col-span-2"><Label>Address *</Label><Input value={form.address} onChange={set("address")} maxLength={400} /></div>
            <div><Label>City *</Label><Input value={form.city} onChange={set("city")} maxLength={100} /></div>
            <div><Label>PIN code *</Label><Input value={form.pin} maxLength={6} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))} /></div>
            <div><Label>How many people can it hold? *</Label><Input type="number" min={1} max={500} value={form.capacity} onChange={set("capacity")} /></div>
            <div><Label>Availability</Label><Input value={form.availability} onChange={set("availability")} maxLength={500} placeholder="Weekday evenings, weekends…" /></div>
            <div className="sm:col-span-2"><Label>Amenities</Label><Textarea value={form.amenities} onChange={set("amenities")} maxLength={1000} placeholder="Mats, sound system, parking, washroom…" /></div>
            <div className="sm:col-span-2"><Label>Anything else?</Label><Textarea value={form.notes} onChange={set("notes")} maxLength={2000} /></div>
            {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="rounded-full h-12 px-8">{busy ? "Sending…" : "Submit my space"}</Button>
            </div>
          </form>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default ListSpace;
