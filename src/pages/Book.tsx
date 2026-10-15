import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import Practitioners from "@/components/aura/Practitioners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Home,
  Video,
  MapPin,
  Search,
  Star,
  User,
  Users,
  Minus,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Tag,
  X,
  Building2,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { listPractitioners, getPractitionerServices, type Practitioner } from "@/lib/practitionersApi";
import type { Service } from "@/lib/servicesApi";
import { getAvailableSlots } from "@/lib/appointmentsApi";
import { startCheckout } from "@/lib/razorpay";
import { validateCoupon } from "@/lib/couponsApi";
import { MAX_GROUP_SIZE, formatINR, groupTotal, sessionTax, calculateSessionSubtotal } from "@/lib/pricing";
import { getPublicSpacesByPin, type PartnerSpace } from "@/lib/locationApi";
import AuraBookingCalendar from "@/components/aura/AuraBookingCalendar";

type Location = "studio" | "online" | "centre" | "host";




const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const locationOptions: { id: Location; icon: any; title: string; body: string }[] = [
  { id: "studio", icon: Building2, title: "At their studio", body: "Practitioner's own private studio." },
  { id: "online", icon: Video, title: "Online session", body: "Join from anywhere via private video." },
  { id: "centre", icon: MapPin, title: "A partner space near me", body: "Book a session at a vetted partner space." },
  { id: "host", icon: Home, title: "I'll host at home", body: "A vetted practitioner travels to your space." },
];

