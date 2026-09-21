import Nav from "@/components/aura/Nav";
import Values from "@/components/aura/Values";
import Footer from "@/components/aura/Footer";

const ValuesPage = () => (
  <main className="min-h-screen bg-background">
    <Nav />
    <h1 className="sr-only">Kuśala Values — What we stand for</h1>
    <Values />
    <Footer />
  </main>
);

export default ValuesPage;
