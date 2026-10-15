import sessionReiki from "@/assets/session-reiki.jpg";
import sessionSound from "@/assets/session-sound.jpg";
import sessionAcu from "@/assets/session-acupuncture.jpg";
import { ArrowUpRight } from "lucide-react";
import { useServices } from "@/hooks/useServices";

const fallbackFeatured = [
  { name: "Reiki & Energy Healing", count: 118, img: sessionReiki, desc: "Gentle hands-on work to restore your nervous system and energetic flow." },
  { name: "Sound Healing", count: 74, img: sessionSound, desc: "Tibetan and crystal bowls tuned to bring deep coherence to body and mind." },
  { name: "Meditation & Breathwork", count: 96, img: sessionAcu, desc: "Guided practices to settle the mind and reconnect with the breath." },
];

const fallbackAll = [
  "Meditation", "Yoga", "Reiki & Energy Healing", "Holistic Life Coaching",
  "Breathwork", "Sound Healing", "Theta Healing", "Astrology", "Tarot",
  "Craniosacral Therapy",
];

const Modalities = () => {
  const { services, loading } = useServices();
  
  const activeServices = services.filter(s => s.is_active !== false);
  
  // Create dynamic featured services (top 3)
  const featured = activeServices.length >= 3 
    ? activeServices.slice(0, 3).map((s, i) => ({
        name: s.name,
        count: Math.floor(Math.random() * 50) + 10, // Mock practitioner count for now
        img: s.image_url || fallbackFeatured[i % 3].img,
        desc: s.description || fallbackFeatured[i % 3].desc
      }))
    : fallbackFeatured;

  // Create full list
  const all = activeServices.length > 0 
    ? activeServices.map(s => s.name)
    : fallbackAll;

  return (
    <section id="modalities" className="bg-background py-24 lg:py-32">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Our Services</span>
            <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance max-w-3xl">
              Paths to healing, <em className="italic text-primary font-display">honoured.</em>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-md text-pretty">
            From ancient lineages to modern somatic science — explore the practices that resonate with what you need today.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {featured.map((m, i) => (
            <article
              key={m.name}
              className="group relative rounded-[2rem] overflow-hidden bg-card border border-border shadow-soft hover:shadow-elegant transition-smooth cursor-pointer"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={m.img}
                  alt={`${m.name} session`}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-background">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-background/70 mb-2">{m.count} guides</div>
                    <h3 className="font-display text-2xl lg:text-3xl text-background">{m.name}</h3>
                  </div>
                  <div className="size-11 rounded-full bg-background/15 backdrop-blur-md border border-background/30 grid place-items-center group-hover:bg-accent group-hover:border-accent transition-smooth shrink-0">
                    <ArrowUpRight className="size-5" />
                  </div>
                </div>
                <p className="text-sm text-background/80 mt-3 max-w-[34ch] opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-24 transition-all duration-500 line-clamp-2">
                  {m.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Full list */}
        <div className="border-t border-border pt-12">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-8">All modalities</div>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-8 gap-y-2">
            {all.map((s, i) => (
              <li key={s} className="group flex items-baseline gap-5 py-5 border-b border-border/60 cursor-pointer">
                {/* <span className="font-display text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span> */}
                <span className="font-display text-2xl md:text-3xl text-foreground group-hover:text-accent transition-colors flex-1">{s}</span>
                <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Modalities;
