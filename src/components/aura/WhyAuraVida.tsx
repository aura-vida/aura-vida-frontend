import { CalendarCheck, Award, Sparkles, Video } from "lucide-react";

const reasons = [
  {
    icon: CalendarCheck,
    title: "Convenience you can count on",
    body: "Booking a healing and wellness session has never been easier.",
  },
  {
    icon: Award,
    title: "India's best practitioners",
    body: "Vetted by us, chosen by you.",
  },
  {
    icon: Sparkles,
    title: "Designed around you",
    body: "Enhance your booking with add-ons or combine different treatment types.",
  },
  {
    icon: Video,
    title: "In person or virtual",
    body: "Host at home, visit a partner centre near you, or join live online — your choice.",
  },
];

const WhyAuraVida = () => (
  <section id="why" className="py-24 lg:py-32 bg-background">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Why Kuśala</span>
        <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance">
          A wellness journey, <em className="italic text-primary font-display">made simple.</em>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reasons.map((r) => (
          <article
            key={r.title}
            className="group relative bg-card rounded-[2rem] p-10 lg:p-12 flex flex-col gap-6 border border-border hover-lift overflow-hidden"
          >
            <div aria-hidden className="absolute -top-16 -right-16 size-40 rounded-full bg-accent/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="size-14 rounded-full bg-accent-soft text-accent grid place-items-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <r.icon className="size-6" />
            </div>
            <h3 className="font-display text-2xl lg:text-3xl text-foreground leading-tight text-balance">
              {r.title}
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed text-pretty">
              {r.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default WhyAuraVida;
