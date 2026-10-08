import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Hero from "@/components/aura/Hero";
import About from "@/components/aura/About";
import Modalities from "@/components/aura/Modalities";
import DigitalProducts from "@/components/aura/DigitalProducts";
import WhyAuraVida from "@/components/aura/WhyAuraVida";
import Waitlist from "@/components/aura/Waitlist";
import HowItWorks from "@/components/aura/HowItWorks";
import Footer from "@/components/aura/Footer";

const Index = () => {
  const { hash } = useLocation();
  useEffect(() => {
    const go = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [hash]);
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
      <Waitlist />
      <Footer />
    </main>
  );
};

export default Index;
