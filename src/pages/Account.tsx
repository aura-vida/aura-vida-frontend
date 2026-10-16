import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  MapPin,
  Video,
  Home,
  NotebookPen,
  Users,
  Clock,
  RotateCcw,
  XCircle,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CreditCard,
  Settings,
  Building2,
  Star
} from "lucide-react";
import WellnessThermometer from "@/components/aura/WellnessThermometer";
import ReferralCard from "@/components/aura/ReferralCard";
import ClickableDatePicker from "@/components/aura/ClickableDatePicker";
import { cn } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";

import { listPractitioners, getPractitioner } from "@/lib/practitionersApi";
import { getMyAppointments, updateMe, getMe, type Appointment as Booking } from "@/lib/usersApi";
import { cancelAppointment, rescheduleAppointment, getAvailableSlots } from "@/lib/appointmentsApi";
import { startCheckout } from "@/lib/razorpay";
import { splitTaxInclusiveTotal } from "@/lib/pricing";
import { submitReview, listMyReviews, type Review } from "@/lib/reviewsApi";

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const CUSTOMER_CANCEL_WINDOW_HOURS = 4;
const canCustomerCancel = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() <= CUSTOMER_CANCEL_WINDOW_HOURS * 60 * 60 * 1000;

const modeIcon = (mode: string) => (mode === "online" ? Video : mode === "host" ? Home : MapPin);
const modeLabel = (mode: string) =>
  mode === "studio"
    ? "At practitioner's studio"
    : mode === "online"
    ? "Online session"
    : mode === "host"
    ? "At your home"
    : "Partner centre";

const formatPrice = (val: number | null | undefined) => {
  if (val == null) return "₹0";
  const inr = val > 10000 ? Math.round(val / 100) : val;
  return `₹${inr.toLocaleString("en-IN")}`;
};

const formatSlotRange = (slot: string, durationMin = 60) => {
  const [h, m] = slot.split(":").map(Number);
  const endTotalMin = h * 60 + m + durationMin;
  const endH = Math.floor(endTotalMin / 60) % 24;
  const endM = endTotalMin % 60;
  const startAmpm = h >= 12 ? "PM" : "AM";
  const endAmpm = endH >= 12 ? "PM" : "AM";
  return {
    start: `${h % 12 || 12}:${String(m).padStart(2, "0")} ${startAmpm}`,
    end: `${endH % 12 || 12}:${String(endM).padStart(2, "0")} ${endAmpm}`,
  };
};

