import { ShieldCheck, Sparkles, Leaf, TrendingUp, Users } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    name: "Trust",
    body: "The bedrock of our platform. Rigorous vetting for every healer and centre, transparent reviews, and secure transactions.",
  },
  {
    icon: Sparkles,
    name: "Empowerment",
    body: "Knowledge and choice in your hands. The tools and information to make informed decisions about your own wellness.",
  },
  {
    icon: Leaf,
    name: "Wellness",
    body: "A holistic view of health — practices that integrate mental, emotional, spiritual and physical well-being.",
  },
  {
    icon: TrendingUp,
    name: "Growth",
    body: "Continuous evolution. We support your healing journey and give partner healers the tools to grow their practice.",
  },
  {
    icon: Users,
    name: "Community",
    body: "A shared path. A supportive environment for users, healers and centres to connect, share and learn together.",
  },
];

const Values = () => (
  <section id="values" className="bg-secondary/40 py-24 lg:py-32 border-y border-border">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">What we stand for</span>
        <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance">
          Five values, <em className="italic text-primary font-display">one sanctuary.</em>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {values.map((v) => (
          <article
            key={v.name}
            className="group relative bg-card rounded-[1.5rem] p-8 lg:p-10 flex flex-col gap-5 border border-border hover-lift overflow-hidden cursor-default"
          >
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/10 group-hover:to-primary/10 transition-all duration-500" />
            <div className="relative size-12 rounded-full bg-accent-soft text-accent grid place-items-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              <v.icon className="size-5" />
            </div>
            <h3 className="relative font-display text-2xl text-foreground">{v.name}</h3>
            <p className="relative text-sm text-muted-foreground leading-relaxed text-pretty max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-500 ease-out overflow-hidden">
              {v.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Values;
