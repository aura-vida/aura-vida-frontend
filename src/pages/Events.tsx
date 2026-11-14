import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import EventsSection from "@/components/aura/EventsSection";
import { Sparkles, HeartHandshake, Compass } from "lucide-react";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      {/* Hero Header */}
      <section className="relative px-6 lg:px-12 pt-12 pb-6 max-w-[1500px] mx-auto">
        <div className="max-w-3xl">
          <span className="text-[11px] tracking-[0.25em] uppercase text-accent font-semibold flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" /> Gather in Presence
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground mt-4 tracking-tight leading-[1.15]">
            Events, Workshops &amp; Sacred Circles
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 font-light leading-relaxed">
            Step away from the noise of the city and step into intentional spaces. Guided by India's most heartfelt practitioners, our intimate gatherings offer experiential healing, deep breathwork, and shared wisdom.
          </p>
        </div>
      </section>

      {/* Main Events Section */}
      <EventsSection />

      {/* Philosophy Callout */}
      <section className="py-16 px-6 lg:px-12 max-w-[1200px] mx-auto border-t border-border">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-secondary/30 border border-border/60 space-y-2.5">
            <div className="size-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Compass className="size-5" />
            </div>
            <h3 className="font-display text-lg text-foreground">Intimate Circles</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every gathering is kept strictly limited in capacity so each participant receives personal space, individual guidance, and deep presence.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-secondary/30 border border-border/60 space-y-2.5">
            <div className="size-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-display text-lg text-foreground">Vetted Guides</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Led by seasoned alternative healing practitioners who honor the sanctity, tradition, and safe integration of somatic &amp; breath practices.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-secondary/30 border border-border/60 space-y-2.5">
            <div className="size-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <HeartHandshake className="size-5" />
            </div>
            <h3 className="font-display text-lg text-foreground">Complete Integration</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Leave with practical micro-habits, grounding routines, and ongoing support to integrate your experience into daily life.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