const Account = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { services } = useServices();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [craftBySlug, setCraftBySlug] = useState<Record<string, string>>({});

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(getTomorrowDate());
  const [rescheduleTime, setRescheduleTime] = useState<string>("10:00");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Cancel state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  // Payment state
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  // Review state
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewPractitionerId, setReviewPractitionerId] = useState<string | null>(null);
  const [loadingReviewTarget, setLoadingReviewTarget] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    listMyReviews()
      .then((res) => {
        const byBooking: Record<string, Review> = {};
        (res.reviews || []).forEach((r) => {
          if (r.booking_id) byBooking[r.booking_id] = r;
        });
        setMyReviews(byBooking);
      })
      .catch((err) => console.error("Failed to load reviews:", err));
  }, [user]);

  const openReviewDialog = async (b: Booking) => {
    setReviewBooking(b);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewComment("");
    setReviewPractitionerId(null);
    if (!b.practitioner_slug) {
      toast.error("Could not identify the practitioner for this session.");
      return;
    }
    setLoadingReviewTarget(true);
    try {
      const res = await getPractitioner(b.practitioner_slug);
      setReviewPractitionerId(res.practitioner.id ?? null);
    } catch (err) {
      console.error("Failed to load practitioner for review:", err);
      toast.error("Could not load practitioner details. Please try again.");
    } finally {
      setLoadingReviewTarget(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking || !reviewPractitionerId || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      const res = await submitReview({
        practitioner_id: reviewPractitionerId,
        booking_id: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setMyReviews((prev) => ({ ...prev, [reviewBooking.id]: res.data }));
      toast.success("Thanks for your feedback!");
      setReviewBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const loadSessions = () => {
    if (!user) return;
    setFetching(true);
    getMyAppointments()
      .then((data) => {
        setBookings(data.appointments || []);
        setFetching(false);
      })
      .catch((err) => {
        console.error("Failed to load sessions:", err);
        setFetching(false);
      });
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  useEffect(() => {
    listPractitioners({ limit: 10 })
      .then((data) => {
        const map: Record<string, string> = {};
        data.practitioners.forEach((p) => {
          if (p.craft) map[p.slug] = p.craft.split("·")[0].trim();
        });
        setCraftBySlug(map);
      });
  }, []);

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleBooking || !rescheduleDate) return;
    const slug = rescheduleBooking.practitioner_slug || "";
    setLoadingSlots(true);
    getAvailableSlots(slug, rescheduleDate, rescheduleBooking.item_id)
      .then((res) => {
        const active = (res.slots || [])
          .filter((s) => s.available !== false)
          .map((s) => s.start.slice(0, 5));
        setAvailableSlots(active);
        setRescheduleTime(active.includes(rescheduleTime) ? rescheduleTime : active[0] || "");
      })
      .catch((err) => {
        console.error("Failed to load available slots:", err);
        setAvailableSlots([]);
        setRescheduleTime("");
      })
      .finally(() => setLoadingSlots(false));
  }, [rescheduleBooking, rescheduleDate]);

  // Handle Cancel action
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setActionBusy(true);
    try {
      const res = await cancelAppointment(cancelModalBooking.id);
      const refund = res.refund;
      if (refund && !refund.error && typeof refund.amount === "number") {
        const refundInr = Math.round(refund.amount / 100);
        const taxInr = refund.non_refundable_tax_inr || 0;
        toast.success(
          taxInr > 0
            ? `Session cancelled. ₹${refundInr.toLocaleString("en-IN")} refunded to your original payment method (₹${taxInr.toLocaleString("en-IN")} tax is non-refundable).`
            : `Session cancelled. ₹${refundInr.toLocaleString("en-IN")} refunded to your original payment method.`
        );
      } else {
        toast.success("Session cancelled successfully. We have processed your update.");
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, status: "cancelled" } : b))
      );
      setCancelModalBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel session");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Reschedule action
  const handleConfirmReschedule = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) {
      toast.error("Please pick a date and time slot");
      return;
    }
    setActionBusy(true);
    try {
      const res: any = await rescheduleAppointment(
        rescheduleBooking.id,
        rescheduleDate,
        rescheduleTime
      );
      toast.success("Session rescheduled! Your practitioner has been notified.");
      // Use the server's correctly IST->UTC-converted value, not a hand-built
      // one here (the date/time picked in the UI is IST wall-clock, not UTC).
      const updatedDate = res?.appointment?.scheduled_at;
      // Only the date/time changes — a reschedule never affects payment status.
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rescheduleBooking.id ? { ...b, scheduled_at: updatedDate ?? b.scheduled_at } : b
        )
      );
      setRescheduleBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule session");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Pay Pending action via Razorpay.
  // Bookings are now only ever created already `confirmed` (payment-first
  // flow), so this only matters for a stray legacy `pending` row — paying
  // starts a fresh checkout for the same session details, which creates a
  // new confirmed booking on success (the old pending row is left as-is).
  const handlePayPending = async (b: Booking) => {
    if (!b.scheduled_at || !b.practitioner_slug) {
      toast.error("This session is missing details needed to pay — please contact support.");
      return;
    }
    setPayingBookingId(b.id);
    // scheduled_at is stored as UTC; shift to IST before splitting into
    // date/time so we recover the wall-clock values the practitioner's
    // schedule and the booking API both expect (IST, not UTC).
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istShifted = new Date(new Date(b.scheduled_at).getTime() + IST_OFFSET_MS);
    const date = istShifted.toISOString().split("T")[0];
    const time = `${String(istShifted.getUTCHours()).padStart(2, "0")}:${String(istShifted.getUTCMinutes()).padStart(2, "0")}`;
    const attendees = (b.attendees || [])
      .map((a) => {
        if (typeof a === "string" && a.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(a);
            return { name: parsed.name || "", email: parsed.email || "" };
          } catch {
            return null;
          }
        }
        return typeof a === "string" && a.includes("@") ? { name: a, email: a } : null;
      })
      .filter((a): a is { name: string; email: string } => Boolean(a));

    await startCheckout({
      booking: {
        service_id: b.item_id,
        practitioner_slug: b.practitioner_slug,
        date,
        time,
        mode: (b.mode as "host" | "centre" | "online") || "centre",
        pin: b.pin,
        group_size: b.group_size || 1,
        attendees,
        meeting_location: b.meeting_location || undefined,
      },
      customerName: profile?.full_name || user?.user_metadata?.full_name || "",
      customerEmail: user?.email || "",
      customerPhone: profile?.phone || "",
      onSuccess: () => {
        setPayingBookingId(null);
        toast.success("Payment completed successfully! Your session is now confirmed.");
        loadSessions();
      },
      onError: (err) => {
        setPayingBookingId(null);
        toast.error(err || "Payment failed or was cancelled.");
      },
      onDismiss: () => {
        setPayingBookingId(null);
      },
    });
  };



  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-14 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Your space</span>
            <h1 className="font-display text-4xl md:text-5xl mt-3">
              {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "My sessions"}
            </h1>
          </div>
          <div className="flex gap-3">
            {profile?.practitioner_slug && (
              <Link to="/practitioner">
                <Button variant="outline" className="rounded-full h-11 px-6 border-foreground/20">Practitioner area</Button>
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link to="/admin">
                <Button variant="outline" className="rounded-full h-11 px-6 border-foreground/20 mr-1">Admin Dashboard</Button>
              </Link>
            )}
            <Link to="/settings">
              <Button
                variant="outline"
                className="rounded-full h-11 px-6 border-foreground/20"
              >
                <Settings className="size-4 mr-2" /> Settings
              </Button>
            </Link>
            <Button onClick={() => signOut()} variant="outline" className="rounded-full h-11 px-6 border-foreground/20">
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <ReferralCard />
        </div>

        <div className="mt-8">
          <WellnessThermometer bookings={bookings} craftBySlug={craftBySlug} />
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-foreground">Your Sessions</h2>
            <span className="text-xs text-muted-foreground">{bookings.length} recorded</span>
          </div>

          {fetching && (
            <div className="rounded-3xl border border-border bg-card p-12 text-center">
              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Loading your sessions…</p>
            </div>
          )}

          {!fetching && bookings.length === 0 && (
            <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-soft">
              <CalendarDays className="size-6 text-accent mx-auto" />
              <h2 className="font-display text-2xl mt-4">No sessions yet</h2>
              <p className="text-muted-foreground mt-2">
                Once you book a session it will appear here, along with your aftercare notes.
              </p>
              <Link to="/book">
                <Button className="rounded-full h-12 px-8 mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Book a session
                </Button>
              </Link>
            </div>
          )}

          {bookings.map((b) => {
            const Icon = modeIcon(b.mode);
            const isPending = b.status === "pending";
            const isConfirmed = b.status === "confirmed";
            const isCancelled = b.status === "cancelled";
            const isCompleted = b.status === "completed";
            const canModify = !isCancelled && !isCompleted;
            const cancelEligible = canModify && canCustomerCancel(b.created_at);

            const scheduledDate = b.scheduled_at
              ? new Date(b.scheduled_at).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              : null;

            const scheduledTime = b.scheduled_at
              ? new Date(b.scheduled_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
              : null;

            return (
              <article key={b.id} className="rounded-[2rem] border border-border bg-card p-7 shadow-soft space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-display text-2xl text-foreground">{b.practitioner_name}</h2>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${isPending
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                          : isConfirmed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : isCompleted
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                      >
                        {isPending ? "Payment Pending" : b.status}
                      </Badge>
                    </div>

                    {/* Scheduled date & time */}
                    {scheduledDate && (
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mt-2">
                        <Calendar className="size-4 text-accent" />
                        <span>{scheduledDate} · {scheduledTime}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                      <Icon className="size-4" /> {modeLabel(b.mode)}
                      {b.pin && <span>· PIN {b.pin}</span>}
                    </div>

                    {(b.group_size ?? 1) > 1 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Users className="size-4" /> Group circle of {b.group_size}
                        {b.attendees?.length ? ` · ${b.attendees.join(", ")}` : ""}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-1">
                      Booked {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-2xl text-foreground">{formatPrice(b.amount)}</div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Session Fee</span>
                  </div>
                </div>

                {/* Pending Payment Notice Banner */}
                {isPending && (
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0 text-amber-600" />
                      <span>Payment pending. Complete checkout to secure your practitioner's reservation.</span>
                    </div>
                  </div>
                )}

                {/* Customer Action Controls */}
                {canModify && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                    {isPending && (
                      <Button
                        size="sm"
                        disabled={payingBookingId === b.id}
                        onClick={() => handlePayPending(b)}
                        className="rounded-full h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                      >
                        {payingBookingId === b.id ? (
                          <>
                            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                            Opening Payment…
                          </>
                        ) : (
                          <>
                            <CreditCard className="size-3.5 mr-1.5" />
                            Pay Now ({formatPrice(b.amount)})
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRescheduleBooking(b);
                        setRescheduleDate(getTomorrowDate());
                      }}
                      className="rounded-full h-9 px-4 text-xs font-medium"
                    >
                      <RotateCcw className="size-3.5 mr-1.5" />
                      Reschedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!cancelEligible}
                      onClick={() => setCancelModalBooking(b)}
                      title={cancelEligible ? undefined : `Cancellation is only available within ${CUSTOMER_CANCEL_WINDOW_HOURS} hours of booking`}
                      className="rounded-full h-9 px-4 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <XCircle className="size-3.5 mr-1.5" />
                      Cancel Session
                    </Button>
                  </div>
                )}

                {canModify && !cancelEligible && (
                  <p className="text-[11px] text-muted-foreground text-right -mt-2">
                    The {CUSTOMER_CANCEL_WINDOW_HOURS}-hour cancellation window after booking has passed — contact support if you need to cancel.
                  </p>
                )}

                {/* Aftercare Notes */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    <NotebookPen className="size-3.5" /> Aftercare notes
                  </div>
                  <p className="text-sm text-foreground/80 mt-2.5 whitespace-pre-line leading-relaxed">
                    {b.aftercare_notes ?? "Your practitioner will add notes here after your session."}
                  </p>
                </div>

                {/* Review */}
                {isCompleted && (
                  <div className="pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                    {myReviews[b.id] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn(
                                "size-4",
                                n <= myReviews[b.id].rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">You rated this session</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(b)}
                        className="rounded-full h-9 px-4 text-xs"
                      >
                        <Star className="size-3.5 mr-1.5 text-accent" />
                        Leave a Review
                      </Button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* DIALOG: Reschedule Session */}
      <Dialog open={Boolean(rescheduleBooking)} onOpenChange={(open) => !open && setRescheduleBooking(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Reschedule Session</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Select a new date and available time slot for your session with{" "}
              <strong>{rescheduleBooking?.practitioner_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Date Input */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Select New Date</Label>
              <ClickableDatePicker
                min={getTomorrowDate()}
                value={rescheduleDate}
                onChange={setRescheduleDate}
                className="h-12 rounded-2xl bg-background px-4 text-sm"
              />
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Available Time Slots</Label>
                {loadingSlots && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> checking slots…
                  </span>
                )}
              </div>

              {!loadingSlots && availableSlots.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  No available slots for this date. Please choose another date.
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = rescheduleTime === slot;
                  const matchedService = services.find((s) => s.id === rescheduleBooking?.item_id);
                  const duration = matchedService?.duration_min || 60;
                  const { start, end } = formatSlotRange(slot, duration);

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleTime(slot)}
                      className={cn(
                        "flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border transition-all text-center",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary"
                          : "border-border bg-background hover:bg-secondary/50 text-foreground hover:border-foreground/30"
                      )}
                    >
                      <span className={cn("text-xs font-semibold leading-tight", isSelected ? "text-primary-foreground" : "text-foreground")}>
                        {start}
                      </span>
                      <span className={cn("text-[10px] mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        to {end}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setRescheduleBooking(null)}
              className="rounded-full h-11 px-6"
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmReschedule}
              disabled={actionBusy || !rescheduleDate || !rescheduleTime}
              className="rounded-full h-11 px-7 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {actionBusy ? "Rescheduling…" : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Cancel Confirmation */}
      <Dialog open={Boolean(cancelModalBooking)} onOpenChange={(open) => !open && setCancelModalBooking(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" /> Cancel Session
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to cancel your session with{" "}
              <strong>{cancelModalBooking?.practitioner_name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground space-y-1.5 my-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="size-4 text-accent" /> Cancellation Policy
            </div>
            <p>
              Free cancellation is available within {CUSTOMER_CANCEL_WINDOW_HOURS} hours of booking this session.
            </p>
          </div>

          {cancelModalBooking?.amount != null && cancelModalBooking.status === "confirmed" && (() => {
            const paidInr = cancelModalBooking.amount > 10000
              ? Math.round(cancelModalBooking.amount / 100)
              : cancelModalBooking.amount;
            const { subtotal, tax } = splitTaxInclusiveTotal(paidInr);
            return (
              <div className="rounded-2xl border border-border bg-card p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Total paid</span>
                  <span className="text-foreground font-medium">₹{(subtotal + tax).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground pl-3">
                  <span>— Session price (refundable)</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground pl-3">
                  <span>— Tax (non-refundable)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border font-medium">
                  <span className="text-foreground">You'll be refunded</span>
                  <span className="text-accent">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setCancelModalBooking(null)}
              className="rounded-full h-11"
            >
              Keep Session
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={actionBusy}
              className="rounded-full h-11"
            >
              {actionBusy ? "Cancelling…" : "Yes, Cancel Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Leave a Review */}
      <Dialog open={Boolean(reviewBooking)} onOpenChange={(open) => !open && setReviewBooking(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Rate your session</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              with <strong>{reviewBooking?.practitioner_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  onMouseEnter={() => setReviewHoverRating(n)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  className="p-1"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "size-8 transition-colors",
                      n <= (reviewHoverRating || reviewRating) ? "fill-accent text-accent" : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-comment">Share your experience (optional)</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What stood out about your session?"
                className="min-h-[100px] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReviewBooking(null)} className="rounded-full h-11">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewRating === 0 || submittingReview || loadingReviewTarget || !reviewPractitionerId}
              className="rounded-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submittingReview ? "Submitting…" : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
};

export default Account;
