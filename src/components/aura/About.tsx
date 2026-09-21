const About = () => (
  <section id="about" className="bg-background py-24 lg:py-32">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">About Kuśala</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-4 text-balance">
            Wellness, <em className="italic text-primary font-display">simplified.</em>
          </h2>
        </div>
        <div className="space-y-6 text-muted-foreground text-base md:text-lg leading-relaxed">
          <p>
            Kuśala is India's trusted home for alternative healing. We bring together certified practitioners, wellness centres and self-guided digital programmes in one calm, integrated space.
          </p>
          <p>
            Whether you want a Reiki session at home, a sound-healing class at a centre near you, or a virtual consultation from anywhere in the country, Kuśala makes it easy to find the right healer and book with confidence.
          </p>
          <p>
            Every practitioner on the platform is carefully vetted. Every review is verified. And every session is designed to support your mental, emotional, spiritual and physical well-being.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default About;
