import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Practitioners from "@/components/aura/Practitioners";
import ForHealers from "@/components/aura/ForHealers";
import Testimonials from "@/components/aura/Testimonials";
import Footer from "@/components/aura/Footer";

const Guides = () => {
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
      <h1 className="sr-only">Kuśala Guides — Vetted alternative healing practitioners</h1>
      <Practitioners />
      <ForHealers />
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Guides;
