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

      {/* What does Kuśala mean? */}
      <div className="mt-20 lg:mt-28 pt-16 lg:pt-20 border-t border-border/80">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium block mb-3">
              Philosophy & Meaning
            </span>
            <h3 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.15]">
              What does <em className="italic text-primary font-display">Kuśala</em> mean?
            </h3>
            <p className="mt-4 text-base sm:text-lg text-primary/90 italic font-display">
              The name Kuśala has roots in Buddhist philosophy.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-6 text-muted-foreground text-base md:text-lg leading-relaxed">
            <p>
              In Buddhism, <strong className="font-medium text-foreground">kusala</strong> (Pali: कुशल) is a word used to describe what is wholesome, skilful and beneficial — actions, thoughts and intentions that cultivate well-being, wisdom and inner peace.
            </p>
            <p>
              It is the idea that the little things we do, the choices we make and the intentions we nurture can shape how we feel and how we experience the world.
            </p>
            <p>
              When we chose the name <strong className="font-medium text-foreground">Kuśala</strong>, we wanted to capture that very essence: making wellness more accessible, helping people discover practices that nourish them, and creating space for a more balanced, mindful way of living.
            </p>
            <p>
              From meditation and breathwork to sound healing and beyond, Kuśala is about finding what helps you feel more connected to yourself.
            </p>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border/70 text-foreground italic font-display text-lg sm:text-xl">
              "Because wellness doesn't have to be complicated. Sometimes, it starts with one small, intentional step."
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default About;
