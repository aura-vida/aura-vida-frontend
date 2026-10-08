import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Search, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import { listPublishedBlogs, type Blog } from "@/lib/blogsApi";
import p1 from "@/assets/practitioner-1.jpg";
import p2 from "@/assets/practitioner-2.jpg";
import p3 from "@/assets/practitioner-3.jpg";
import p4 from "@/assets/practitioner-4.jpg";


const fallbackImages: Record<string, string> = {
  "session-lila-moreau": p1,
  "session-mateo-aren": p2,
  "session-anouk-vidal": p3,
  "session-priya-shah": p4,
};

// Maps everyday concerns to the words practitioners' profiles use,
// so "alcohol addiction" still finds someone tagged "addiction recovery".
const SYNONYMS: Record<string, string[]> = {
  addiction: ["addiction", "alcohol", "drinking", "sobriety", "recovery", "de-addiction", "substance", "smoking", "quit", "habit"],
  alcohol: ["alcohol", "addiction", "drinking", "sobriety", "recovery"],
  smoking: ["smoking", "addiction", "quit", "tobacco"],
  anxiety: ["anxiety", "anxious", "stress", "panic", "worry", "fear", "calm", "nervous system"],
  stress: ["stress", "burnout", "overwhelm", "pressure", "calm", "relaxation", "anxiety"],
  depression: ["depression", "low mood", "mood", "sadness", "hopeless", "grief"],
  grief: ["grief", "loss", "bereavement", "mourning", "heartbreak"],
  trauma: ["trauma", "ptsd", "abuse", "shock", "somatic"],
  sleep: ["sleep", "insomnia", "rest", "nightmares", "relaxation"],
  insomnia: ["insomnia", "sleep", "rest"],
  pain: ["pain", "chronic pain", "back pain", "joint pain", "migraine", "headache"],
  fatigue: ["fatigue", "tired", "exhaustion", "energy", "burnout"],
  digestion: ["digestion", "gut", "stomach", "bloating", "ayurveda"],
  relationship: ["relationship", "relationships", "couple", "marriage", "family", "heartbreak", "breakup"],
  confidence: ["confidence", "self-esteem", "self worth", "esteem", "empowerment"],
  anger: ["anger", "temper", "irritability", "calm"],
  focus: ["focus", "concentration", "clarity", "mental fog", "adhd"],
  energy: ["energy", "vitality", "fatigue", "exhaustion", "chakra"],
  spiritual: ["spiritual", "purpose", "meaning", "awakening", "growth", "meditation"],
  detox: ["detox", "cleanse", "panchakarma", "ayurveda"],
};

const expandWord = (word: string): string[] => {
  const tokens = [word];
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    if (key.includes(word) || word.includes(key)) tokens.push(key, ...vals);
  }
  return tokens;
};

const SUGGESTIONS = ["Anxiety & stress", "Alcohol addiction", "Better sleep", "Grief & loss", "Chronic pain"];

