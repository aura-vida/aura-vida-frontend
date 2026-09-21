import programmeImg from "@/assets/digital-programme.jpg";
import audioImg from "@/assets/digital-audio.jpg";
import ebookImg from "@/assets/digital-ebooks.jpg";
import { Button } from "@/components/ui/button";
import { BookOpen, Headphones, Layers } from "lucide-react";

const products = [
  {
    icon: Layers,
    tag: "Programmes",
    name: "Structured Healing Programmes",
    body: "Multi-week journeys built by certified guides — daily practices, reflection prompts and progress tracking.",
    img: programmeImg,
    itemId: "digital-programme",
    price: "₹2,499",
  },
  {
    icon: Headphones,
    tag: "Audio",
    name: "Guided Meditation Sessions",
    body: "A growing library of guided meditations from our healers — from morning grounding to deep evening rest.",
    img: audioImg,
    itemId: "digital-audio",
    price: "₹499",
  },
  {
    icon: BookOpen,
    tag: "E-books",
    name: "Educational E-books & Guides",
    body: "Carefully written guides on modalities, philosophies and self-practice — for the curious and the committed.",
    img: ebookImg,
    itemId: "digital-ebook",
    price: "₹799",
  },
];

const DigitalProducts = () => {
  return (
  <section id="digital" className="bg-background py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Digital Library</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4 text-balance max-w-3xl">
            Healing, <em className="italic text-primary font-display">on your own time.</em>
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md text-pretty">
          A curated library of premium content for your self-guided journey — programmes, audio sessions and e-books from trusted practitioners.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {products.map((p) => (
          <article key={p.name} className="group rounded-[2rem] overflow-hidden bg-card border border-border shadow-soft hover:shadow-elegant transition-smooth flex flex-col">
            <div className="aspect-[5/4] overflow-hidden">
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                width={1024}
                height={820}
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
            </div>
            <div className="p-7 lg:p-8 flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-accent-soft text-accent grid place-items-center">
                  <p.icon className="size-4" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{p.tag}</span>
              </div>
              <h3 className="font-display text-2xl lg:text-3xl text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.body}</p>
              <div className="flex items-center justify-between gap-3 mt-2 pt-4 border-t border-border">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">From</div>
                  <div className="font-display text-2xl text-foreground">{p.price}</div>
                </div>
                <span className="rounded-full bg-primary text-primary-foreground h-11 px-6 inline-flex items-center justify-center text-sm font-medium opacity-80 cursor-not-allowed select-none">
                  Coming soon
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-10 h-14 text-base"
        >
          Explore the full library
        </Button>
      </div>
    </div>
  </section>
  );
};

export default DigitalProducts;
