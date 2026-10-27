import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { isValidPhoneNumber } from "@/lib/whatsapp";

const benefits = [
  "Steady stream of clients matched to your craft",
  "Built-in scheduling, payments, and client notes",
  "Marketing kit, profile coaching, and SEO support",
  "Optional access to partner centers — no overhead",
  "Transparent commission. Keep ownership of your clients.",
];

const emptyForm = () => ({
  name: "",
  email: "",
  mobile_number: "",
  whatsapp_number: "",
  bio: "",
  craft: "",
  city: "",
  price_inr: "1500",
});

const ForHealers = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!isValidPhoneNumber(form.mobile_number)) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    if (!isValidPhoneNumber(form.whatsapp_number)) {
      toast.error("Please enter a valid WhatsApp number, including the country code");
      return;
    }
    if (!form.craft.trim()) {
      toast.error("Please enter your modality or title (e.g. Yoga Therapist)");
      return;
    }
    if (!form.city.trim()) {
      toast.error("Please enter your location or city (e.g. Mumbai)");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/practitioners/apply", {
        method: "POST",
        body: {
          ...form,
          price_inr: parseInt(form.price_inr) || 0,
        },
      });
      setSubmitted(true);
      setForm(emptyForm());
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="healers" className="relative overflow-hidden bg-foreground text-background py-24 lg:py-32">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="relative max-w-[1500px] mx-auto px-6 lg:px-12">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">For Practitioners</span>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl mt-4 text-balance leading-[1]">
            Spend your energy on <em className="italic text-accent">healing.</em><br />
            We'll handle the rest.
          </h2>
          <p className="text-background/70 text-lg mt-8 max-w-2xl text-pretty">
            Kuśala brings you ready-to-book clients, a beautiful profile, and the business tools to grow a sustainable practice — without losing the soul of your work.
          </p>

          <ul className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-background/90">
                <span className="shrink-0 size-6 rounded-full bg-accent/20 border border-accent/40 grid place-items-center mt-0.5">
                  <Check className="size-3.5 text-accent" />
                </span>
                <span className="text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-4">
            <Button
              size="lg"
              onClick={() => { setIsOpen(true); setSubmitted(false); }}
              className="rounded-full h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 text-base shadow-glow"
            >
              Apply to join
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-10 border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground text-base">
              Learn more
            </Button>
          </div>
        </div>
      </div>

      {/* ── Application Dialog ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="size-7 rounded-full bg-accent/10 grid place-items-center">
                <Sparkles className="size-4 text-accent" />
              </span>
              <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">For Practitioners</span>
            </div>
            <DialogTitle className="font-display text-2xl">Apply to join Kuśala</DialogTitle>
            <DialogDescription>
              Tell us about yourself. Our team reviews every application personally — you'll hear from us within 3 business days. Once approved, you'll receive an email with your login link.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center mx-auto">
                <Check className="size-8 text-emerald-600" />
              </div>
              <h3 className="font-display text-2xl text-foreground">Application received!</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                We'll review your application and send your login details to <strong>{form.email || "your email"}</strong> once approved.
              </p>
              <Button className="rounded-full mt-2" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="py-2 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="ap-name">Full name <span className="text-destructive">*</span></Label>
                  <Input id="ap-name" required value={form.name} onChange={set("name")} placeholder="e.g. Dr. Meera Shah" className="rounded-xl h-11" />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="ap-email">Email address <span className="text-destructive">*</span></Label>
                  <Input id="ap-email" type="email" required value={form.email} onChange={set("email")} placeholder="you@email.com" className="rounded-xl h-11" />
                  <p className="text-xs text-muted-foreground">Your login credentials will be sent here after approval.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ap-mobile">Mobile number <span className="text-destructive">*</span></Label>
                  <Input id="ap-mobile" type="tel" required value={form.mobile_number} onChange={set("mobile_number")} placeholder="e.g. +91 98765 43210" className="rounded-xl h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ap-whatsapp">WhatsApp number <span className="text-destructive">*</span></Label>
                  <Input id="ap-whatsapp" type="tel" required value={form.whatsapp_number} onChange={set("whatsapp_number")} placeholder="e.g. +91 98765 43210" className="rounded-xl h-11" />
                  <p className="text-xs text-muted-foreground">Include your country code — clients will use this to chat with you.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ap-craft">Modality / Title <span className="text-destructive">*</span></Label>
                  <Input id="ap-craft" required value={form.craft} onChange={set("craft")} placeholder="e.g. Yoga Therapist" className="rounded-xl h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ap-city">Location / City <span className="text-destructive">*</span></Label>
                  <Input id="ap-city" required value={form.city} onChange={set("city")} placeholder="e.g. Mumbai" className="rounded-xl h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ap-price">Price per session (₹)</Label>
                  <Input id="ap-price" type="number" min="0" value={form.price_inr} onChange={set("price_inr")} className="rounded-xl h-11" />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="ap-bio">About you</Label>
                  <Textarea
                    id="ap-bio"
                    value={form.bio}
                    onChange={set("bio")}
                    placeholder="Share your background, certifications, and what makes your practice unique..."
                    className="rounded-xl min-h-[110px]"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                  {submitting ? "Submitting…" : "Submit Application"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ForHealers;
