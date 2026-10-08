// ============= Full file contents =============

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import logo from "@/assets/kusala-logo.png";

const Hero = () => {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/book?q=${encodeURIComponent(q)}` : "/book");
  };

  return (
    <section className="relative overflow-hidden">
      <div className="relative max-w-[1500px] mx-auto px-6 lg:px-12 pt-20 lg:pt-32 text-center flex flex-col items-center">
        <span className="inline-flex items-center gap-3 text-lg lg:text-2xl tracking-[0.12em] uppercase text-foreground/70 font-medium mb-12 lg:mb-16">
          <span className="size-2.5 rounded-full bg-accent/80 animate-pulse-glow" />
          A sanctuary for alternative healing
        </span>

        <h2 className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[1.05] tracking-tight text-foreground text-balance animate-fade-in">
          Find the right guide.
          <span className="block mt-2 lg:mt-4">Book in minutes.</span>
        </h2>


        <div className="mt-12 lg:mt-14 w-full flex flex-col items-center gap-5 animate-fade-in" style={{ animationDelay: "240ms" }}>
          <form onSubmit={submitSearch} className="w-full max-w-xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="What would you like help with? e.g. alcohol addiction, anxiety, sleep"
                aria-label="Search practitioners by concern"
                className="w-full rounded-full h-14 pl-12 pr-5 text-base bg-card border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 transition-smooth"
              />
            </div>
          </form>
          <Button
            size="lg"
            type="button"
            onClick={submitSearch}
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-glow px-10 h-16 text-base gap-2 transition-smooth hover:-translate-y-0.5 group"
          >
            Find your practitioner
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-accent/80" />
            Every practitioner personally vetted
          </p>
        </div>
      </div>

      {/* Full-bleed brand banner */}
      <img
        src={logo}
        alt="Kuśala — wellness simplified"
        className="block w-full h-auto mt-16 lg:mt-24 animate-fade-in"
        style={{ animationDelay: "320ms" }}
      />
    </section>
  );
};

export default Hero;
