import { useEffect, useState, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  UserCheck, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  MapPin, 
  Home, 
  Video, 
  Users, 
  User, 
  XCircle, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  adminListAppointments, 
  adminConfirmAppointment, 
  adminAssignPractitioner, 
  cancelAppointment,
  type AdminBooking 
} from "@/lib/appointmentsApi";
import { listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import { useServices } from "@/hooks/useServices";

const STATUS_FILTERS = [
  { id: "all", label: "All Bookings" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<AdminBooking[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const { services } = useServices();

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action states
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Assign Practitioner Modal
  const [assignModalBooking, setAssignModalBooking] = useState<AdminBooking | null>(null);
  const [selectedSlugToAssign, setSelectedSlugToAssign] = useState<string>("");

  // Cancel Confirmation Modal
  const [cancelModalBooking, setCancelModalBooking] = useState<AdminBooking | null>(null);

  // Load practitioners for assignment mapping
  useEffect(() => {
    listPractitioners({ limit: 100 })
      .then((res) => setPractitioners(res.practitioners))
      .catch((err) => console.error("Failed to load practitioners for admin assign:", err));
  }, []);

  // Fetch appointments list
  const fetchAppointments = async (targetPage = page, targetStatus = statusFilter) => {
    setLoading(true);
    try {
      const res = await adminListAppointments({
        status: targetStatus,
        page: targetPage,
        limit: 15,
      });
      setAppointments(res.data || []);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(page, statusFilter);
  }, [page, statusFilter]);

  // Handle Confirm
  const handleConfirm = async (booking: AdminBooking) => {
    setActionBusyId(booking.id);
    try {
      await adminConfirmAppointment(booking.id);
      toast.success(`Booking confirmed for ${booking.client_name || "client"}`);
      setAppointments((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm appointment");
    } finally {
      setActionBusyId(null);
    }
  };

  // Handle Assign / Reassign
  const handleAssignPractitioner = async () => {
    if (!assignModalBooking || !selectedSlugToAssign) return;
    setActionBusyId(assignModalBooking.id);
    try {
      const chosen = practitioners.find((p) => p.slug === selectedSlugToAssign);
      await adminAssignPractitioner(assignModalBooking.id, selectedSlugToAssign);
      toast.success(`Assigned ${chosen?.name || selectedSlugToAssign} to booking`);
      setAppointments((prev) =>
        prev.map((b) =>
          b.id === assignModalBooking.id
            ? { ...b, practitioner_slug: selectedSlugToAssign, practitioner_name: chosen?.name || b.practitioner_name }
            : b
        )
      );
      setAssignModalBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign practitioner");
    } finally {
      setActionBusyId(null);
    }
  };

  // Handle Cancel
  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setActionBusyId(cancelModalBooking.id);
    try {
      await cancelAppointment(cancelModalBooking.id);
      toast.success("Appointment has been cancelled");
      setAppointments((prev) =>
        prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, status: "cancelled" } : b))
      );
      setCancelModalBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel appointment");
    } finally {
      setActionBusyId(null);
    }
  };

  // Format currency
  const formatPrice = (val: number | null | undefined) => {
    if (val == null) return "₹0";
    const inr = val > 10000 ? Math.round(val / 100) : val;
    return `₹${inr.toLocaleString("en-IN")}`;
  };

  // Filter local items by search query
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter((b) => {
      const client = (b.client_name || "").toLowerCase();
      const practitioner = (b.practitioner_name || b.practitioner_slug || "").toLowerCase();
      const id = b.id.toLowerCase();
      return client.includes(q) || practitioner.includes(q) || id.includes(q);
    });
  }, [appointments, searchQuery]);

  // Statistics
  const pendingCount = appointments.filter((b) => b.status === "pending").length;
  const confirmedCount = appointments.filter((b) => b.status === "confirmed").length;

  return (
    <div className="space-y-8">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Records</span>
          <div className="font-display text-3xl mt-2 text-foreground">{totalCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold flex items-center gap-1.5">
            <Clock className="size-3" /> Awaiting Confirmation
          </span>
          <div className="font-display text-3xl mt-2 text-amber-700">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-3" /> Confirmed
          </span>
          <div className="font-display text-3xl mt-2 text-emerald-700">{confirmedCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Guides</span>
          <div className="font-display text-3xl mt-2 text-foreground">{practitioners.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setPage(1);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-medium transition-smooth ${
                statusFilter === f.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, guide, ID..."
              className="h-10 pl-9 rounded-xl text-xs bg-card border-border"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAppointments(page, statusFilter)}
            disabled={loading}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Refresh appointments"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <RefreshCw className="size-6 animate-spin mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Loading appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <AlertCircle className="size-8 mx-auto text-muted-foreground mb-3 opacity-60" />
          <p className="font-display text-xl text-foreground">No appointments found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter !== "all"
              ? `There are no ${statusFilter} appointments matching this view.`
              : "No customer bookings have been recorded yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((b) => {
            const isPending = b.status === "pending";
            const isConfirmed = b.status === "confirmed";
            const isCancelled = b.status === "cancelled";
            const isCompleted = b.status === "completed";

            // Service details lookup
            const matchedService = services.find((s) => s.id === b.item_id);
            const serviceName = matchedService?.name || "Therapy Session";

            // Date format
            const scheduledDate = b.scheduled_at
              ? new Date(b.scheduled_at).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date pending";

            const scheduledTime = b.scheduled_at
              ? new Date(b.scheduled_at).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <article
                key={b.id}
                className="rounded-3xl border border-border bg-card p-6 md:p-7 shadow-soft transition-smooth hover:border-foreground/20 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                  {/* Client & Booking ID */}
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display text-xl text-foreground">
                        {b.client_name || "Guest Client"}
                      </h3>
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
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                      ID: {b.id.slice(0, 8)}... · Booked on {new Date(b.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="sm:text-right">
                    <div className="font-display text-2xl text-foreground">
                      {formatPrice(b.amount)}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {b.currency || "INR"}
                    </span>
                  </div>
                </div>

                {/* Session Details Grid */}
                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                  {/* Therapy & Circle */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Therapy &amp; Circle
                    </span>
                    <p className="font-medium text-foreground">{serviceName}</p>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {(b.group_size || 1) > 1 ? (
                        <>
                          <Users className="size-3.5 text-accent" />
                          <span>Group circle ({b.group_size} guests)</span>
                        </>
                      ) : (
                        <>
                          <User className="size-3.5 text-muted-foreground" />
                          <span>Solo 1-on-1 session</span>
                        </>
                      )}
                    </div>
                    {b.attendees && b.attendees.length > 1 && (
                      <p className="text-[11px] text-muted-foreground truncate" title={b.attendees.join(", ")}>
                        Guests: {b.attendees.slice(1).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Scheduled Date & Location */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Date &amp; Space
                    </span>
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-accent" />
                      {scheduledDate} {scheduledTime ? `· ${scheduledTime}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {b.mode === "online" ? (
                        <>
                          <Video className="size-3.5 text-blue-500" />
                          <span>Online video session</span>
                        </>
                      ) : b.mode === "host" ? (
                        <>
                          <Home className="size-3.5 text-accent" />
                          <span>Client's home</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="size-3.5 text-accent" />
                          <span className="truncate">
                            {b.meeting_location?.address || `Partner space ${b.pin || ""}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Guide Assigned */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Assigned Guide
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="size-7 rounded-full bg-accent-soft border border-primary/20 flex items-center justify-center font-display text-xs text-primary font-bold">
                        {(b.practitioner_name || b.practitioner_slug || "P")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground leading-tight">
                          {b.practitioner_name || b.practitioner_slug || "Unassigned"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{b.practitioner_slug}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                  <div className="text-[11px] text-muted-foreground">
                    {b.aftercare_notes ? (
                      <span className="text-accent font-medium">✓ Aftercare notes attached</span>
                    ) : (
                      <span>No aftercare notes yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Confirm Booking Button */}
                    {isPending && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(b)}
                        disabled={actionBusyId === b.id}
                        className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 text-xs font-medium"
                      >
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                        Confirm Booking
                      </Button>
                    )}

                    {/* Reassign / Assign Practitioner */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssignModalBooking(b);
                        setSelectedSlugToAssign(b.practitioner_slug || "");
                      }}
                      disabled={actionBusyId === b.id}
                      className="rounded-full h-9 px-4 text-xs"
                    >
                      <UserCheck className="size-3.5 mr-1.5" />
                      Assign Guide
                    </Button>

                    {/* Cancel Booking Button */}
                    {!isCancelled && !isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelModalBooking(b)}
                        disabled={actionBusyId === b.id}
                        className="rounded-full h-9 px-3 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <XCircle className="size-3.5 mr-1.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-full h-9 px-3 text-xs"
            >
              <ChevronLeft className="size-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-full h-9 px-3 text-xs"
            >
              Next <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* DIALOG 1: Assign Practitioner */}
      <Dialog open={Boolean(assignModalBooking)} onOpenChange={(open) => !open && setAssignModalBooking(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Assign Guide</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select which verified practitioner will conduct this session for{" "}
              <strong>{assignModalBooking?.client_name || "client"}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Select Practitioner</Label>
              <Select value={selectedSlugToAssign} onValueChange={setSelectedSlugToAssign}>
                <SelectTrigger className="w-full h-12 rounded-2xl border-border bg-background">
                  <SelectValue placeholder="Choose a practitioner..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-64">
                  {practitioners.map((p) => (
                    <SelectItem key={p.slug} value={p.slug} className="py-2.5">
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-sm text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.craft} · {p.city}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setAssignModalBooking(null)}
              className="rounded-full h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignPractitioner}
              disabled={!selectedSlugToAssign || actionBusyId === assignModalBooking?.id}
              className="rounded-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Cancel Booking Confirmation */}
      <Dialog open={Boolean(cancelModalBooking)} onOpenChange={(open) => !open && setCancelModalBooking(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" /> Cancel Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to cancel the booking for{" "}
              <strong>{cancelModalBooking?.client_name || "this client"}</strong>? This status will be permanently marked as cancelled.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setCancelModalBooking(null)}
              className="rounded-full h-11"
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={actionBusyId === cancelModalBooking?.id}
              className="rounded-full h-11"
            >
              Yes, Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
