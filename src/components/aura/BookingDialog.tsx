import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Building2, Video, MapPin, Search, ArrowRight, User, Users, Minus, Plus, Calendar as CalendarIcon, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { startCheckout } from "@/lib/razorpay";
import { getAvailableSlots } from "@/lib/appointmentsApi";
import { useServices } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MAX_GROUP_SIZE, formatINR, groupTotal, parsePrice, calculateSessionSubtotal } from "@/lib/pricing";
import { getPractitioner, type Practitioner } from "@/lib/practitionersApi";
import { getPublicSpacesByPin, type PartnerSpace } from "@/lib/locationApi";
import AuraBookingCalendar from "@/components/aura/AuraBookingCalendar";

type Location = "studio" | "online" | "centre" | "host";

// Helper for default booking date
const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
const getTodayDate = () => new Date().toISOString().split("T")[0];

const LARGE_GROUP_MAILTO =
  "mailto:sahil.dhanani@kusala.in?subject=Large%20group%20session%20enquiry%20%E2%80%94%20Ku%C5%9Bala";

const options: { id: Location; icon: any; title: string; body: string }[] = [
  { id: "studio", icon: Building2, title: "At their studio", body: "Practitioner's own private studio." },
  { id: "online", icon: Video, title: "Virtual", body: "Join from anywhere." },
  { id: "centre", icon: MapPin, title: "Partner Centre", body: "A serene, vetted space near you." },
  { id: "host", icon: Home, title: "At Home", body: "We come to your sanctuary." },
];

interface Props {
  practitionerName?: string;
  trigger?: React.ReactNode;
  itemId?: string;
  price?: string;
}

