import { useEffect, useState } from "react";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import BookingDialog from "@/components/aura/BookingDialog";
import p1 from "@/assets/practitioner-1.jpg";
import p2 from "@/assets/practitioner-2.jpg";
import p3 from "@/assets/practitioner-3.jpg";
import p4 from "@/assets/practitioner-4.jpg";

type Row = {
  slug: string;
  name: string;
  craft: string;
  city: string;
  rating: number;
  price_inr: number;
  image_url: string | null;
  bookable: boolean;
};

const fallbackImages: Record<string, string> = {
  "session-lila-moreau": p1,
  "session-mateo-aren": p2,
  "session-anouk-vidal": p3,
  "session-priya-shah": p4,
};

const Practitioners = () => {
  const [people, setPeople] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from("practitioners")
      .select("slug,name,craft,city,rating,price_inr,image_url,bookable")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setPeople((data ?? []) as Row[]));
  }, []);

  return (
  <section id="practitioners" className="bg-background py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
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

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {people.map((p) => (
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
