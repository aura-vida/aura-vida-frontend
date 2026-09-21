import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const benefits = [
  "Steady stream of clients matched to your craft",
  "Built-in scheduling, payments, and client notes",
  "Marketing kit, profile coaching, and SEO support",
  "Optional access to partner centers — no overhead",
  "Transparent commission. Keep ownership of your clients.",
];

const ForHealers = () => (
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
          <Button asChild size="lg" className="rounded-full h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 text-base shadow-glow">
            <a href="mailto:sahil.dhanani@kusala.in?subject=Practitioner%20Application%20—%20Ku%C5%9Bala">Apply to join</a>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full h-14 px-10 border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground text-base">
            Learn more
          </Button>
        </div>
      </div>

      

    </div>
  </section>
);

export default ForHealers;
