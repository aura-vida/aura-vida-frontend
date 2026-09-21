import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Building2, Video, MapPin, Search, ArrowRight, User, Users, Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { startCheckout } from "@/lib/razorpay";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MAX_GROUP_SIZE, formatINR, groupTotal, parsePrice } from "@/lib/pricing";

type Location = "host" | "centre" | "online";

// Mock partner centres across India with PIN codes. `capacity` is how many
// people the room can seat for one session.
type Centre = { name: string; area: string; pin: number; capacity: number };

const FALLBACK_CENTRES: Centre[] = [
  { name: "Anahata Wellness Studio", area: "Bandra West, Mumbai", pin: 400050, capacity: 6 },
  { name: "Prana Healing House", area: "Indiranagar, Bengaluru", pin: 560038, capacity: 4 },
  { name: "Sattva Sanctuary", area: "Hauz Khas, New Delhi", pin: 110016, capacity: 6 },
  { name: "Tarang Centre", area: "Adyar, Chennai", pin: 600020, capacity: 2 },
  { name: "Bodhi Wellness Loft", area: "Koregaon Park, Pune", pin: 411001, capacity: 6 },
  { name: "Antara Healing Rooms", area: "Salt Lake, Kolkata", pin: 700091, capacity: 3 },
  { name: "Surya Studio", area: "Banjara Hills, Hyderabad", pin: 500034, capacity: 5 },
  { name: "Veda Sanctuary", area: "Vastrapur, Ahmedabad", pin: 380015, capacity: 4 },
];

const LARGE_GROUP_MAILTO =
  "mailto:sahil.dhanani@kusala.in?subject=Large%20group%20session%20enquiry%20%E2%80%94%20Ku%C5%9Bala";

interface Props {
  practitionerName?: string;
  trigger?: React.ReactNode;
  itemId?: string;
  price?: string;
}

