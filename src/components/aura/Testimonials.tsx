const quotes = [
  { q: "I'd been searching for a real reiki practitioner for years. Kuśala found me Lila in an evening — she changed how I sleep.", a: "Sofia R.", role: "Client, Lisbon" },
  { q: "The booking flow is so calm. No pressure, no clutter — it feels like the practice itself.", a: "Joana M.", role: "Client, Porto" },
  { q: "Within three months I was fully booked. Kuśala treats us like artists, not gig workers.", a: "Mateo A.", role: "Sound Healer, Barcelona" },
];

const Testimonials = () => (
  <section className="bg-secondary/60 py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="text-center mb-16">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Voices</span>
        <h2 className="font-display text-4xl md:text-5xl mt-4 max-w-3xl mx-auto text-balance">
          Quiet words from people who came home to themselves.
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {quotes.map((t, i) => (
          <figure key={i} className="bg-card rounded-[2rem] p-8 lg:p-10 border border-border shadow-soft flex flex-col gap-8">
            <span className="font-display text-6xl text-accent leading-none">&ldquo;</span>
            <blockquote className="font-display text-xl leading-snug text-foreground text-pretty">
              {t.q}
            </blockquote>
            <figcaption className="mt-auto pt-6 border-t border-border">
              <div className="font-medium text-foreground">{t.a}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