const Book = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const practitionerSlug = searchParams.get("practitioner") || "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  // If user is logged in as a practitioner, redirect them to their portal
  useEffect(() => {
    if ((profile?.role || "").toLowerCase() === "practitioner") {
      toast({
        title: "Practitioner Portal",
        description: "You are signed in as a practitioner. Redirecting to your practitioner portal.",
      });
      navigate("/practitioner", { replace: true });
    }
  }, [profile?.role, navigate, toast]);

  // A logged-out visitor landing here directly (e.g. a shared/bookmarked
  // link) needs an account before booking — send them to sign up rather than
  // letting them fill out the whole form and only discovering that at Pay.
  useEffect(() => {
    if (!authLoading && !user && practitionerSlug) {
      const bookingPath = `/book?practitioner=${practitionerSlug}`;
      navigate(`/auth?view=signup&redirect=${encodeURIComponent(bookingPath)}`, { replace: true });
    }
  }, [authLoading, user, practitionerSlug, navigate]);

  // Data fetching states
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [isGroup, setIsGroup] = useState(false);
  const [guests, setGuests] = useState<{ name: string, email: string }[]>([{ name: "", email: "" }]);
  const [location, setLocation] = useState<Location>("centre");
  const [pin, setPin] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState("");
  const [hostAddress, setHostAddress] = useState("");

  // Date and Time
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDate());
  const [selectedTime, setSelectedTime] = useState<string>("10:00");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // User contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Load practitioners
  useEffect(() => {
    listPractitioners({ limit: 10 })
      .then((data) => {
        setPractitioners(data.practitioners);
        if (practitionerSlug) {
          const match = data.practitioners.find((p) => p.slug === practitionerSlug);
          if (match) setSelectedPractitioner(match);
          else setSelectedPractitioner(null);
        } else {
          setSelectedPractitioner(null);
        }
      })
      .catch((err) => console.error("Failed to load practitioners:", err));
  }, [practitionerSlug]);

  // Load services this practitioner offers (resets selection on practitioner change)
  useEffect(() => {
    setSelectedServiceId("");
    if (!selectedPractitioner?.slug) {
      setServices([]);
      return;
    }
    getPractitionerServices(selectedPractitioner.slug)
      .then((res) => setServices(res.services || []))
      .catch((err) => {
        console.error("Failed to load practitioner services:", err);
        setServices([]);
      });
  }, [selectedPractitioner?.slug]);

  // Set default service
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      const firstActive = services.find((s) => s.is_active !== false) || services[0];
      if (firstActive) setSelectedServiceId(firstActive.id);
    }
  }, [services, selectedServiceId]);

  // Autofill user profile
  useEffect(() => {
    if (profile?.full_name && !name) setName(profile.full_name);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile, user]);

  // Fetch slots whenever practitioner, date, or service changes
  useEffect(() => {
    const slug = selectedPractitioner?.slug;
    if (!slug || !selectedDate) return;
    setLoadingSlots(true);
    getAvailableSlots(slug, selectedDate, selectedServiceId)
      .then((res) => {
        const active = (res.slots || [])
          .filter((s) => s.available !== false)
          .map((s) => s.start.slice(0, 5));
        setAvailableSlots(active);
        if (active.length > 0 && !active.includes(selectedTime)) {
          setSelectedTime(active[0]);
        } else if (active.length === 0) {
          setSelectedTime("");
        }
      })
      .catch(() => {
        setAvailableSlots([]);
        setSelectedTime("");
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedPractitioner?.slug, selectedDate, selectedServiceId]);

  useEffect(() => {
    if (!selectedPractitioner) return;
    const canStudio = selectedPractitioner.offers_studio === true;
    const canCentre = selectedPractitioner.offers_centre !== false;
    const canHost = selectedPractitioner.offers_host === true;
    const canOnline = selectedPractitioner.offers_online === true;

    const isCurrentValid =
      (location === 'studio' && canStudio) ||
      (location === 'centre' && canCentre) ||
      (location === 'host' && canHost) ||
      (location === 'online' && canOnline);

    if (!isCurrentValid) {
      if (canStudio) setLocation('studio');
      else if (canOnline) setLocation('online');
      else if (canCentre) setLocation('centre');
      else if (canHost) setLocation('host');
    }
  }, [
    selectedPractitioner?.slug,
    selectedPractitioner?.offers_studio,
    selectedPractitioner?.offers_centre,
    selectedPractitioner?.offers_host,
    selectedPractitioner?.offers_online
  ]);

  // Guest actions
  const groupSize = isGroup ? 1 + guests.length : 1;
  const addGuest = () => {
    if (guests.length >= MAX_GROUP_SIZE - 1) return;
    setGuests([...guests, { name: "", email: "" }]);
  };
  const removeGuest = (i: number) => {
    const next = guests.filter((_, idx) => idx !== i);
    setGuests(next.length ? next : [{ name: "", email: "" }]);
  };

  // Pricing calculations
  const selectedService = services.find((s) => s.id === selectedServiceId);
  // Authoritative dynamic subtotal matching the backend calculation in payment.controller.js
  const total = selectedPractitioner
    ? calculateSessionSubtotal(selectedPractitioner, location, groupSize)
    : (selectedService?.price_inr ? groupTotal(selectedService.price_inr, groupSize) : 0);
  const basePrice = selectedPractitioner
    ? calculateSessionSubtotal(selectedPractitioner, location, 1)
    : (selectedService?.price_inr ?? 0);

  // Helper to format pricing preview on location format cards based on Who is Joining
  const getFormatPriceLabel = (formatId: Location) => {
    if (!selectedPractitioner) return null;
    let priv = 0;
    let grp = 0;
    if (formatId === "studio") {
      priv = Number(selectedPractitioner.price_studio_private) || 0;
      grp = Number(selectedPractitioner.price_studio_group) || 0;
    } else if (formatId === "online") {
      priv = Number(selectedPractitioner.price_online_private) || 0;
      grp = Number(selectedPractitioner.price_online_group) || 0;
    } else if (formatId === "centre") {
      priv = Number(selectedPractitioner.price_centre_private) || 0;
      grp = Number(selectedPractitioner.price_centre_group) || 0;
    } else if (formatId === "host") {
      priv = Number(selectedPractitioner.price_host_private) || 0;
      grp = Number(selectedPractitioner.price_host_group) || 0;
    }

    const fallback = Number(selectedPractitioner.price_inr) || 0;

    // If "Just me" (Solo) is selected in Step 1
    if (!isGroup) {
      const price = priv || fallback;
      return price > 0 ? formatINR(price) : null;
    }

    // If "Group circle" is selected in Step 1
    if (grp > 0) {
      return `${formatINR(grp)} / person`;
    }
    const base = priv || fallback;
    if (base > 0) {
      return `${formatINR(groupTotal(base, groupSize))} (${groupSize} ${groupSize === 1 ? 'person' : 'people'})`;
    }
    return null;
  };

  // Coupon discount applies to the subtotal, before tax — mirrors the
  // backend's authoritative order in payment.controller.js.
  const couponDiscount = appliedCoupon && total ? Math.round(total * appliedCoupon.discountPercent / 100) : 0;
  const discountedTotal = total - couponDiscount;
  // 5% tax on the (post-coupon) session subtotal — mirrors the backend's
  // authoritative calculation in payment.controller.js so this is just an
  // accurate preview; the backend still computes and validates the real
  // charged amount (and independently re-validates the coupon).
  const tax = discountedTotal ? sessionTax(discountedTotal) : 0;
  const totalWithTax = discountedTotal + tax;
  const credit = user ? Number(profile?.credit_inr ?? 0) : 0;
  const creditApplied = credit > 0 && totalWithTax ? Math.min(credit, Math.max(0, totalWithTax - 100)) : 0;
  const payable = totalWithTax - creditApplied;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (!user) {
      setCouponError("Please sign in first to apply a coupon.");
      return;
    }
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await validateCoupon(code, total);
      setAppliedCoupon({ code: res.code, discountPercent: res.discountPercent });
      toast({ title: "Coupon applied!", description: `${res.code} — ${res.discountPercent}% off your session.` });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Invalid coupon code.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };
  const extraEach = basePrice ? Math.round(basePrice * 0.6) : 0;

  const [suggestedPlaces, setSuggestedPlaces] = useState<PartnerSpace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const handleSearch = async () => {
    if (pin.length !== 6) return;
    setSearched(true);
    setLoadingPlaces(true);
    try {
      const res = await getPublicSpacesByPin(pin);
      setSuggestedPlaces(res.spaces || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Search failed", description: "Could not fetch nearby spaces.", variant: "destructive" });
    } finally {
      setLoadingPlaces(false);
    }
  };

  // Format Date and Time Slot
  const duration = selectedService?.duration_min || 60;
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatSlot = (slot: string) => {
    if (!slot) return { start: "", end: "" };
    const parts = slot.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const endTotalMin = h * 60 + m + duration;
    const endH = Math.floor(endTotalMin / 60) % 24;
    const endM = endTotalMin % 60;
    const startAmpm = h >= 12 ? "PM" : "AM";
    const endAmpm = endH >= 12 ? "PM" : "AM";
    return {
      start: `${h % 12 || 12}:${String(m).padStart(2, "0")} ${startAmpm}`,
      end: `${endH % 12 || 12}:${String(endM).padStart(2, "0")} ${endAmpm}`,
    };
  };

  // Checkout Handler
  const currentAttendees = [
    { name: name.trim(), email: email.trim() },
    ...(isGroup ? guests.map((g) => ({ name: g.name.trim(), email: g.email.trim() })).filter(g => g.name || g.email) : [])
  ].filter(g => g.name && g.email);
  const isFormValid = Boolean(
    user &&
    selectedServiceId &&
    selectedDate &&
    selectedTime &&
    name.trim() &&
    email.trim() &&
    (!isGroup || currentAttendees.length >= groupSize) &&
    (
      (location === "centre" && selectedCentre) ||
      (location === "host" && hostAddress.trim()) ||
      location === "online" ||
      location === "studio"
    )
  );

  const handlePay = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to complete your booking.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (!selectedServiceId) {
      toast({ title: "Select a service", description: "Please pick a therapy or session." });
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast({ title: "Select date & time", description: "Please pick your preferred session date and time slot." });
      return;
    }
    if (location === "centre" && !selectedCentre) {
      toast({ title: "Select a centre", description: "Please choose a partner space from the list." });
      return;
    }
    if (location === "host" && !hostAddress.trim()) {
      toast({ title: "Address required", description: "Please provide your full address for the home session." });
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast({ title: "Almost there", description: "Please fill in your name and email." });
      return;
    }

    const attendees = [
      { name: name.trim(), email: email.trim() },
      ...(isGroup ? guests.map((g) => ({ name: g.name.trim(), email: g.email.trim() })).filter(g => g.name || g.email) : [])
    ].filter(g => g.name && g.email);

    if (isGroup && attendees.length < groupSize) {
      toast({ title: "Missing guest details", description: "Please ensure every guest has both a name and an email address so we can send the meeting link." });
      return;
    }

    setPaying(true);

    try {
      const meeting_location = location === "centre" && selectedCentre ? {
        address: selectedCentre,
        pincode: pin || "400001",
        place_id: "centre-" + selectedCentre.toLowerCase().replace(/\s+/g, "-"),
        lat: 19.0760,
        lng: 72.8777,
      } : location === "host" ? {
        address: hostAddress.trim(),
        type: "host"
      } : location === "studio" ? {
        name: selectedPractitioner?.studio_name || `${selectedPractitioner?.name || "Practitioner"}'s Studio`,
        address: selectedPractitioner?.studio_address || "",
        city: selectedPractitioner?.studio_city || "",
        maps_url: selectedPractitioner?.studio_maps_url || null,
        type: "studio"
      } : undefined;

      // Start Razorpay checkout. The booking itself is only created once
      // payment is verified, so an abandoned checkout never reserves a slot.
      await startCheckout({
        booking: {
          service_id: selectedServiceId,
          practitioner_slug: selectedPractitioner?.slug || "session-priya-shah",
          date: selectedDate,
          time: selectedTime,
          mode: location,
          pin: location === "centre" ? pin : null,
          group_size: groupSize,
          attendees,
          meeting_location,
          coupon_code: appliedCoupon?.code || null,
        },
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        onSuccess: () => {
          setPaying(false);
          toast({ title: "Booking confirmed!", description: "We have emailed you the session details." });
          navigate("/account");
        },
        onError: (msg) => {
          setPaying(false);
          toast({ title: "Payment failed", description: msg, variant: "destructive" });
        },
        onDismiss: () => setPaying(false),
      });
    } catch (error: any) {
      setPaying(false);
      toast({ title: "Booking failed", description: error.message || "Could not reserve slot", variant: "destructive" });
    }
  };

  // Whether the user has chosen a guide and is in the final checkout flow
  const isCheckingOut = Boolean(practitionerSlug && selectedPractitioner);

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* STATE A: Browse Guides First (When user clicked 'Book a session' without selecting a guide yet) */}
      {!isCheckingOut && (
        <Practitioners />
      )}

      {/* STATE B: Final Checkout Screen (When user clicked 'Book' on a specific guide) */}
      {isCheckingOut && (
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 py-12 lg:py-20">

          {/* Back button to browse all guides */}
          <div className="mb-8">
            <button
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" /> Back to choose another guide
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Checkout &amp; Reserve</span>
                <h1 className="font-display text-3xl md:text-5xl mt-2 text-foreground">
                  Book your session with <em className="italic text-primary">{selectedPractitioner?.name}</em>
                </h1>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid lg:grid-cols-12 gap-10 items-start">

            {/* LEFT COLUMN: The Step-by-Step Experience (7 Columns) */}
            <div className="lg:col-span-7 space-y-8">

              {/* STEP 1: Practitioner Summary */}
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-widest uppercase font-semibold text-accent">Your Chosen Guide</span>
                  <button onClick={() => setSearchParams({})} className="text-xs text-accent hover:underline">Change</button>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="size-16 rounded-2xl bg-secondary overflow-hidden shrink-0 border border-border">
                    {selectedPractitioner?.image_url ? (
                      <img src={selectedPractitioner.image_url} alt={selectedPractitioner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-muted-foreground font-medium">Guide</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground">{selectedPractitioner?.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedPractitioner?.craft} · {selectedPractitioner?.city}</p>
                    <div className="flex items-center gap-1 text-xs text-accent mt-1">
                      <Star className="size-3.5 fill-accent" /> {selectedPractitioner?.rating} ({selectedPractitioner?.sessions} sessions)
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 2: Service & Circle Size */}
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
                <span className="text-[11px] tracking-widest uppercase font-semibold text-accent">Step 1 · Service &amp; Circle</span>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Therapy / Session</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-border px-5 bg-background text-left">
                      <SelectValue placeholder="Choose a therapy..." />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl border-border max-h-72 p-2">
                      {services.filter((s) => s.is_active !== false).map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          className="relative py-3.5 pl-10 pr-4 cursor-pointer focus:bg-accent/5 focus:text-accent rounded-xl my-1"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm leading-tight text-foreground">
                              {s.name}
                            </span>

                            <span className="text-xs leading-tight text-muted-foreground">
                              Category: {s.category || "Holistic"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Solo or Group Circle */}
                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium">Who is joining?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "solo", icon: User, title: "Just me", body: "A private one-on-one session" },
                      { id: "group", icon: Users, title: "Group circle", body: `Up to ${MAX_GROUP_SIZE} people together` },
                    ].map((o) => {
                      const active = (o.id === "group") === isGroup;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setIsGroup(o.id === "group")}
                          className={cn(
                            "text-left rounded-2xl border p-5 transition-all",
                            active
                              ? "border-primary bg-accent-soft shadow-soft ring-1 ring-primary"
                              : "border-border bg-background hover:border-foreground/30 hover:bg-secondary/40"
                          )}
                        >
                          <o.icon className={cn("size-5 mb-2.5", active ? "text-primary" : "text-muted-foreground")} />
                          <div className="font-medium text-sm text-foreground">{o.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 leading-snug">{o.body}</div>
                        </button>
                      );
                    })}
                  </div>

                  {isGroup && (
                    <div className="mt-4 rounded-2xl border border-border p-5 bg-secondary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Guest Names ({groupSize} of {MAX_GROUP_SIZE})</Label>
                        <span className="text-xs text-muted-foreground">{formatINR(extraEach)} each extra person</span>
                      </div>
                      {guests.map((g, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={g.name}
                            onChange={(e) => setGuests(guests.map((v, idx) => (idx === i ? { ...v, name: e.target.value } : v)))}
                            placeholder={`Guest ${i + 1} full name`}
                            className="rounded-xl h-11 bg-background flex-1"
                          />
                          <Input
                            type="email"
                            value={g.email}
                            onChange={(e) => setGuests(guests.map((v, idx) => (idx === i ? { ...v, email: e.target.value } : v)))}
                            placeholder={`Email`}
                            className="rounded-xl h-11 bg-background flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeGuest(i)}
                            className="rounded-xl h-11 w-11 p-0 shrink-0"
                            aria-label="Remove guest"
                          >
                            <Minus className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={addGuest}
                        disabled={guests.length >= MAX_GROUP_SIZE - 1}
                        className="rounded-full text-xs"
                      >
                        <Plus className="size-3.5 mr-1" /> Add another person
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              {/* STEP 3: Location Mode & Partner Spaces */}
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
                <span className="text-[11px] tracking-widest uppercase font-semibold text-accent">Step 2 · Location &amp; Space</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locationOptions.filter(o => {
                    if (!selectedPractitioner) return true;
                    if (o.id === 'studio') return selectedPractitioner.offers_studio === true;
                    if (o.id === 'centre') return selectedPractitioner.offers_centre !== false;
                    if (o.id === 'host') return selectedPractitioner.offers_host === true;
                    if (o.id === 'online') return selectedPractitioner.offers_online === true;
                    return true;
                  }).map((o) => {
                    const active = location === o.id;
                    const priceLabel = getFormatPriceLabel(o.id);
                    const subtitle = o.id === "studio" && selectedPractitioner?.studio_city
                      ? `Practitioner's own studio · ${selectedPractitioner.studio_city}`
                      : o.body;

                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setLocation(o.id); setSearched(false); }}
                        className={cn(
                          "text-left rounded-2xl border p-4 transition-all flex flex-col justify-between",
                          active
                            ? "border-primary bg-accent-soft shadow-soft ring-1 ring-primary"
                            : "border-border bg-background hover:border-foreground/30 hover:bg-secondary/40"
                        )}
                      >
                        <div>
                          <o.icon className={cn("size-5 mb-2.5", active ? "text-primary" : "text-muted-foreground")} />
                          <div className="font-medium text-sm text-foreground">{o.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 leading-snug">{subtitle}</div>
                        </div>
                        {priceLabel && (
                          <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-medium text-primary">
                            {priceLabel}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {location === "studio" && (
                  <div className="rounded-2xl border border-border p-5 bg-secondary/30 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="size-4 text-accent" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="font-medium text-sm text-foreground">
                          {selectedPractitioner?.studio_name || `${selectedPractitioner?.name || "Practitioner"}'s Studio`}
                          {selectedPractitioner?.studio_city && ` · ${selectedPractitioner.studio_city}`}
                        </div>
                        {selectedPractitioner?.studio_address ? (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedPractitioner.studio_address}
                            {selectedPractitioner.studio_city && !selectedPractitioner.studio_address.toLowerCase().includes(selectedPractitioner.studio_city.toLowerCase()) ? `, ${selectedPractitioner.studio_city}` : ""}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Full studio address will be sent to your email upon booking confirmation.
                          </p>
                        )}
                        {selectedPractitioner?.studio_maps_url && (
                          <div className="pt-1.5">
                            <a
                              href={selectedPractitioner.studio_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                              Open in Maps <ExternalLink className="size-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {location === "centre" && (
                  <div className="space-y-4 pt-2">
                    <Label htmlFor="pin-co" className="text-xs font-medium">Enter your 6-digit PIN code to discover partner spaces near you</Label>
                    <div className="flex gap-2 max-w-sm">
                      <Input
                        id="pin-co"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="e.g. 400050"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setSearched(false); }}
                        className="rounded-full h-11 bg-background"
                      />
                      <Button
                        type="button"
                        onClick={handleSearch}
                        disabled={pin.length !== 6 || loadingPlaces}
                        className="rounded-full h-11 px-6 bg-foreground text-background hover:bg-foreground/90"
                      >
                        {loadingPlaces ? <Clock className="size-4 mr-1.5 animate-spin" /> : <Search className="size-4 mr-1.5" />} Find
                      </Button>
                    </div>

                    {searched && loadingPlaces && (
                      <p className="text-sm py-4 text-muted-foreground flex items-center gap-2">
                        <Clock className="size-4 animate-spin" /> Finding safe meeting spaces midway...
                      </p>
                    )}

                    {searched && !loadingPlaces && suggestedPlaces.length === 0 && (
                      <div className="rounded-2xl border border-border p-4 bg-secondary/40 space-y-2 mt-4">
                        <p className="text-sm text-foreground">
                          Could not find a place halfway matching this pincode.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Try a different location or choose Virtual from the options above.
                        </p>
                      </div>
                    )}

                    {searched && !loadingPlaces && suggestedPlaces.length > 0 && (
                      <ul className="space-y-2.5 pt-2 max-h-[340px] overflow-y-auto pr-2">
                        {suggestedPlaces.map((c, i) => {
                          const isSelected = selectedCentre === c.space_name;
                          if (selectedCentre && !isSelected) return null;
                          return (
                            <li
                              key={c.id}
                              onClick={() => setSelectedCentre(isSelected ? "" : c.space_name)}
                              className={cn(
                                "relative flex items-center justify-between gap-3 rounded-2xl border p-4 cursor-pointer transition-all hover:border-accent/50",
                                isSelected ? "bg-accent/5 border-accent ring-1 ring-accent" : "bg-background border-border",
                                (!selectedCentre && i === 0) && "bg-accent-soft border-primary/40"
                              )}
                            >
                              <div className="flex items-start gap-3 w-full pr-16">
                                {c.space_images && c.space_images.length > 0 ? (
                                  <img
                                    src={[...c.space_images].sort((a, b) => a.sort_order - b.sort_order)[0].image_url}
                                    alt=""
                                    className="size-11 rounded-xl object-cover border border-border shrink-0"
                                  />
                                ) : (
                                  <div className="size-11 rounded-xl border border-border bg-secondary/60 grid place-items-center shrink-0">
                                    <MapPin className="size-4 text-accent" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-foreground">{c.space_name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] sm:max-w-md flex flex-wrap items-center gap-1.5">
                                    <span>{c.address}, {c.city}</span>
                                    {c.pin && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary text-foreground border border-border/80">
                                        PIN: {c.pin}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <Users className="size-3 text-primary" /> Up to {c.capacity} people
                                  </div>
                                </div>
                              </div>
                              {(!selectedCentre && i === 0) && (
                                <span className="text-[10px] uppercase tracking-widest text-accent font-medium absolute bottom-3 right-4">Best Option</span>
                              )}
                              {isSelected && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCentre(""); }}
                                  className="absolute right-3 top-3 h-8 text-xs text-muted-foreground hover:text-foreground"
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
                  <div className="rounded-2xl border border-border p-5 bg-secondary/30 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Your practitioner travels to you. Please provide your full address with landmark.
                    </p>
                    <Input
                      value={hostAddress}
                      onChange={(e) => setHostAddress(e.target.value)}
                      placeholder="e.g. Flat 402, Building Name, Street..."
                      className="rounded-xl h-11 bg-background text-sm"
                    />
                  </div>
                )}

                {location === "online" && (
                  <div className="rounded-2xl border border-border p-5 bg-secondary/30">
                    <p className="text-xs text-muted-foreground">
                      You'll receive a secure, private video link 15 minutes before your scheduled session.
                    </p>
                  </div>
                )}
              </section>

              {/* STEP 4: Date & Available Time Slots */}
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-widest uppercase font-semibold text-accent">Step 3 · When</span>
                  {/* <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                    {duration} mins session
                  </span> */}
                </div>

                <AuraBookingCalendar
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  availableSlots={availableSlots}
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                  loadingSlots={loadingSlots}
                  durationMin={duration}
                  formatSlot={formatSlot}
                  practitionerSlug={selectedPractitioner?.slug}
                />
              </section>

              {/* STEP 5: Contact Details */}
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-4">
                <span className="text-[11px] tracking-widest uppercase font-semibold text-accent">Step 4 · Your Details</span>

                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-name" className="text-xs">Your Name</Label>
                    <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-11 bg-background" placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-email" className="text-xs">Email</Label>
                    <Input id="b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-11 bg-background" placeholder="you@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-phone" className="text-xs">Phone</Label>
                    <Input id="b-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11 bg-background" placeholder="+91" />
                  </div>
                </div>
              </section>

            </div>

            {/* RIGHT COLUMN: Sticky Order Summary & Pay CTA (5 Columns) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="font-display text-xl text-foreground">Session Summary</span>
                  <span className="text-[11px] text-accent tracking-widest uppercase font-medium flex items-center gap-1">
                    <Sparkles className="size-3" /> Kusala
                  </span>
                </div>

                {/* Selected Guide & Service Header */}
                {selectedPractitioner && (
                  <div className="flex items-center gap-3.5 pb-4 border-b border-border">
                    <div className="size-12 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border">
                      {selectedPractitioner.image_url ? (
                        <img src={selectedPractitioner.image_url} alt={selectedPractitioner.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs text-muted-foreground font-medium">Guide</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{selectedPractitioner.name}</h4>
                      <p className="text-xs text-muted-foreground">{selectedService?.name || selectedPractitioner.craft}</p>
                    </div>
                  </div>
                )}

                {/* Quick specs */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Therapy</span>
                    <span className="font-medium text-foreground">{selectedService?.name || "Standard Session"} ({duration}m)</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Date &amp; Time</span>
                    <span className={cn("font-medium", selectedTime ? "text-foreground" : "text-amber-600 dark:text-amber-400")}>
                      {formatDateDisplay(selectedDate)}
                      {selectedTime ? (
                        ` · ${formatSlot(selectedTime).start}`
                      ) : loadingSlots ? (
                        " · Checking slots…"
                      ) : availableSlots.length === 0 ? (
                        " · No slots available"
                      ) : (
                        " · Select time"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Location</span>
                    <span className="font-medium text-foreground">
                      {location === "studio"
                        ? (selectedPractitioner?.studio_name || "Practitioner's Studio")
                        : location === "centre"
                        ? (selectedCentre || "Partner Centre")
                        : location === "host"
                        ? "At your Home"
                        : "Virtual Video"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Circle</span>
                    <span className="font-medium text-foreground">{groupSize === 1 ? "1 person (Solo)" : `${groupSize} people (Group)`}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="pt-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent-soft px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                        <Tag className="size-3.5" /> {appliedCoupon.code} applied — {appliedCoupon.discountPercent}% off
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove coupon"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <Input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                          placeholder="Have a coupon code?"
                          className="rounded-xl h-11 bg-background flex-1 uppercase placeholder:normal-case"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim() || validatingCoupon}
                          className="rounded-xl h-11 px-5 shrink-0"
                        >
                          {validatingCoupon ? "Checking…" : "Apply"}
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                    </div>
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="pt-4 border-t border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Session fee {isGroup ? `(${groupSize} people)` : "(Solo)"}</span>
                    <span>{formatINR(total)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-accent font-medium">
                      <span>Coupon {appliedCoupon?.code} (−{appliedCoupon?.discountPercent}%)</span>
                      <span>−{formatINR(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Tax (5%)</span>
                    <span>{formatINR(tax)}</span>
                  </div>
                  {creditApplied > 0 && (
                    <div className="flex items-center justify-between text-accent font-medium">
                      <span>Referral credit applied</span>
                      <span>−{formatINR(creditApplied)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border text-base font-display">
                    <span>Total payable</span>
                    <span className="text-primary text-xl font-bold">{formatINR(payable)}</span>
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handlePay}
                  disabled={paying || !isFormValid}
                  className={cn(
                    "w-full rounded-full h-14 text-base font-medium shadow-soft transition-all",
                    isFormValid
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {paying ? "Opening secure checkout…" : `Pay ${formatINR(payable)} securely`}
                </Button>

                {/* Trust Badges */}
                <div className="space-y-2 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-accent shrink-0" />
                    <span>256-bit encrypted Razorpay checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-accent shrink-0" />
                    <span>Free cancellation up to 4 hours prior</span>
                  </div>
                </div>

              </div>
            </aside>

          </div>
        </div>
      )}

      <Footer />
    </main>
  );
};

export default Book;
