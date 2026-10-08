import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/aura/NotificationBell";

const Nav = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const close = () => setOpen(false);

  return (
    <nav className="w-full px-6 lg:px-12 py-6 flex items-center justify-between max-w-[1500px] mx-auto relative">
      <Link to="/" className="font-display text-2xl md:text-3xl font-medium tracking-tight text-foreground" aria-label="Kuśala home">
        Kuśala
      </Link>
      <div className="hidden md:flex gap-8 text-[12px] tracking-widest uppercase text-muted-foreground font-medium">
        <a href="/#about" className="hover:text-foreground transition-colors">About</a>
        <Link to="/values" className="hover:text-foreground transition-colors">Values</Link>
        <a href="/#modalities" className="hover:text-foreground transition-colors">Services</a>
        <a href="/#digital" className="hover:text-foreground transition-colors">Library</a>
        <Link to="/guides" className="hover:text-foreground transition-colors">Guides</Link>
        <a href="/guides#healers" className="hover:text-foreground transition-colors">For Healers</a>
        <Link to="/list-your-space" className="hover:text-foreground transition-colors">List your space</Link>
      </div>
      <div className="flex items-center gap-2">
        {user && <NotificationBell />}
        <Link to="/guides" className="md:hidden">
          <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 text-xs tracking-widest uppercase">
            Book
          </Button>
        </Link>
        <Link to="/book" className="hidden md:inline-flex">
          <Button
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-7 h-12 tracking-widest uppercase text-xs"
          >
            Book a session
          </Button>
        </Link>
        <Link to={user ? "/account" : "/auth"} className="hidden md:inline-flex">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-foreground/25 text-foreground bg-card/60 hover:bg-secondary hover:text-foreground hover:border-foreground/40 px-6 h-12 transition-all duration-200"
          >
            {user ? "My sessions" : "Sign in"}
          </Button>
        </Link>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center size-10 rounded-full border border-border text-foreground"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mx-6 mt-2 rounded-2xl border border-border bg-card shadow-elegant p-4 flex flex-col gap-1 md:hidden z-50">
          <a onClick={close} href="/#about" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">About</a>
          <Link onClick={close} to="/values" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">Values</Link>
          <a onClick={close} href="/#modalities" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">Services</a>
          <a onClick={close} href="/#digital" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">Library</a>
          <Link onClick={close} to="/guides" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">Guides · Book</Link>
          <a onClick={close} href="/guides#healers" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">For Healers</a>
          <Link onClick={close} to="/list-your-space" className="px-3 py-3 rounded-lg text-sm uppercase tracking-widest text-foreground hover:bg-secondary">List your space</Link>
          <Link onClick={close} to={user ? "/account" : "/auth"}>
            <Button className="w-full mt-2 rounded-full bg-foreground text-background hover:bg-foreground/90 h-11">
              {user ? "My sessions" : "Sign in"}
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Nav;
