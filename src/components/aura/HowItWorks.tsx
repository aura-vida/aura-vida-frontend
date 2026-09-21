import { Compass, CalendarHeart, Sparkles } from "lucide-react";
import centerImg from "@/assets/center-interior.jpg";

const steps = [
  { icon: Compass, title: "Discover", text: "Browse vetted practitioners by modality, intention, and approach. Read honest reviews from real clients." },
  { icon: CalendarHeart, title: "Book", text: "Choose your time and place — at home, online, or at one of our partner sanctuaries near you." },
  { icon: Sparkles, title: "Heal", text: "Show up. Let go. Aftercare notes, follow-ups, and your full session history live in one calm place." },
];

const HowItWorks = () => (
  <section id="how" className="bg-secondary/60 py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
      <div className="lg:col-span-5 relative">
        <div className="rounded-[2rem] overflow-hidden shadow-elegant border border-border">
          <img
            src={centerImg}
            alt="A bright partner healing center with arched windows and warm light"
            loading="lazy"
            width={1280}
            height={960}
            className="w-full h-[520px] object-cover animate-ken-burns"
          />
        </div>
        <div className="absolute -bottom-6 -right-6 lg:right-auto lg:-left-6 bg-card rounded-2xl p-5 shadow-elegant border border-border max-w-[260px] animate-float-slow">
          <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium mb-1">Partner Centers</div>
          <div className="font-display text-xl text-foreground">Beautiful sanctuaries near you</div>
          <div className="text-xs text-muted-foreground mt-2">If you'd rather not host — we'll find the right space.</div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">How Kuśala Works</span>
        <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance">
          Three calm steps from <em className="italic text-primary">curious</em> to <em className="italic text-primary">cared for.</em>
        </h2>
        <div className="mt-12 flex flex-col gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-6 items-start group">
              <div className="shrink-0 size-14 rounded-2xl bg-card border border-border grid place-items-center shadow-soft group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                <s.icon className="size-6" />
              </div>
              <div className="flex-1 border-b border-border pb-8 last:border-none">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-sm text-muted-foreground tabular-nums">0{i + 1}</span>
                  <h3 className="font-display text-2xl text-foreground">{s.title}</h3>
                </div>
                <p className="text-muted-foreground mt-2 max-w-prose">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
