import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  listEvents,
  createEventOrder,
  verifyEventPayment,
  type StaticEvent,
  type EventBooking,
} from "@/lib/eventsApi";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const FALLBACK_EVENT: StaticEvent = {
  id: "breathe-release-return",
  title: "Breathe. Release. Return.",
  subtitle: "A guided breathwork workshop with Neelam Chheda",
  guide: {
    name: "Neelam Chheda",
    craft: "Breathwork & Elemental Healing",
    slug: "neelam-chheda",
    photo: "/images/journal/neelam-chheda.jpg",
  },
  description:
    "Most of us carry more than we realise: tension in the body, a mind that won’t settle, emotions we never found time to feel. Breathwork gives your body a safe, simple way to let go.\n\nJoin Neelam Chheda, a breathwork guide who works with all five elements, for a 2-hour workshop. You’ll learn the technique, then be guided through a deep breathwork journey. You’ll leave feeling lighter, calmer and more connected to yourself.",
  schedule: {
    date: "Sunday, 6 December 2026",
    isoDate: "2026-12-06",
    time: "11:00 AM – 1:00 PM",
    duration: "2 hours",
    venue: "Eclipse Wellbeing – Yoga Studio, Santacruz (West), Mumbai",
    status: "Open (limited seats)",
  },
  pricing: {
    basePriceInr: 2500,
    currency: "INR",
  },
  whatToExpect: [
    "A short introduction to breathwork and what may come up, such as tingling, emotion, laughter or stillness.",
    "A step-by-step demonstration of the technique.",
    "A guided breathwork journey with music.",
    "Deep relaxation to bring you back gently.",
    "A short sharing circle.",
    "Two simple practices to take home: The 40 CCB breath (1 minute a round), and a daily solar plexus balance exercise (1 to 2 minutes).",
  ],
  goodToKnow: [
    "No prior experience needed.",
    "Wear comfortable clothes and bring a water bottle.",
    "Eye covers are provided.",
    "Not suitable for people who are pregnant or have epilepsy, heart conditions or recent surgery.",
    "Please message us before booking if you're unsure about suitability.",
  ],
  image: "/images/journal/neelam-chheda.jpg",
  pricingBreakdown: {
    baseAmount: 2500,
    gstPercentage: 5,
    gstAmount: 125,
    totalAmount: 2625,
    amountPaise: 262500,
    currency: "INR",
  },
};

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function EventsSection() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<StaticEvent[]>([FALLBACK_EVENT]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [detailsEvent, setDetailsEvent] = useState<StaticEvent | null>(null);
  const [bookingEvent, setBookingEvent] = useState<StaticEvent | null>(null);

  // Booking Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState<EventBooking | null>(null);

  useEffect(() => {
    listEvents()
      .then((res) => {
        if (res.events && res.events.length > 0) {
          setEvents(res.events);
        }
      })
      .catch((err) => {
        console.warn("Using fallback static event data:", err);
      });
  }, []);

  // Prefill contact details from logged-in user if available
  const handleOpenBooking = (event: StaticEvent) => {
    setBookingEvent(event);
    setCustomerName(profile?.full_name || "");
    setCustomerEmail(user?.email || "");
    setCustomerPhone(profile?.phone || "");
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEvent) return;

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error("Please fill in your name, email, and phone number.");
      return;
    }

    const currentEvent = bookingEvent;
    setIsPaying(true);

    try {
      // 1. Ensure Razorpay script is loaded
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        throw new Error("Unable to load payment portal. Please check your internet connection.");
      }

      // 2. Call backend to create Razorpay Order
      const orderRes = await createEventOrder({
        eventId: currentEvent.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
      });

      // 3. Close the Radix Dialog BEFORE opening Razorpay modal.
      // This releases Radix's modal focus-trap and removes pointer-events: none from document.body,
      // allowing the user to click Cards, Netbanking, type numbers, and select options inside Razorpay!
      setBookingEvent(null);

      // 4. Open Razorpay Checkout modal
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "Kuśala",
        description: `${currentEvent.title} Ticket`,
        order_id: orderRes.orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#0d9488",
        },
        config: {
          display: {
            blocks: {
              cards: {
                name: "Cards",
                instruments: [{ method: "card" }],
              },
              netbanking: {
                name: "Netbanking",
                instruments: [{ method: "netbanking" }],
              },
              upi: {
                name: "UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.cards", "block.netbanking", "block.upi"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            // Re-open booking dialog if dismissed without completing payment
            setBookingEvent(currentEvent);
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 5. Verify signature on backend
            const verifyRes = await verifyEventPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setConfirmedBooking(verifyRes.booking);
              toast.success("Workshop booking confirmed! Confirmation email has been sent.");
            } else {
              toast.error("Payment verification was unsuccessful. Please reach out to support.");
            }
          } catch (verErr: any) {
            console.error("Payment verification error:", verErr);
            toast.error(verErr.message || "Failed to verify payment with server.");
          } finally {
            setIsPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay!(options);
      rzp.open();
    } catch (err: any) {
      console.error("Booking order error:", err);
      toast.error(err.message || "Failed to initiate payment. Please try again.");
      setIsPaying(false);
      setBookingEvent(currentEvent);
    }
  };

  return (
    <section id="events" className="py-20 lg:py-28 px-6 lg:px-12 max-w-[1500px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-semibold flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent" /> Upcoming Gatherings &amp; Workshops
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-3 text-foreground tracking-tight">
            Events &amp; Immersions
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mt-2 font-light">
            In-person sacred journeys, group breathwork, and transformative wellness circles curated in Mumbai’s finest sanctuaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {events.map((event) => {
          const breakdown = event.pricingBreakdown || {
            baseAmount: 2500,
            gstPercentage: 5,
            gstAmount: 125,
            totalAmount: 2625,
          };

          return (
            <article
              key={event.id}
              className="lg:col-span-12 rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col lg:flex-row"
            >
              {/* Event Image & Guide Badge */}
              <div className="lg:w-5/12 relative min-h-[320px] lg:min-h-full bg-secondary/30 overflow-hidden">
                <img
                  src={event.image || "/images/journal/neelam-chheda.jpg"}
                  alt={event.title}
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-medium text-white/90">
                    <Sparkles className="size-3 text-accent" />
                    <span>Guide: {event.guide.name}</span>
                  </div>
                  <p className="text-xs text-white/80 font-light">{event.guide.craft}</p>
                </div>

                <div className="absolute top-6 left-6">
                  <Badge className="bg-primary/95 text-primary-foreground backdrop-blur-md border-0 text-[11px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
                    {event.schedule.status}
                  </Badge>
                </div>
              </div>

              {/* Event Details Content */}
              <div className="lg:w-7/12 p-8 lg:p-12 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-3xl lg:text-4xl text-foreground tracking-tight">
                      {event.title}
                    </h3>
                    <p className="text-accent text-sm md:text-base font-medium mt-1">
                      {event.subtitle}
                    </p>
                  </div>

                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
                    {event.description.split("\n\n")[0]}
                  </p>

                  {/* Schedule & Location Pills */}
                  <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/50 border border-border/60">
                      <Calendar className="size-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">Date &amp; Time</span>
                        <span className="text-xs md:text-sm font-semibold text-foreground">
                          {event.schedule.date}
                        </span>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" /> {event.schedule.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/50 border border-border/60">
                      <MapPin className="size-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">Sanctuary Venue</span>
                        <span className="text-xs md:text-sm font-semibold text-foreground line-clamp-2">
                          {event.schedule.venue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA Controls */}
                <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">
                      Event Price ({breakdown.gstPercentage}% GST Included)
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display text-3xl font-medium text-foreground">
                        ₹{breakdown.totalAmount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{breakdown.baseAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      ₹{breakdown.baseAmount.toLocaleString("en-IN")} + ₹{breakdown.gstAmount} GST ({breakdown.gstPercentage}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setDetailsEvent(event)}
                      className="rounded-full h-12 px-5 text-xs font-medium border-border/80 hover:bg-secondary flex-1 sm:flex-none"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleOpenBooking(event)}
                      className="rounded-full h-12 px-7 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none shadow-sm"
                    >
                      Book Now <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ─── 1. View Details Modal ────────────────────────────────────────── */}
      <Dialog open={!!detailsEvent} onOpenChange={(open) => !open && setDetailsEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-7 md:p-9 rounded-[2.5rem]">
          {detailsEvent && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold w-fit mb-2">
                  <Sparkles className="size-3.5" /> 2-Hour Breathwork Workshop
                </div>
                <DialogTitle className="font-display text-2xl md:text-3xl">
                  {detailsEvent.title}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-foreground/80 mt-1">
                  {detailsEvent.subtitle}
                </DialogDescription>
              </DialogHeader>

              {/* Schedule Info Box */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 space-y-2 text-xs md:text-sm">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Calendar className="size-4 text-accent" />
                  <span>{detailsEvent.schedule.date} · {detailsEvent.schedule.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4 text-accent" />
                  <span>{detailsEvent.schedule.venue}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">About the Experience</h4>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {detailsEvent.description}
                </p>
              </div>

              {/* What to Expect */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">What to Expect</h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {detailsEvent.whatToExpect.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Good to Know */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-amber-600" /> Good to Know &amp; Guidelines
                </h4>
                <ul className="space-y-1.5 text-xs text-amber-950/90 leading-relaxed">
                  {detailsEvent.goodToKnow.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing Breakdown Card */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">
                  Pricing &amp; Tax Breakdown
                </h4>
                <div className="space-y-1.5 text-xs text-foreground/90">
                  <div className="flex justify-between">
                    <span>Base Event Price:</span>
                    <span>₹{detailsEvent.pricingBreakdown?.baseAmount?.toLocaleString("en-IN") || "2,500"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({detailsEvent.pricingBreakdown?.gstPercentage || 5}%):</span>
                    <span>₹{detailsEvent.pricingBreakdown?.gstAmount?.toLocaleString("en-IN") || "125"}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-bold text-sm text-foreground">
                    <span>Total Payable:</span>
                    <span className="text-accent">
                      ₹{detailsEvent.pricingBreakdown?.totalAmount?.toLocaleString("en-IN") || "2,625"}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDetailsEvent(null)}
                  className="rounded-full h-11"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const evt = detailsEvent;
                    setDetailsEvent(null);
                    handleOpenBooking(evt);
                  }}
                  className="rounded-full h-11 px-7 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Book Seat for ₹{detailsEvent.pricingBreakdown?.totalAmount?.toLocaleString("en-IN") || "2,625"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 2. Book Now Checkout Modal ────────────────────────────────────── */}
      <Dialog open={!!bookingEvent} onOpenChange={(open) => !isPaying && !open && setBookingEvent(null)}>
        <DialogContent className="max-w-lg p-7 rounded-[2.5rem]">
          {bookingEvent && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              <DialogHeader>
                <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                  Secure Workshop Registration
                </span>
                <DialogTitle className="font-display text-2xl">
                  {bookingEvent.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {bookingEvent.schedule.date} · {bookingEvent.schedule.time}
                </DialogDescription>
              </DialogHeader>

              {/* Contact Information Fields */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="evt_name" className="text-xs font-medium flex items-center gap-1.5">
                    <User className="size-3.5 text-accent" /> Full Name
                  </Label>
                  <Input
                    id="evt_name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Neelam Dave"
                    className="rounded-2xl h-11 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="evt_email" className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="size-3.5 text-accent" /> Email Address
                  </Label>
                  <Input
                    id="evt_email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="rounded-2xl h-11 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="evt_phone" className="text-xs font-medium flex items-center gap-1.5">
                    <Phone className="size-3.5 text-accent" /> Phone Number (WhatsApp updates)
                  </Label>
                  <Input
                    id="evt_phone"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="rounded-2xl h-11 text-xs"
                  />
                </div>
              </div>

              {/* Exact Pricing Breakdown */}
              <div className="rounded-2xl bg-secondary/50 p-4 border border-border/80 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Pricing Breakdown
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Event Price:</span>
                    <span>₹{bookingEvent.pricingBreakdown?.baseAmount?.toLocaleString("en-IN") || "2,500"}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST ({bookingEvent.pricingBreakdown?.gstPercentage || 5}%):</span>
                    <span>₹{bookingEvent.pricingBreakdown?.gstAmount?.toLocaleString("en-IN") || "125"}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-bold text-sm text-foreground">
                    <span>Total Payable:</span>
                    <span className="text-emerald-700">
                      ₹{bookingEvent.pricingBreakdown?.totalAmount?.toLocaleString("en-IN") || "2,625"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>Encrypted 256-bit checkout powered by Razorpay. Official ticket sent via email.</span>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPaying}
                  onClick={() => setBookingEvent(null)}
                  className="rounded-full h-11 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPaying}
                  className="rounded-full h-11 px-6 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-1"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="size-3.5 mr-2 animate-spin" /> Processing Payment…
                    </>
                  ) : (
                    `Proceed to Pay ₹${bookingEvent.pricingBreakdown?.totalAmount?.toLocaleString("en-IN") || "2,625"}`
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 3. Booking Confirmed Ticket Modal ────────────────────────────── */}
      <Dialog open={!!confirmedBooking} onOpenChange={(open) => !open && setConfirmedBooking(null)}>
        <DialogContent className="max-w-lg p-7 md:p-8 rounded-[2.5rem]">
          {confirmedBooking && (
            <div className="space-y-6 text-center">
              <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-8" />
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block">
                  Registration Confirmed
                </span>
                <DialogTitle className="font-display text-2xl md:text-3xl mt-1">
                  You’re Going to {confirmedBooking.event_name}!
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-2">
                  A confirmation receipt and workshop instructions have been emailed to{" "}
                  <strong>{confirmedBooking.customer_email}</strong>.
                </DialogDescription>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 text-left space-y-3 shadow-soft">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider border-b border-border pb-2.5">
                  <Ticket className="size-4" /> Admission Ticket Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Attendee</span>
                    <span className="font-medium text-foreground">{confirmedBooking.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Total Paid</span>
                    <span className="font-semibold text-emerald-700">₹{confirmedBooking.total_amount?.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Booking Status</span>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px]">
                      {confirmedBooking.booking_status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Payment Ref</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate block">
                      {confirmedBooking.razorpay_payment_id || confirmedBooking.razorpay_order_id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/account" className="flex-1">
                  <Button variant="outline" className="rounded-full h-11 text-xs w-full">
                    View in My Sessions
                  </Button>
                </Link>
                <Button
                  onClick={() => setConfirmedBooking(null)}
                  className="rounded-full h-11 text-xs px-6 bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

