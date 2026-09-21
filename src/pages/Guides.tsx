import Nav from "@/components/aura/Nav";
import Practitioners from "@/components/aura/Practitioners";
import Testimonials from "@/components/aura/Testimonials";
import Footer from "@/components/aura/Footer";

const Guides = () => (
  <main className="min-h-screen bg-background">
    <Nav />
    <h1 className="sr-only">Kuśala Guides — Vetted alternative healing practitioners</h1>
    <Practitioners />
    <Testimonials />
    <Footer />
  </main>
);

export default Guides;
