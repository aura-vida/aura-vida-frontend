import { useMemo, useState } from "react";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import Practitioners from "@/components/aura/Practitioners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Building2, Video, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Location = "host" | "centre" | "online";

const CENTRES = [
  { name: "Anahata Studio", area: "Bandra West, Mumbai", pin: 400050 },
  { name: "Prana Healing House", area: "Indiranagar, Bengaluru", pin: 560038 },
  { name: "Sattva Sanctuary", area: "Hauz Khas, New Delhi", pin: 110016 },
  { name: "Tarang Centre", area: "Adyar, Chennai", pin: 600020 },
  { name: "Bodhi Loft", area: "Koregaon Park, Pune", pin: 411001 },
  { name: "Antara Healing Rooms", area: "Salt Lake, Kolkata", pin: 700091 },
  { name: "Surya Studio", area: "Banjara Hills, Hyderabad", pin: 500034 },
  { name: "Veda Sanctuary", area: "Vastrapur, Ahmedabad", pin: 380015 },
];

const Book = () => {
  const [location, setLocation] = useState<Location>("centre");
  const [pin, setPin] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState("");

  const nearest = useMemo(() => {
    const n = parseInt(pin, 10);
    if (!n || pin.length !== 6) return [];
    return [...CENTRES]
      .map((c) => ({ ...c, distance: Math.abs(c.pin - n) }))
      .sort((a, b) => a.distance - b.distance);
  }, [pin]);

  const options: { id: Location; icon: typeof Home; title: string; body: string }[] = [
    { id: "host", icon: Home, title: "I'll host at home", body: "A vetted practitioner travels to your space." },
    { id: "centre", icon: Building2, title: "A partner space near me", body: "Book a session at a vetted partner space." },
    { id: "online", icon: Video, title: "Online session", body: "Join from anywhere via private video." },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Book a session</span>
        <h1 className="font-display text-4xl md:text-6xl mt-4 text-balance max-w-3xl">
          Where would you like your <em className="italic text-primary">session</em> to happen?
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Choose between hosting at home, visiting a partner space near you, or joining online.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {options.map((o) => {
            const active = location === o.id;
            return (
              <button
                key={o.id}
                onClick={() => { setLocation(o.id); setSearched(false); }}
                className={cn(
                  "text-left rounded-[1.5rem] border p-6 transition-all hover-lift",
                  active
                    ? "border-primary bg-accent-soft shadow-elegant"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <o.icon className={cn("size-6 mb-4", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-display text-xl text-foreground">{o.title}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{o.body}</p>
              </button>
            );
          })}
        </div>

        {location === "centre" && (
          <div className="mt-12 rounded-[1.5rem] border border-border bg-card p-6 lg:p-8">
            <Label htmlFor="pin" className="text-sm font-medium">Enter your PIN code to find the nearest partner spaces</Label>
            <div className="flex gap-2 mt-3 max-w-md">
              <Input
                id="pin"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 560038"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setSearched(false); }}
                className="rounded-full h-12"
              />
              <Button
                onClick={() => setSearched(true)}
                disabled={pin.length !== 6}
                className="rounded-full h-12 px-6 bg-foreground text-background hover:bg-foreground/90"
              >
                <Search className="size-4 mr-1" /> Find
              </Button>
            </div>

                        {searched && nearest.length > 0 && (
              <ul className="grid sm:grid-cols-2 gap-3 mt-6">
                {nearest.map((c, i) => {
                  const isSelected = selectedCentre === c.name;
                  if (selectedCentre && !isSelected) return null;
                  return (
                    <li
                      key={c.name}
                      onClick={() => setSelectedCentre(isSelected ? "" : c.name)}
                      className={cn(
                        "relative flex items-start justify-between gap-3 rounded-2xl border p-4 cursor-pointer transition-all hover:border-accent/50",
                        isSelected ? "bg-accent/5 border-accent ring-1 ring-accent" : "bg-background border-border",
                        (!selectedCentre && i === 0) && "bg-accent-soft border-primary/40"
                      )}
                    >
                      <div className="flex items-start gap-3 pr-12">
                        <MapPin className="size-4 text-accent mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.area} · {c.pin} · Seats up to {c.capacity} people</div>
                        </div>
                      </div>
                      {(!selectedCentre && i === 0) && (
                        <span className="text-[10px] uppercase tracking-widest text-accent font-medium shrink-0">Closest</span>
                      )}
                      {isSelected && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setSelectedCentre(""); }} 
                          className="absolute top-2 right-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Change
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {location === "host" && (
          <div className="mt-12 rounded-[1.5rem] border border-border bg-card p-6 lg:p-8">
            <p className="text-muted-foreground">
              Your practitioner will travel to your home. We'll confirm address details after you choose a guide and time.
            </p>
          </div>
        )}

        {location === "online" && (
          <div className="mt-12 rounded-[1.5rem] border border-border bg-card p-6 lg:p-8">
            <p className="text-muted-foreground">
              You'll receive a private, secure video link 15 minutes before your session begins.
            </p>
          </div>
        )}

        <div className="mt-10">
          <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-base">
            Continue to choose a guide
          </Button>
        </div>
      </section>
      <Practitioners />
      <Footer />
    </main>
  );
};

export default Book;
