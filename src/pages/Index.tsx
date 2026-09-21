import Nav from "@/components/aura/Nav";
import Hero from "@/components/aura/Hero";
import About from "@/components/aura/About";
import Modalities from "@/components/aura/Modalities";
import DigitalProducts from "@/components/aura/DigitalProducts";
import WhyAuraVida from "@/components/aura/WhyAuraVida";
import HowItWorks from "@/components/aura/HowItWorks";
import ForHealers from "@/components/aura/ForHealers";
import Footer from "@/components/aura/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <h1 className="sr-only">Kuśala — Wellness simplified. Trusted alternative healing practitioners, centres and digital wellness library</h1>
      <Hero />
      <About />
      <HowItWorks />
      <Modalities />
      <WhyAuraVida />
      <DigitalProducts />
      <ForHealers />
      <Footer />
    </main>
  );
};

export default Index;
