import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Search, ArrowUpRight, FileText, Loader2, Settings, UserCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import { listPublishedBlogs, type Blog } from "@/lib/blogsApi";
import { getMyAppointments } from "@/lib/usersApi";
import { getWhatsappLink } from "@/lib/whatsapp";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, profile } = useAuth();
  const isPractitioner = (profile?.role || "").toLowerCase() === "practitioner";
  const isClient = (profile?.role || "").toLowerCase() === "client";
  const myPractitionerSlug = profile?.practitioner_slug || "";

  // A logged-out visitor needs an account before booking — send them to sign
  // up first instead of letting them fill out the whole booking form and
  // only discovering that requirement at the final "Pay" step.
  const bookLink = (slug: string) => {
    const bookingPath = `/book?practitioner=${slug}`;
    return user ? bookingPath : `/auth?view=signup&redirect=${encodeURIComponent(bookingPath)}`;
  };

  const [people, setPeople] = useState<Practitioner[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [publishedBlogs, setPublishedBlogs] = useState<Blog[]>([]);
  // Set when arriving from a Modalities card/list click (?craft=) rather than
  // typed into the search box — triggers a strict craft match instead of the
  // fuzzy word search below, so e.g. "Holistic Life Coaching" doesn't match
  // every bio that happens to contain the word "life".
  const [craftFilter] = useState(
    () => new URLSearchParams(window.location.search).get("craft")
  );
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? craftFilter ?? ""
  );
  const [showAll, setShowAll] = useState(false);

  // WhatsApp numbers aren't part of the public practitioner payload — they're
  // only shared with a client once they have a confirmed/completed booking
  // with that specific practitioner (see getUserAppointments on the backend).
  const [whatsappBySlug, setWhatsappBySlug] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || !isClient) {
      setWhatsappBySlug({});
      return;
    }
    getMyAppointments({ limit: 100 })
      .then((res) => {
        const map: Record<string, string> = {};
        for (const b of res.appointments) {
          if (b.practitioner_slug && b.practitioner_whatsapp_number) {
            map[b.practitioner_slug] = b.practitioner_whatsapp_number;
          }
        }
        setWhatsappBySlug(map);
      })
      .catch((err) => console.error("Failed to load appointments for WhatsApp access:", err));
  }, [user, isClient]);

  // Initial load: fetch practitioners from the server
  useEffect(() => {
    setIsLoadingInitial(true);
    const fetchLimit = isPractitioner ? 100 : 3;
    listPractitioners({ limit: fetchLimit, page: 1 })
      .then((data) => {
        setPeople(data.practitioners);
        setTotalCount(data.pagination?.total ?? data.practitioners.length);
      })
      .catch((err) => console.error("Failed to load initial practitioners:", err))
      .finally(() => setIsLoadingInitial(false));

    listPublishedBlogs({ limit: 100 })
      .then((res) => setPublishedBlogs(res.data ?? []))
      .catch((err) => console.error("Failed to load published blogs:", err));
  }, [isPractitioner]);

  // When searching, fetch full catalog from the server if not already loaded so search covers all practitioners
  useEffect(() => {
    if (!isPractitioner && query.trim() !== "" && people.length < totalCount) {
      listPractitioners({ limit: 100, page: 1 })
        .then((data) => {
          setPeople(data.practitioners);
          setTotalCount(data.pagination?.total ?? data.practitioners.length);
        })
        .catch((err) => console.error("Failed to load full practitioners for search:", err));
    }
  }, [query, people.length, totalCount, isPractitioner]);

  const handleToggleShowAll = async () => {
    if (!showAll) {
      // If we haven't loaded all practitioners yet from server, fetch them now
      if (people.length < totalCount) {
        setIsLoadingMore(true);
        try {
          const data = await listPractitioners({ limit: 100, page: 1 });
          setPeople(data.practitioners);
          setTotalCount(data.pagination?.total ?? data.practitioners.length);
          setShowAll(true);
        } catch (err) {
          console.error("Failed to load all practitioners from server:", err);
        } finally {
          setIsLoadingMore(false);
        }
      } else {
        setShowAll(true);
      }
    } else {
      setShowAll(false);
    }
  };

  const visible = useMemo(() => {
    // If logged in as a practitioner, only show their own profile
    if (isPractitioner) {
      if (!myPractitionerSlug) return [];
      return people.filter((p) => p.slug === myPractitionerSlug);
    }

    const q = query.trim().toLowerCase();
    if (!q) return people;

    // Still showing exactly what the clicked modality pre-filled — match the
    // craft field directly instead of scoring loose word overlap. As soon as
    // the visitor edits the box, it no longer equals craftFilter and falls
    // through to the fuzzy symptom search below.
    if (craftFilter && query === craftFilter) {
      // Normalizes away spelling variance that isn't a real difference in
      // meaning — "Astrology & Tarot" vs "Astrology and Tarot", "Theta
      // Healing" vs "ThetaHealing" — so the curated modality list still
      // matches real craft text without falling back to the loose
      // word-overlap search above.
      const normalize = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
      const squash = (s: string) => s.replace(/\s+/g, "");
      const target = normalize(craftFilter);
      const targetSquashed = squash(target);
      return people.filter((p) => {
        const craft = normalize(p.craft ?? "");
        if (craft === target || craft.includes(target) || target.includes(craft)) return true;
        const craftSquashed = squash(craft);
        return craftSquashed === targetSquashed || craftSquashed.includes(targetSquashed) || targetSquashed.includes(craftSquashed);
      });
    }

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
  }, [people, query, isPractitioner, myPractitionerSlug, craftFilter]);

  const displayedPeople = useMemo(() => {
    if (isPractitioner) {
      return visible;
    }
    if (showAll || query.trim() !== "") {
      return visible;
    }
    return visible.slice(0, 3);
  }, [visible, showAll, query, isPractitioner]);

  return (
  <section id="practitioners" className="bg-background py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">
            {isPractitioner ? "Your Practitioner Listing" : "The Guides"}
          </span>
          <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance max-w-3xl">
            {isPractitioner ? (
              <>Your public profile on <em className="italic text-primary">Kuśala</em>.</>
            ) : (
              <>Practitioners we'd <em className="italic text-primary">trust</em> with our own healing.</>
            )}
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          {isPractitioner
            ? "This is how seekers discover your wisdom, bio, craft, and published articles."
            : "Every guide is interviewed, certified, and reviewed. Admission to Kuśala is selective and based on a careful vetting process."}
        </p>
      </div>

      {!isPractitioner && (
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
      )}

      {isLoadingInitial ? (
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-[2rem] overflow-hidden border border-border p-7 animate-pulse">
              <div className="w-full aspect-[4/5] bg-secondary/70 rounded-2xl mb-6" />
              <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-4 bg-secondary rounded w-1/2 mb-6" />
              <div className="h-10 bg-secondary rounded-full mt-4" />
            </div>
          ))}
        </div>
      ) : query.trim() !== "" && visible.length === 0 ? (
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
            {displayedPeople.map((p) => (
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
                      {/* Star rating hidden for early stage; uncomment when public ratings / app reviews go live:
                      <div className="flex items-center gap-1 text-sm shrink-0">
                        <Star className="size-4 fill-accent text-accent" />
                        <span className="font-medium text-foreground">{p.rating ?? 0}</span>
                      </div>
                      */}
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
                    {(() => {
                      const waLink = getWhatsappLink(whatsappBySlug[p.slug]);
                      if (!waLink) return null;
                      return (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/5 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-600/10 transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                          Talk on WhatsApp &middot; {whatsappBySlug[p.slug]}
                        </a>
                      );
                    })()}
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
                      {isPractitioner ? (
                        <Button asChild variant="outline" className="rounded-full h-11 px-5 text-xs font-medium gap-1.5 border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground">
                          <Link to="/practitioner">
                            <Settings className="size-3.5" />
                            Manage Profile
                          </Link>
                        </Button>
                      ) : p.bookable ? (
                        <Button asChild className="rounded-full h-11 px-6 text-sm">
                          <Link to={bookLink(p.slug)}>Book</Link>
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
                        {/* Star rating hidden for early stage; uncomment when public ratings / app reviews go live:
                        <div className="flex items-center gap-1 text-sm shrink-0 bg-secondary px-2.5 py-1 rounded-full border border-border/40">
                          <Star className="size-4 fill-accent text-accent" />
                          <span className="font-medium text-foreground">{p.rating ?? 0}</span>
                          <span className="text-xs text-muted-foreground">({p.sessions ?? 0})</span>
                        </div>
                        */}
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
                    <section className="mt-6 border-t border-border/60 pt-6">
                      <div className="rounded-2xl bg-secondary/30 p-5 sm:p-6">
                        <div className="mb-4">
                          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
                            Get to know your guide
                          </span>
                        </div>

                        <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
                          {p.bio
                            .split(/\n\s*\n+/)
                            .map((block) => block.trim())
                            .filter(Boolean)
                            .map((block, i) => {
                              const lines = block
                                .split("\n")
                                .map((line) => line.trim())
                                .filter(Boolean);

                              const isBullet = (line: string) =>
                                line.startsWith("- ") || line.startsWith("• ");

                              if (lines.length > 1 && lines.every(isBullet)) {
                                return (
                                  <ul key={i} className="space-y-2">
                                    {lines.map((line, j) => (
                                      <li key={j} className="flex gap-3">
                                        <span className="mt-3 size-1.5 shrink-0 rounded-full bg-accent" />
                                        <span>{line.slice(2)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }

                              const joined = lines.join(" ");

                              if (lines.length === 1 && isBullet(lines[0])) {
                                return (
                                  <p key={i} className="flex gap-3">
                                    <span className="mt-3 size-1.5 shrink-0 rounded-full bg-accent" />
                                    <span>{lines[0].slice(2)}</span>
                                  </p>
                                );
                              }

                              if (
                                lines.length === 1 &&
                                joined.length < 50 &&
                                !/[.,]$/.test(joined)
                              ) {
                                return (
                                  <h4
                                    key={i}
                                    className="pt-2 font-display text-lg text-foreground"
                                  >
                                    {joined}
                                  </h4>
                                );
                              }

                              return <p key={i}>{joined}</p>;
                            })}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Articles & Wisdom written by practitioner */}
                  {(() => {
                    const practitionerBlogs = publishedBlogs.filter(
                      (b) =>
                        (b.practitioner_slug && b.practitioner_slug === p.slug) ||
                        (b.author?.practitioner_slug && b.author.practitioner_slug === p.slug) ||
                        (b.author?.full_name && p.name && b.author.full_name.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
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

                  {isPractitioner ? (
                    <div className="pt-4 border-t border-border/60 flex justify-end">
                      <Button asChild className="rounded-full h-12 px-8 text-sm w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                        <Link to="/practitioner">Edit Profile in Portal</Link>
                      </Button>
                    </div>
                  ) : p.bookable ? (
                    <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                      {(() => {
                        const waLink = getWhatsappLink(whatsappBySlug[p.slug]);
                        if (!waLink) return <span />;
                        return (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/5 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-600/10 transition-colors"
                          >
                            <MessageCircle className="size-3.5" />
                            Talk on WhatsApp
                          </a>
                        );
                      })()}
                      <Button asChild className="rounded-full h-12 px-8 text-sm w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                        <Link to={bookLink(p.slug)}>Book a session</Link>
                      </Button>
                    </div>
                  ) : null}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </>
      )}

      {!isPractitioner && (totalCount > 3 || people.length > 3) && query.trim() === "" && (
        <div className="mt-12 text-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleToggleShowAll}
            disabled={isLoadingMore}
            className="rounded-full h-14 px-10 border-foreground/30 text-foreground bg-card/60 hover:bg-secondary hover:text-foreground text-base transition-all duration-200 shadow-soft cursor-pointer gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="size-4 animate-spin text-accent" />
                <span>Loading practitioners...</span>
              </>
            ) : showAll ? (
              "Show fewer guides"
            ) : (
              `See all practitioners (${totalCount || people.length})`
            )}
          </Button>
        </div>
      )}
    </div>
  </section>
  );
};


export default Practitioners;
