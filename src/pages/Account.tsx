import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CreditCard
} from "lucide-react";
import WellnessThermometer from "@/components/aura/WellnessThermometer";
import ReferralCard from "@/components/aura/ReferralCard";
import { cn } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";

import { listPractitioners } from "@/lib/practitionersApi";
import { getMyAppointments, type Appointment as Booking } from "@/lib/usersApi";
import { cancelAppointment, rescheduleAppointment, getAvailableSlots } from "@/lib/appointmentsApi";
import { startCheckout } from "@/lib/razorpay";

const DEFAULT_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"];

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const modeIcon = (mode: string) => (mode === "online" ? Video : mode === "host" ? Home : MapPin);
const modeLabel = (mode: string) =>
  mode === "online" ? "Online session" : mode === "host" ? "At your home" : "Partner centre";

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
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Cancel state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  // Payment state
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

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
    listPractitioners({ limit: 100 })
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
        const list = active.length > 0 ? active : DEFAULT_SLOTS;
        setAvailableSlots(list);
        if (!list.includes(rescheduleTime)) {
          setRescheduleTime(list[0] || "10:00");
        }
      })
      .catch(() => {
        setAvailableSlots(DEFAULT_SLOTS);
        if (!DEFAULT_SLOTS.includes(rescheduleTime)) {
          setRescheduleTime(DEFAULT_SLOTS[0]);
        }
      })
      .finally(() => setLoadingSlots(false));
  }, [rescheduleBooking, rescheduleDate]);

  // Handle Cancel action
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setActionBusy(true);
    try {
      await cancelAppointment(cancelModalBooking.id);
      toast.success("Session cancelled successfully. We have processed your update.");
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
      const updatedDate = `${rescheduleDate}T${rescheduleTime}:00.000Z`;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rescheduleBooking.id
            ? { ...b, scheduled_at: updatedDate, status: "pending" }
            : b
        )
      );
      setRescheduleBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule session");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Pay Pending action via Razorpay
  const handlePayPending = async (b: Booking) => {
    setPayingBookingId(b.id);
    await startCheckout({
      bookingId: b.id,
      customerName: profile?.full_name || user?.user_metadata?.full_name || "",
      customerEmail: user?.email || "",
      customerPhone: profile?.phone || "",
      onSuccess: () => {
        setPayingBookingId(null);
        toast.success("Payment completed successfully! Your session is now confirmed.");
        setBookings((prev) =>
          prev.map((item) => (item.id === b.id ? { ...item, status: "confirmed" } : item))
        );
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
                        className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${
                          isPending
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
                      onClick={() => setCancelModalBooking(b)}
                      className="rounded-full h-9 px-4 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="size-3.5 mr-1.5" />
                      Cancel Session
                    </Button>
                  </div>
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
              <Input
                type="date"
                min={getTomorrowDate()}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
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
              Free cancellation is supported up to 24 hours prior to your scheduled session.
            </p>
          </div>

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

      <Footer />
    </main>
  );
};

export default Account;