const BookingDialog = ({ practitionerName, trigger, itemId = "session-priya-shah", price }: Props) => {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<Location>("centre");
  const { services } = useServices();
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDate());
  const [selectedTime, setSelectedTime] = useState<string>("10:00");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [pin, setPin] = useState("");
  const [searched, setSearched] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [guests, setGuests] = useState<{ name: string, email: string }[]>([{ name: "", email: "" }]);
  const [suggestedPlaces, setSuggestedPlaces] = useState<PartnerSpace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [hostAddress, setHostAddress] = useState("");

  const resetForm = () => {
    setSelectedServiceId("");
    setSelectedCentre("");
    setSelectedDate(getTomorrowDate());
    setSelectedTime("10:00");
    setAvailableSlots([]);
    setPin("");
    setSearched(false);
    setIsGroup(false);
    setGuests([{ name: "", email: "" }]);
    setSuggestedPlaces([]);
    setHostAddress("");
    setLocation("centre");
    // Keep name/email/phone pre-filled from profile as convenience
  };

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

  const [paying, setPaying] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!open) return;
    if (profile?.full_name && !name) setName(profile.full_name);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [open, profile, user]);

  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  useEffect(() => {
    if (open && itemId) {
      getPractitioner(itemId)
        .then((res) => setPractitioner(res.practitioner))
        .catch(() => { });
    }
  }, [open, itemId]);

  useEffect(() => {
    if (!practitioner) return;
    const canStudio = practitioner.offers_studio === true;
    const canCentre = practitioner.offers_centre !== false;
    const canHost = practitioner.offers_host === true;
    const canOnline = practitioner.offers_online === true;

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
    practitioner?.slug,
    practitioner?.offers_studio,
    practitioner?.offers_centre,
    practitioner?.offers_host,
    practitioner?.offers_online
  ]);

  // Fetch available slots dynamically when date or service changes
  useEffect(() => {
    if (!open || !selectedDate || !itemId) return;
    setLoadingSlots(true);
    getAvailableSlots(itemId, selectedDate, selectedServiceId)
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
  }, [open, itemId, selectedDate, selectedServiceId]);

  const groupSize = isGroup ? 1 + guests.length : 1;
  const selectedService = services.find(s => s.id === selectedServiceId);
  const base = selectedService?.price_inr || parsePrice(price);
  const total = practitioner
    ? calculateSessionSubtotal(practitioner, location, groupSize)
    : (base ? groupTotal(base, groupSize) : 0);
  const credit = user ? Number(profile?.credit_inr ?? 0) : 0;
  const creditApplied = credit > 0 && total ? Math.min(credit, Math.max(0, total - 100)) : 0;
  const payable = total - creditApplied;
  const extraEach = base ? Math.round(base * 0.6) : 0;

  const addGuest = () => {
    if (guests.length >= MAX_GROUP_SIZE - 1) return;
    setGuests([...guests, { name: "", email: "" }]);
  };
  const removeGuest = (i: number) => {
    const next = guests.filter((_, idx) => idx !== i);
    setGuests(next.length ? next : [{ name: "", email: "" }]);
  };

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
        description: "You need to be signed in to book a session.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedServiceId) {
      toast({ title: "Select a service", description: "Please select a service before proceeding." });
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast({ title: "Select date & time", description: "Please pick your preferred date and time slot." });
      return;
    }
    if (location === "centre" && !selectedCentre) {
      toast({ title: "Select a centre", description: "Please select a partner centre from the list before proceeding." });
      return;
    }
    if (location === "host" && !hostAddress.trim()) {
      toast({ title: "Address required", description: "Please provide your full address for the home session." });
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast({ title: "Almost there", description: "Please add your name and email so we can confirm your session." });
      return;
    }
    const attendees = [
      { name: name.trim(), email: email.trim() },
      ...(isGroup ? guests.map((g) => ({ name: g.name.trim(), email: g.email.trim() })).filter(g => g.name || g.email) : [])
    ].filter(g => g.name && g.email);
    if (isGroup && attendees.length < groupSize) {
      toast({ title: "Missing names", description: "Please add the name of everyone joining the session." });
      return;
    }
    setPaying(true);

    try {
      const meeting_location = location === "centre" && selectedCentre ? {
        address: selectedCentre,
        pincode: pin || "400001",
        place_id: "centre-" + selectedCentre.toLowerCase().replace(/\s+/g, '-'),
        lat: 19.0760,
        lng: 72.8777,
      } : location === "host" ? {
        address: hostAddress.trim(),
        type: "host"
      } : location === "studio" ? {
        name: practitioner?.studio_name || `${practitioner?.name || "Practitioner"}'s Studio`,
        address: practitioner?.studio_address || "",
        city: practitioner?.studio_city || "",
        maps_url: practitioner?.studio_maps_url || null,
        type: "studio"
      } : undefined;

      // Start Razorpay checkout. The booking itself is only created once
      // payment is verified, so an abandoned checkout never registers one.
      await startCheckout({
        booking: {
          service_id: selectedServiceId,
          practitioner_slug: itemId,
          date: selectedDate,
          time: selectedTime,
          mode: location,
          pin: location === "centre" ? pin : null,
          group_size: groupSize,
          attendees,
          meeting_location,
        },
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        onSuccess: () => {
          setPaying(false);
          resetForm();
          setOpen(false);
          toast({
            title: "🎉 Booking confirmed!",
            description: "Your session is booked and payment received. Check your email for confirmation details.",
          });
        },
        onError: (msg) => {
          setPaying(false);
          toast({ title: "Payment failed", description: msg, variant: "destructive" });
        },
        onDismiss: () => setPaying(false),
      });
    } catch (error: any) {
      setPaying(false);
      toast({ title: "Booking failed", description: error.message || "Could not create appointment", variant: "destructive" });
    }
  };


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

        {/* Service Selection */}
        <div className="mt-4">
          <Label className="text-sm font-medium mb-3 block">Select a service</Label>
          <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
            <SelectTrigger className="w-full h-14 rounded-2xl border-border px-4 py-3 bg-card hover:border-accent/50 transition-all text-left flex items-center justify-between">
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border max-h-[300px]">
              {services.filter(s => s.is_active !== false).map(s => (
                <SelectItem key={s.id} value={s.id} className="py-3 px-4 cursor-pointer focus:bg-accent/5 focus:text-accent rounded-xl my-1 mx-1">
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">₹{s.price_inr} · {s.duration_min} min</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


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
                  value={g.name}
                  onChange={(e) => setGuests(guests.map((v, idx) => (idx === i ? { ...v, name: e.target.value } : v)))}
                  placeholder={`Guest ${i + 1} full name`}
                  className="rounded-full h-11 flex-1"
                />
                <Input
                  type="email"
                  value={g.email}
                  onChange={(e) => setGuests(guests.map((v, idx) => (idx === i ? { ...v, email: e.target.value } : v)))}
                  placeholder={`Email`}
                  className="rounded-full h-11 flex-1"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {options.filter(o => {
            if (!practitioner) return true;
            if (o.id === 'studio') return practitioner.offers_studio === true;
            if (o.id === 'centre') return practitioner.offers_centre !== false;
            if (o.id === 'host') return practitioner.offers_host === true;
            if (o.id === 'online') return practitioner.offers_online === true;
            return true;
          }).map((o) => {
            const active = location === o.id;
            return (
              <button
                key={o.id}
                onClick={() => { setLocation(o.id); setSearched(false); }}
                className={cn(
                  "text-left rounded-2xl border p-4 transition-all",
                  active
                    ? "border-primary bg-accent-soft shadow-soft ring-1 ring-primary"
                    : "border-border hover:border-foreground/30 hover:bg-secondary/50",
                )}
              >
                <o.icon className={cn("size-5 mb-2.5", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-medium text-sm text-foreground">{o.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">
                  {o.id === "studio" && practitioner?.studio_city
                    ? `Practitioner's studio · ${practitioner.studio_city}`
                    : o.body}
                </div>
              </button>
            );
          })}
        </div>

        {location === "studio" && (
          <div className="mt-4 rounded-2xl border border-border p-4 bg-secondary/30 space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-accent mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="font-medium text-sm text-foreground">
                  {practitioner?.studio_name || `${practitioner?.name || "Practitioner"}'s Studio`}
                  {practitioner?.studio_city && ` · ${practitioner.studio_city}`}
                </div>
                {practitioner?.studio_address && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {practitioner.studio_address}
                    {practitioner.studio_city && !practitioner.studio_address.toLowerCase().includes(practitioner.studio_city.toLowerCase()) ? `, ${practitioner.studio_city}` : ""}
                  </p>
                )}
                {practitioner?.studio_maps_url && (
                  <div className="pt-1">
                    <a
                      href={practitioner.studio_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                    >
                      Open in Maps ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                disabled={pin.length !== 6 || loadingPlaces}
                className="rounded-full h-12 px-5 bg-foreground text-background hover:bg-foreground/90"
              >
                {loadingPlaces ? <Clock className="size-4 mr-1 animate-spin" /> : <Search className="size-4 mr-1" />} Find
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
              <ul className="space-y-2 pt-2 max-h-[340px] overflow-y-auto pr-2">
                {suggestedPlaces.map((c, i) => {
                  const isSelected = selectedCentre === c.space_name;
                  if (selectedCentre && !isSelected) return null;
                  return (
                    <li
                      key={c.id}
                      onClick={() => setSelectedCentre(isSelected ? "" : c.space_name)}
                      className={cn(
                        "relative flex items-center justify-between gap-3 rounded-2xl border p-4 cursor-pointer transition-all hover:border-accent/50",
                        isSelected ? "bg-accent/5 border-accent ring-1 ring-accent" : "bg-card border-border",
                        (!selectedCentre && i === 0) && "bg-accent-soft border-primary/40"
                      )}
                    >
                      <div className="flex items-start gap-3 w-full pr-16">
                        <MapPin className="size-4 text-accent mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.space_name}</div>
                          <div className="text-xs text-muted-foreground max-w-[200px] sm:max-w-md mt-0.5 flex flex-wrap items-center gap-1.5">
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
          <div className="mt-4 rounded-2xl border border-border p-4 bg-secondary/40 space-y-3">
            <p className="text-sm text-muted-foreground">
              Your practitioner will travel to you. Please provide your full address with landmark.
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
          <div className="mt-4 rounded-2xl border border-border p-4 bg-secondary/40">
            <p className="text-sm text-muted-foreground">
              {isGroup
                ? "Everyone in your group receives a private video link 15 minutes before the session."
                : "You'll receive a private video link 15 minutes before your session."}
            </p>
          </div>
        )}

        {/* Date & Time Slot Picker */}
        <div className="mt-4 p-5 rounded-3xl border border-border bg-card space-y-4 shadow-soft">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="size-4 text-accent" /> Date &amp; Time
            </Label>
            <span className="text-[11px] font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full">
              {selectedService?.duration_min || 60} mins session
            </span>
          </div>

          <AuraBookingCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableSlots={availableSlots}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
            loadingSlots={loadingSlots}
            durationMin={selectedService?.duration_min || 60}
            practitionerSlug={practitioner?.slug || itemId}
          />
        </div>

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
              disabled={paying || !isFormValid}
              className={cn(
                "rounded-full h-12 px-7 transition-all",
                isFormValid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
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