const BookingDialog = ({ practitionerName, trigger, itemId = "session-priya-shah", price }: Props) => {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<Location>("centre");
  const [pin, setPin] = useState("");
  const [searched, setSearched] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [guests, setGuests] = useState<string[]>([""]);
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!open) return;
    if (profile?.full_name && !name) setName(profile.full_name);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [open, profile, user]);

  const groupSize = isGroup ? 1 + guests.length : 1;
  const base = parsePrice(price);
  const total = base ? groupTotal(base, groupSize) : 0;
  const credit = user ? Number(profile?.credit_inr ?? 0) : 0;
  const creditApplied = credit > 0 && total ? Math.min(credit, Math.max(0, total - 100)) : 0;
  const payable = total - creditApplied;
  const extraEach = base ? Math.round(base * 0.6) : 0;

  const addGuest = () => {
    if (guests.length >= MAX_GROUP_SIZE - 1) return;
    setGuests([...guests, ""]);
  };
  const removeGuest = (i: number) => {
    const next = guests.filter((_, idx) => idx !== i);
    setGuests(next.length ? next : [""]);
  };

  const handlePay = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Almost there", description: "Please add your name and email so we can confirm your session." });
      return;
    }
    const attendees = [name.trim(), ...(isGroup ? guests.map((g) => g.trim()) : [])].filter(Boolean);
    if (isGroup && attendees.length < groupSize) {
      toast({ title: "Missing names", description: "Please add the name of everyone joining the session." });
      return;
    }
    setPaying(true);
    await startCheckout({
      itemId,
      groupSize,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      details: {
        location,
        pin: location === "centre" ? pin : null,
        practitioner: practitionerName ?? null,
        attendees,
      },
      onSuccess: async () => {
        if (user) {
          await supabase.from("bookings").insert({
            client_id: user.id,
            client_name: name,
            practitioner_slug: itemId,
            practitioner_name: practitionerName ?? "Kuśala session",
            item_id: itemId,
            amount: payable ? payable * 100 : null,
            mode: location,
            pin: location === "centre" ? pin : null,
            status: "upcoming",
            group_size: groupSize,
            attendees,
          });
        }
        setPaying(false);
        setOpen(false);
        toast({ title: "Payment received", description: "Your session is confirmed — we'll email you the details shortly." });
      },
      onError: (message) => {
        setPaying(false);
        toast({ title: "Payment not completed", description: message, variant: "destructive" });
      },
      onDismiss: () => setPaying(false),
    });
  };

  const [centres, setCentres] = useState<Centre[]>(FALLBACK_CENTRES);

  useEffect(() => {
    supabase
      .from("centres")
      .select("name, area, pin, capacity")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length) {
          setCentres(
            data.map((c) => ({
              name: c.name,
              area: c.area,
              pin: parseInt(c.pin, 10) || 0,
              capacity: c.capacity,
            })),
          );
        }
      });
  }, []);

  const byDistance = useMemo(() => {
    const n = parseInt(pin, 10);
    if (!n || pin.length !== 6) return [];
    return [...centres]
      .map((c) => ({ ...c, distance: Math.abs(c.pin - n) }))
      .sort((a, b) => a.distance - b.distance);
  }, [pin, centres]);

  const nearest = useMemo(
    () => byDistance.filter((c) => c.capacity >= groupSize).slice(0, 3),
    [byDistance, groupSize],
  );
  const tooSmall = useMemo(
    () => byDistance.filter((c) => c.capacity < groupSize).slice(0, 2),
    [byDistance, groupSize],
  );

  const handleSearch = () => setSearched(true);

  const options: { id: Location; icon: typeof Home; title: string; body: string }[] = [
    { id: "host", icon: Home, title: "I'll host", body: "Practitioner comes to your home" },
    { id: "centre", icon: Building2, title: "Centre near me", body: "Book a partner space close by" },
    { id: "online", icon: Video, title: "Online", body: "Live video session from anywhere" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-12">
            Book
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[1.5rem] w-[calc(100vw-1.5rem)] max-h-[85dvh] overflow-y-auto overscroll-contain p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {practitionerName ? `Book with ${practitionerName}` : "Book a session"}
          </DialogTitle>
          <DialogDescription>Choose who's coming and where you'd like your session to happen.</DialogDescription>
        </DialogHeader>

        {/* Solo or group */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            { id: "solo", icon: User, title: "Just me", body: "A one-to-one session" },
            { id: "group", icon: Users, title: "Group session", body: `Up to ${MAX_GROUP_SIZE} people together` },
          ].map((o) => {
            const active = (o.id === "group") === isGroup;
            return (
              <button
                key={o.id}
                onClick={() => setIsGroup(o.id === "group")}
                className={cn(
                  "text-left rounded-2xl border p-4 transition-all",
                  active ? "border-primary bg-accent-soft shadow-soft" : "border-border hover:border-foreground/30 hover:bg-secondary/50",
                )}
              >
                <o.icon className={cn("size-5 mb-3", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-medium text-sm text-foreground">{o.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{o.body}</div>
              </button>
            );
          })}
        </div>

        {isGroup && (
          <div className="mt-4 rounded-2xl border border-border p-4 bg-secondary/40 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Who's joining you?</Label>
              <span className="text-xs text-muted-foreground">{groupSize} of {MAX_GROUP_SIZE} people</span>
            </div>
            {guests.map((g, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={g}
                  onChange={(e) => setGuests(guests.map((v, idx) => (idx === i ? e.target.value : v)))}
                  placeholder={`Guest ${i + 1} full name`}
                  className="rounded-full h-11"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeGuest(i)}
                  className="rounded-full h-11 w-11 p-0 shrink-0 border-foreground/20"
                  aria-label="Remove guest"
                >
                  <Minus className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={addGuest}
                disabled={guests.length >= MAX_GROUP_SIZE - 1}
                className="rounded-full"
              >
                <Plus className="size-4 mr-1" /> Add another person
              </Button>
              {base > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatINR(base)} for you · {formatINR(extraEach)} each extra person
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              More than {MAX_GROUP_SIZE} people?{" "}
              <a href={LARGE_GROUP_MAILTO} className="text-primary underline underline-offset-2">
                Email us
              </a>{" "}
              and we'll arrange a larger circle with personalised pricing.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {options.map((o) => {
            const active = location === o.id;
            return (
              <button
                key={o.id}
                onClick={() => { setLocation(o.id); setSearched(false); }}
                className={cn(
                  "text-left rounded-2xl border p-4 transition-all",
                  active
                    ? "border-primary bg-accent-soft shadow-soft"
                    : "border-border hover:border-foreground/30 hover:bg-secondary/50",
                )}
              >
                <o.icon className={cn("size-5 mb-3", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-medium text-sm text-foreground">{o.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{o.body}</div>
              </button>
            );
          })}
        </div>

        {location === "centre" && (
          <div className="mt-4 space-y-3">
            <Label htmlFor="pin" className="text-sm">Enter your PIN code</Label>
            <div className="flex gap-2">
              <Input
                id="pin"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 400050"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setSearched(false); }}
                className="rounded-full h-12"
              />
              <Button
                onClick={handleSearch}
                disabled={pin.length !== 6}
                className="rounded-full h-12 px-5 bg-foreground text-background hover:bg-foreground/90"
              >
                <Search className="size-4 mr-1" /> Find
              </Button>
            </div>

            {searched && isGroup && (
              <p className="text-xs text-muted-foreground">
                Showing centres that can seat all {groupSize} of you.
              </p>
            )}

            {searched && nearest.length > 0 && (
              <ul className="space-y-2 pt-2">
                {nearest.map((c, i) => (
                  <li
                    key={c.name}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border border-border p-4",
                      i === 0 && "bg-accent-soft border-primary/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="size-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.area} · {c.pin}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Seats up to {c.capacity} people</div>
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-[10px] uppercase tracking-widest text-accent font-medium">Closest</span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {searched && nearest.length === 0 && byDistance.length > 0 && (
              <div className="rounded-2xl border border-border p-4 bg-secondary/40 space-y-2">
                <p className="text-sm text-foreground">
                  No partner centre near you can seat {groupSize} people yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  You could host the group at your home, meet online, book a smaller group, or{" "}
                  <a href={LARGE_GROUP_MAILTO} className="text-primary underline underline-offset-2">
                    email us
                  </a>{" "}
                  and we'll find a larger space for you.
                </p>
              </div>
            )}

            {searched && tooSmall.length > 0 && nearest.length > 0 && (
              <ul className="space-y-2 opacity-60">
                {tooSmall.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.area} · seats {c.capacity}</div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Too small</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {location === "host" && (
          <div className="mt-4 rounded-2xl border border-border p-4 bg-secondary/40">
            <p className="text-sm text-muted-foreground">
              Your practitioner will travel to you. We'll confirm the address after booking.
            </p>
          </div>
        )}

        {location === "online" && (
          <div className="mt-4 rounded-2xl border border-border p-4 bg-secondary/40">
            <p className="text-sm text-muted-foreground">
              {isGroup
                ? "Everyone in your group receives a private video link 15 minutes before the session."
                : "You'll receive a private video link 15 minutes before your session."}
            </p>
          </div>
        )}

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bk-name" className="text-xs">Your name</Label>
            <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-full h-11" placeholder="Full name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-email" className="text-xs">Email</Label>
            <Input id="bk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-full h-11" placeholder="you@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-phone" className="text-xs">Phone</Label>
            <Input id="bk-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-full h-11" placeholder="+91" />
          </div>
        </div>

        <DialogFooter className="mt-5 flex-col sm:flex-row gap-2 sm:justify-between">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/book" onClick={() => setOpen(false)}>
              Open full booking <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
          <div className="flex flex-col items-end gap-1.5">
            {creditApplied > 0 && (
              <div className="text-xs text-muted-foreground">
                {formatINR(total)} − <span className="text-accent font-medium">{formatINR(creditApplied)} referral credit</span>
              </div>
            )}
            <Button
              onClick={handlePay}
              disabled={paying}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7"
            >
              {paying ? "Opening payment…" : payable ? `Pay ${formatINR(payable)} securely` : "Pay securely"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
