import { useEffect, useMemo, useState } from "react";
import { Star, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BookingDialog from "@/components/aura/BookingDialog";
import { listPractitioners, type Practitioner } from "@/lib/practitionersApi";
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
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? ""
  );

  useEffect(() => {
    listPractitioners({ limit: 100 })
      .then((data) => setPeople(data.practitioners))
      .catch((err) => console.error("Failed to load practitioners:", err));
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
              <article key={p.slug} className="group bg-card rounded-[2rem] overflow-hidden border border-border shadow-soft hover:shadow-elegant transition-smooth">
                <div className="aspect-[4/5] overflow-hidden bg-secondary">
                  <img
                    src={p.image_url ?? fallbackImages[p.slug]}

                    alt={`Portrait of ${p.name}`}
                    loading="lazy"
                    width={768}
                    height={960}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl text-foreground">{p.name}</h3>
                      <div className="text-sm text-muted-foreground mt-1">{p.craft}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm shrink-0">
                      <Star className="size-4 fill-accent text-accent" />
                      <span className="font-medium text-foreground">{p.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                    <MapPin className="size-3.5" /> {p.city}
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
                      <BookingDialog
                        practitionerName={p.name}
                        itemId={p.slug}
                        price={`₹${p.price_inr}`}
                        trigger={
                          <Button className="rounded-full h-11 px-6 text-sm">Book</Button>
                        }
                      />
                    ) : (
                      <span className="rounded-full bg-primary text-primary-foreground h-11 px-6 inline-flex items-center justify-center text-sm font-medium opacity-80 cursor-not-allowed select-none">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 text-center">
        <Button variant="outline" size="lg" className="rounded-full h-14 px-10 border-foreground text-foreground hover:bg-foreground hover:text-background text-base">
          See all 413 practitioners
        </Button>
      </div>
    </div>
  </section>
  );
};


export default Practitioners;
