import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import logo from "@/assets/kusala-logo.png";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative max-w-[1500px] mx-auto px-6 lg:px-12 pt-16 lg:pt-28 text-center flex flex-col items-center">
        <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-10">
          <span className="size-1.5 rounded-full bg-accent animate-pulse-glow" />
          A sanctuary for alternative healing
        </span>
      </div>

      {/* Full-bleed brand banner */}
      <img
        src={logo}
        alt="Kuśala — wellness simplified"
        className="block w-full h-auto animate-fade-in"
      />

      <div className="relative max-w-[1500px] mx-auto px-6 lg:px-12 pb-20 lg:pb-32 text-center flex flex-col items-center">
        <p className="mt-6 text-lg lg:text-2xl leading-relaxed w-full text-muted-foreground text-pretty animate-fade-in" style={{ animationDelay: "120ms" }}>
          Trusted healers. Centres near you. Virtual sessions, anywhere.{" "}
          <br className="hidden md:block" />
          A holistic home for your wellness journey.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "240ms" }}>
          <Button
            size="lg"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-glow px-10 h-16 text-base gap-2 transition-smooth hover:-translate-y-0.5"
            asChild
          >
            <a href="#modalities">Explore services <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-foreground/20 bg-transparent hover:bg-card hover:border-foreground/40 px-10 h-16 text-base text-foreground transition-smooth hover:-translate-y-0.5"
            asChild
          >
            <a href="#digital">Browse digital library</a>
          </Button>
        </div>

      </div>
    </section>
  );
};

export default Hero;