const Practitioners = () => {
  const [people, setPeople] = useState<Practitioner[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<Blog[]>([]);
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? ""
  );

  useEffect(() => {
    listPractitioners({ limit: 100 })
      .then((data) => setPeople(data.practitioners))
      .catch((err) => console.error("Failed to load practitioners:", err));

    listPublishedBlogs({ limit: 100 })
      .then((res) => setPublishedBlogs(res.data ?? []))
      .catch((err) => console.error("Failed to load published blogs:", err));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    const words = q.split(/\s+/).filter(Boolean);
    return people
      .map((p) => {
        const hay = [p.name, p.craft, p.city, p.bio ?? "", ...(p.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        let score = 0;
        for (const w of words) {
          if (expandWord(w).some((t) => hay.includes(t))) score += 1;
        }
        return { p, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.p);
  }, [people, query]);

  return (
  <section id="practitioners" className="bg-background py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">The Guides</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance max-w-3xl">
            Practitioners we'd <em className="italic text-primary">trust</em> with our own healing.
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          Every guide is interviewed, certified, and reviewed. Admission to Kuśala is selective and based on a careful vetting process.
        </p>
      </div>

      <div className="max-w-2xl mb-10">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like help with? e.g. alcohol addiction, anxiety, sleep"
            className="rounded-full h-14 pl-12 pr-5 text-base bg-card border-border"
            aria-label="Search practitioners by concern"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s === query ? "" : s)}
              className={`rounded-full border px-4 h-9 text-sm transition-smooth ${
                query === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {query.trim() !== "" && visible.length === 0 ? (
        <div className="rounded-[2rem] border border-border bg-card p-12 text-center">
          <p className="font-display text-2xl text-foreground">No practitioners match that yet.</p>
          <p className="text-muted-foreground mt-2">
            Try a different word, or write to us and we'll connect you with the right guide.
          </p>
        </div>
      ) : (
        <>
          {query.trim() !== "" && (
            <p className="text-sm text-muted-foreground mb-6">
              {visible.length} {visible.length === 1 ? "practitioner" : "practitioners"} matching "{query.trim()}"
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {visible.map((p) => (
              <Dialog key={p.slug}>
                <article className="group bg-card rounded-[2rem] overflow-hidden border border-border shadow-soft hover:shadow-elegant transition-smooth">
                  <DialogTrigger asChild>
                    <button type="button" aria-label={`View ${p.name}'s profile`} className="block w-full aspect-[4/5] overflow-hidden bg-secondary cursor-pointer">
                      <img
                        src={p.image_url ?? fallbackImages[p.slug]}
                        alt={`Portrait of ${p.name}`}
                        loading="lazy"
                        width={768}
                        height={960}
                        className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      />
                    </button>
                  </DialogTrigger>
                  <div className="p-7">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <DialogTrigger asChild>
                          <button type="button" className="text-left">
                            <h3 className="font-display text-2xl text-foreground hover:underline underline-offset-4">{p.name}</h3>
                          </button>
                        </DialogTrigger>
                        <div className="text-sm text-muted-foreground mt-1">{p.craft}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm shrink-0">
                        <Star className="size-4 fill-accent text-accent" />
                        <span className="font-medium text-foreground">{p.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-accent" />
                        <span>{p.city}</span>
                      </div>
                      {p.bio && (
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors group/vp"
                          >
                            <span className="underline underline-offset-4 decoration-accent/40 group-hover/vp:decoration-accent">
                              View profile
                            </span>
                            <ArrowUpRight className="size-3.5 text-accent transition-transform group-hover/vp:translate-x-0.5 group-hover/vp:-translate-y-0.5" />
                          </button>
                        </DialogTrigger>
                      )}
                    </div>
                    {query.trim() !== "" && (p.keywords ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {(p.keywords ?? []).slice(0, 4).map((k) => (
                          <span key={k} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{k}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">From</div>
                        <div className="font-display text-2xl text-foreground">₹{p.price_inr.toLocaleString("en-IN")}<span className="text-sm text-muted-foreground"> /session</span></div>
                      </div>
                      {p.bookable ? (
                        <Button asChild className="rounded-full h-11 px-6 text-sm">
                          <Link to={`/book?practitioner=${p.slug}`}>Book</Link>
                        </Button>
                      ) : (
                        <span className="rounded-full bg-primary text-primary-foreground h-11 px-6 inline-flex items-center justify-center text-sm font-medium opacity-80 cursor-not-allowed select-none">
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                </article>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 sm:p-8 bg-card border-border">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <img
                      src={p.image_url ?? fallbackImages[p.slug]}
                      alt={`Portrait of ${p.name}`}
                      className="w-full sm:w-48 aspect-[4/5] object-cover rounded-2xl border border-border/60 shadow-soft shrink-0"
                    />
                    <DialogHeader className="text-left space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <DialogTitle className="font-display text-3xl text-foreground">{p.name}</DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground mt-0.5">{p.craft}</DialogDescription>
                        </div>
                        <div className="flex items-center gap-1 text-sm shrink-0 bg-secondary px-2.5 py-1 rounded-full border border-border/40">
                          <Star className="size-4 fill-accent text-accent" />
                          <span className="font-medium text-foreground">{p.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                        <MapPin className="size-4 text-accent" /> {p.city}
                      </div>
                      <div className="pt-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Session Fee</div>
                        <div className="font-display text-2xl text-foreground">
                          ₹{p.price_inr.toLocaleString("en-IN")}
                          <span className="text-sm font-normal text-muted-foreground"> /session</span>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>
                  {p.bio && (
                    <div className="space-y-4 text-foreground/85 leading-relaxed pt-4 border-t border-border/60">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium">About the guide</div>
                      {p.bio.split(/\n+/).filter((l) => l.trim()).map((para, i) => {
                        const t = para.trim();
                        if (t.startsWith("- ") || t.startsWith("• ")) {
                          return <p key={i} className="pl-4 text-muted-foreground">• {t.slice(2)}</p>;
                        }
                        if (t.length < 50 && !t.endsWith(".")) {
                          return <h4 key={i} className="font-display text-lg text-foreground pt-2">{t}</h4>;
                        }
                        return <p key={i}>{t}</p>;
                      })}
                    </div>
                  )}

                  {/* Articles & Wisdom written by practitioner */}
                  {(() => {
                    const practitionerBlogs = publishedBlogs.filter(
                      (b) =>
                        b.practitioner_slug === p.slug ||
                        b.author?.practitioner_slug === p.slug ||
                        (p.id && b.author_id === p.id) ||
                        ((p as any).user_id && b.author_id === (p as any).user_id)
                    );
                    if (practitionerBlogs.length === 0) return null;

                    return (
                      <div className="pt-5 border-t border-border/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium">
                            Articles &amp; Wisdom ({practitionerBlogs.length})
                          </div>
                        </div>
                        <div className="grid gap-2.5">
                          {practitionerBlogs.map((b) => (
                            <Link
                              key={b.id}
                              to={`/journal/${b.slug}`}
                              className="group/article flex items-center justify-between gap-4 p-3 rounded-2xl bg-secondary/40 hover:bg-secondary border border-border/50 hover:border-accent/40 transition-all duration-300"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {b.featured_image ? (
                                  <img
                                    src={b.featured_image}
                                    alt=""
                                    className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border/40"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border/40 text-accent">
                                    <FileText className="size-5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-medium text-sm text-foreground group-hover/article:text-accent transition-colors truncate">
                                    {b.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    {b.category && <span className="text-accent">{b.category}</span>}
                                    {b.category && <span>•</span>}
                                    <span>
                                      {Math.max(1, Math.round((b.content?.split(/\s+/).length || 200) / 200))} min read
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 text-muted-foreground group-hover/article:text-accent transition-colors pr-1">
                                <ArrowUpRight className="size-4 group-hover/article:translate-x-0.5 group-hover/article:-translate-y-0.5 transition-transform" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {p.bookable && (
                    <div className="pt-4 border-t border-border/60 flex justify-end">
                      <Button asChild className="rounded-full h-12 px-8 text-sm w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                        <Link to={`/book?practitioner=${p.slug}`}>Book a session</Link>
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 text-center">
        <Button variant="outline" size="lg" className="rounded-full h-14 px-10 border-foreground text-foreground hover:bg-foreground hover:text-background text-base">
          See all practitioners
        </Button>
      </div>
    </div>
  </section>
  );
};


export default Practitioners;
