import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  listPractitionerAppointments, 
  updatePractitionerAppointmentStatus 
} from "@/lib/appointmentsApi";
import { 
  getPractitionerSchedule, 
  updateMySchedule, 
  type DayScheduleUpdate 
} from "@/lib/availabilityApi";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Home, 
  Users, 
  User, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  NotebookPen 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Booking {
  id: string;
  client_name: string | null;
  mode: string;
  pin: string | null;
  status: string;
  amount: number | null;
  scheduled_at?: string | null;
  aftercare_notes: string | null;
  created_at: string;
  group_size: number | null;
  attendees: string[] | null;
}

const DAYS_OF_WEEK = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
];

const modeIcon = (mode: string) => (mode === "online" ? Video : mode === "host" ? Home : MapPin);
const modeLabel = (mode: string) =>
  mode === "online" ? "Online session" : mode === "host" ? "At client's home" : "Partner centre";

const PractitionerArea = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Weekly availability state
  const [scheduleState, setScheduleState] = useState<
    Record<number, { active: boolean; start: string; end: string; duration: number }>
  >({
    1: { active: true, start: "09:00", end: "17:00", duration: 60 },
    2: { active: true, start: "09:00", end: "17:00", duration: 60 },
    3: { active: true, start: "09:00", end: "17:00", duration: 60 },
    4: { active: true, start: "09:00", end: "17:00", duration: 60 },
    5: { active: true, start: "09:00", end: "17:00", duration: 60 },
    6: { active: false, start: "10:00", end: "16:00", duration: 60 },
    0: { active: false, start: "10:00", end: "16:00", duration: 60 },
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Load Bookings
  const fetchBookings = () => {
    if (!profile?.practitioner_slug) return;
    setLoadingBookings(true);
    listPractitionerAppointments()
      .then((res: any) => {
        const rows = (res.appointments ?? []) as Booking[];
        setBookings(rows);
        setDrafts(Object.fromEntries(rows.map((r) => [r.id, r.aftercare_notes ?? ""])));
      })
      .catch((err) => {
        console.error("Failed to fetch appointments:", err);
      })
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [profile?.practitioner_slug]);

  // Load Availability Schedule
  useEffect(() => {
    if (!profile?.practitioner_slug) return;
    setLoadingSchedule(true);
    getPractitionerSchedule(profile.practitioner_slug)
      .then((res) => {
        if (res.schedule && res.schedule.length > 0) {
          const nextState = { ...scheduleState };
          // reset all days to inactive first
          DAYS_OF_WEEK.forEach((d) => {
            nextState[d.day] = { active: false, start: "09:00", end: "17:00", duration: 60 };
          });
          res.schedule.forEach((row) => {
            if (row.day_of_week in nextState) {
              nextState[row.day_of_week] = {
                active: row.is_active !== false,
                start: row.start_time.slice(0, 5),
                end: row.end_time.slice(0, 5),
                duration: row.duration_min || 60,
              };
            }
          });
          setScheduleState(nextState);
        }
      })
      .catch((err) => console.error("Failed to load practitioner schedule:", err))
      .finally(() => setLoadingSchedule(false));
  }, [profile?.practitioner_slug]);

  // Update Status Action (Confirm or Complete)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setStatusBusyId(id);
    try {
      await updatePractitionerAppointmentStatus(id, newStatus, drafts[id]);
      toast.success(`Session marked as ${newStatus}`);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      toast.error(err.message || `Failed to update status to ${newStatus}`);
    } finally {
      setStatusBusyId(null);
    }
  };

  // Save Aftercare Notes
  const handleSaveNotes = async (id: string) => {
    setSavingNotesId(id);
    const notes = drafts[id] ?? "";
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ aftercare_notes: notes, aftercare_updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Aftercare notes saved! Client can now view them.");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, aftercare_notes: notes } : b))
      );
    } catch (err: any) {
      toast.error(err.message || "Could not save aftercare notes");
    } finally {
      setSavingNotesId(null);
    }
  };

  // Save Weekly Schedule
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const updates: DayScheduleUpdate[] = DAYS_OF_WEEK.map((d) => {
        const item = scheduleState[d.day];
        return {
          day_of_week: d.day,
          slots: item.active
            ? [
                {
                  start_time: item.start,
                  end_time: item.end,
                  duration_min: item.duration || 60,
                },
              ]
            : [],
        };
      });

      await updateMySchedule(updates);
      toast.success("Weekly availability saved! Clients can now book these slots.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update weekly schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-14 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Practitioner Workspace</span>
            <h1 className="font-display text-4xl md:text-5xl mt-3">Guide Portal</h1>
          </div>
        </div>

        {!profile?.practitioner_slug ? (
          <div className="mt-10 rounded-[2rem] border border-border bg-card p-10 shadow-soft">
            <h2 className="font-display text-2xl">This account isn't linked to a practitioner yet</h2>
            <p className="text-muted-foreground mt-2">
              Email sahil.dhanani@kusala.in to have your practitioner profile connected to this account.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full sm:w-[450px] grid-cols-2 rounded-full p-1 bg-secondary border border-border mb-8">
              <TabsTrigger value="appointments" className="rounded-full">Client Sessions</TabsTrigger>
              <TabsTrigger value="availability" className="rounded-full">Weekly Schedule</TabsTrigger>
            </TabsList>

            {/* TAB 1: CLIENT SESSIONS & AFTERCARE */}
            <TabsContent value="appointments" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-foreground">Your Sessions</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage appointments, confirm requests, update status, and write client aftercare notes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBookings}
                  disabled={loadingBookings}
                  className="rounded-full h-9 px-4 text-xs"
                >
                  Refresh
                </Button>
              </div>

              {loadingBookings ? (
                <div className="rounded-3xl border border-border bg-card p-16 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Loading your sessions...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
                  <p className="font-display text-xl text-foreground">No bookings with you yet</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    When clients book a session with you, their requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {bookings.map((b) => {
                    const Icon = modeIcon(b.mode);
                    const isPending = b.status === "pending";
                    const isConfirmed = b.status === "confirmed";
                    const isCompleted = b.status === "completed";

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
                      <article
                        key={b.id}
                        className="rounded-[2rem] border border-border bg-card p-7 shadow-soft space-y-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="font-display text-2xl text-foreground">
                                {b.client_name ?? "Client"}
                              </h2>
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

                            {scheduledDate && (
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground mt-2">
                                <Calendar className="size-4 text-accent" />
                                <span>{scheduledDate} {scheduledTime ? `· ${scheduledTime}` : ""}</span>
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
                          </div>

                          {/* Quick Action Buttons for Practitioners */}
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(b.id, "confirmed")}
                                disabled={statusBusyId === b.id}
                                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 text-xs"
                              >
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                Confirm Session
                              </Button>
                            )}

                            {isConfirmed && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(b.id, "completed")}
                                disabled={statusBusyId === b.id}
                                className="rounded-full bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 text-xs"
                              >
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Aftercare Notes Editor */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                              <NotebookPen className="size-3.5" /> Client Aftercare Notes
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Shared directly to client's account
                            </span>
                          </div>
                          <Textarea
                            value={drafts[b.id] ?? ""}
                            onChange={(e) => setDrafts({ ...drafts, [b.id]: e.target.value })}
                            placeholder="Aftercare notes for your client — recommended rest, hydration, mindfulness, herbal practices, follow-up recommendations…"
                            className="rounded-2xl min-h-28 bg-background"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleSaveNotes(b.id)}
                              disabled={savingNotesId === b.id}
                              className="rounded-full h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
                            >
                              {savingNotesId === b.id ? "Saving…" : "Save Aftercare Notes"}
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: WEEKLY SCHEDULE & AVAILABILITY */}
            <TabsContent value="availability" className="space-y-6 mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-foreground">Weekly Working Hours</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set which days and hours you are available for client appointments.
                  </p>
                </div>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="rounded-full h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  {savingSchedule ? "Saving Schedule…" : "Save Weekly Schedule"}
                </Button>
              </div>

              {loadingSchedule ? (
                <div className="rounded-3xl border border-border bg-card p-16 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Loading your schedule...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((d) => {
                    const current = scheduleState[d.day] || {
                      active: false,
                      start: "09:00",
                      end: "17:00",
                      duration: 60,
                    };

                    return (
                      <div
                        key={d.day}
                        className={`rounded-2xl border p-5 transition-smooth ${
                          current.active
                            ? "border-border bg-card shadow-soft"
                            : "border-border/50 bg-secondary/20 opacity-70"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={current.active}
                              onCheckedChange={(active) =>
                                setScheduleState((prev) => ({
                                  ...prev,
                                  [d.day]: { ...current, active },
                                }))
                              }
                            />
                            <div>
                              <h3 className="font-medium text-sm text-foreground">{d.label}</h3>
                              <p className="text-xs text-muted-foreground">
                                {current.active ? "Available for bookings" : "Unavailable / Day off"}
                              </p>
                            </div>
                          </div>

                          {current.active && (
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">From</span>
                                <Input
                                  type="time"
                                  value={current.start}
                                  onChange={(e) =>
                                    setScheduleState((prev) => ({
                                      ...prev,
                                      [d.day]: { ...current, start: e.target.value },
                                    }))
                                  }
                                  className="h-10 w-28 rounded-xl bg-background text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">to</span>
                                <Input
                                  type="time"
                                  value={current.end}
                                  onChange={(e) =>
                                    setScheduleState((prev) => ({
                                      ...prev,
                                      [d.day]: { ...current, end: e.target.value },
                                    }))
                                  }
                                  className="h-10 w-28 rounded-xl bg-background text-xs"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default PractitionerArea;
