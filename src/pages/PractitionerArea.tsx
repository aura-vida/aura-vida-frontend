import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  listPractitionerAppointments,
  updatePractitionerAppointmentStatus,
  cancelAppointment,
} from "@/lib/appointmentsApi";
import { splitTaxInclusiveTotal } from "@/lib/pricing";
import {
  getPractitionerSchedule,
  updateMySchedule,
  createException,
  deleteException,
  getMyTimeOff,
  type DayScheduleUpdate,
  type AvailabilityException,
} from "@/lib/availabilityApi";
import {
  listMyBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  type Blog,
} from "@/lib/blogsApi";
import { CircularTimePicker } from "@/components/aura/CircularTimePicker";
import { ClickableDatePicker } from "@/components/aura/ClickableDatePicker";
import ConfirmDialog from "@/components/aura/ConfirmDialog";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Home,
  Building2,
  Users,
  User,
  CheckCircle2,
  Loader2,
  Sparkles,
  NotebookPen,
  BookOpen,
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  Globe,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  CalendarOff,
  XCircle,
  HelpCircle,
  Send,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuraPagination from "@/components/aura/AuraPagination";
import { useServices } from "@/hooks/useServices";
import { submitPractitionerSupport } from "@/lib/practitionersApi";

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
  attendees: any[] | null;
  currency?: string;
  item_id?: string;
  meeting_location?: {
    address?: string;
    pincode?: string;
    place_id?: string;
    lat?: number;
    lng?: number;
  } | null;
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

const modeIcon = (mode: string) =>
  mode === "studio" ? Building2 : mode === "online" ? Video : mode === "host" ? Home : MapPin;
const modeLabel = (mode: string) =>
  mode === "studio"
    ? "At your studio"
    : mode === "online"
    ? "Online session"
    : mode === "host"
    ? "At client's home"
    : "Partner centre";

const PractitionerArea = () => {
  const { user, profile, loading } = useAuth();
  const { services } = useServices();
  const navigate = useNavigate();

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  // Support / Contact Admin state
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTitle, setSupportTitle] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportCategory, setSupportCategory] = useState("General Support");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  // Pagination for appointments
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(1);
  const [appointmentsTotal, setAppointmentsTotal] = useState(0);

  // Weekly availability state
  const [scheduleState, setScheduleState] = useState<
    Record<number, { active: boolean; start: string; end: string; duration: number }>
  >({
    1: { active: false, start: "09:00", end: "17:00", duration: 60 },
    2: { active: false, start: "09:00", end: "17:00", duration: 60 },
    3: { active: false, start: "09:00", end: "17:00", duration: 60 },
    4: { active: false, start: "09:00", end: "17:00", duration: 60 },
    5: { active: false, start: "09:00", end: "17:00", duration: 60 },
    6: { active: false, start: "10:00", end: "16:00", duration: 60 },
    0: { active: false, start: "10:00", end: "16:00", duration: 60 },
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Exceptions state
  const [exceptionDay, setExceptionDay] = useState<{ day: number; label: string } | null>(null);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionStart, setExceptionStart] = useState("09:00");
  const [exceptionEnd, setExceptionEnd] = useState("17:00");
  const [exceptionType, setExceptionType] = useState<"leave" | "special">("leave");
  const [exceptionReason, setExceptionReason] = useState("");
  const [pendingExceptions, setPendingExceptions] = useState<AvailabilityException[]>([]);
  const [savingException, setSavingException] = useState(false);
  const [deletingExceptionId, setDeletingExceptionId] = useState<string | null>(null);

  const [allExceptions, setAllExceptions] = useState<AvailabilityException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);

  // Articles & Wisdom state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    category: "Sound Therapy",
    excerpt: "",
    content: "",
    featured_image: "",
    tags: "",
  });
  const [savingArticle, setSavingArticle] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Load Bookings
  const fetchBookings = () => {
    if (!profile?.practitioner_slug) return;
    setLoadingBookings(true);
    listPractitionerAppointments(undefined, appointmentsPage)
      .then((res: any) => {
        const rows = (res.appointments ?? []) as Booking[];
        setBookings(rows);
        setDrafts(Object.fromEntries(rows.map((r) => [r.id, r.aftercare_notes ?? ""])));
        if (res.pagination) {
          setAppointmentsTotalPages(res.pagination.totalPages);
          setAppointmentsTotal(res.pagination.total);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch appointments:", err);
      })
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [profile?.practitioner_slug, appointmentsPage]);

  // Load Availability Schedule
  useEffect(() => {
    if (!profile?.practitioner_slug) return;
    setLoadingSchedule(true);
    getPractitionerSchedule(profile.practitioner_slug)
      .then((res) => {
        const nextState: typeof scheduleState = {};
        // reset all days to inactive first
        DAYS_OF_WEEK.forEach((d) => {
          nextState[d.day] = { active: false, start: "09:00", end: "17:00", duration: 60 };
        });
        (res.schedule || []).forEach((row) => {
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
      })
      .catch((err) => console.error("Failed to load practitioner schedule:", err))
      .finally(() => setLoadingSchedule(false));

    // Also fetch all time-off / exceptions
    setLoadingExceptions(true);
    getMyTimeOff()
      .then((res) => {
        setAllExceptions(res.timeOff || []);
      })
      .catch((err) => console.error("Failed to load exceptions:", err))
      .finally(() => setLoadingExceptions(false));
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

  // Cancel Booking
  const handleCancelBooking = async (id: string) => {
    setStatusBusyId(id);

    try {
      const res = await cancelAppointment(id);
      const refund = res.refund;
      if (refund && !refund.error && typeof refund.amount === "number") {
        const refundInr = Math.round(refund.amount / 100);
        const taxInr = refund.non_refundable_tax_inr || 0;
        toast.success(
          taxInr > 0
            ? `Appointment cancelled. ₹${refundInr.toLocaleString("en-IN")} refunded (₹${taxInr.toLocaleString("en-IN")} tax is non-refundable).`
            : `Appointment cancelled. ₹${refundInr.toLocaleString("en-IN")} refunded.`
        );
      } else {
        toast.success("Appointment has been cancelled");
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "cancelled" } : b
        )
      );

      setCancelModalBooking(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel appointment");
    } finally {
      setStatusBusyId(null);
    }
  };

  // Submit Support Request to Admin
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTitle.trim() || !supportDescription.trim()) {
      toast.error("Please enter both a title and description.");
      return;
    }

    setSupportSubmitting(true);
    try {
      await submitPractitionerSupport({
        title: supportTitle.trim(),
        description: supportDescription.trim(),
        category: supportCategory,
      });

      toast.success("Support request sent to admin via email and notification!");
      setSupportTitle("");
      setSupportDescription("");
      setSupportOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send support request to admin");
    } finally {
      setSupportSubmitting(false);
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

  // Fetch articles written by practitioner
  const fetchMyArticles = () => {
    if (!profile?.practitioner_slug) return;
    setLoadingBlogs(true);
    listMyBlogs()
      .then((res) => {
        setBlogs(res.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to fetch articles:", err);
      })
      .finally(() => setLoadingBlogs(false));
  };

  useEffect(() => {
    fetchMyArticles();
  }, [profile?.practitioner_slug]);

  const handleOpenCreateArticle = () => {
    setEditingBlog(null);
    setArticleForm({
      title: "",
      category: "Sound Therapy",
      excerpt: "",
      content: "",
      featured_image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80",
      tags: "healing, wellness, mindfulness",
    });
    setIsArticleDialogOpen(true);
  };

  const handleOpenEditArticle = (b: Blog) => {
    setEditingBlog(b);
    setArticleForm({
      title: b.title,
      category: b.category || "Sound Therapy",
      excerpt: b.excerpt || "",
      content: b.content,
      featured_image: b.featured_image || "",
      tags: (b.tags || []).join(", "),
    });
    setIsArticleDialogOpen(true);
  };

  const handleSaveArticle = async (status: "draft" | "published") => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      toast.error("Please provide both a Title and Content for your article.");
      return;
    }
    setSavingArticle(true);
    try {
      const tagsArray = articleForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingBlog) {
        const updated = await updateBlog(editingBlog.id, {
          title: articleForm.title.trim(),
          category: articleForm.category,
          excerpt: articleForm.excerpt.trim(),
          content: articleForm.content.trim(),
          featured_image: articleForm.featured_image.trim() || null,
          tags: tagsArray,
          status,
        });
        toast.success(status === "published" ? "Article published publicly!" : "Draft saved!");
        setBlogs((prev) => prev.map((item) => (item.id === editingBlog.id ? updated : item)));
      } else {
        const created = await createBlog({
          title: articleForm.title.trim(),
          category: articleForm.category,
          excerpt: articleForm.excerpt.trim(),
          content: articleForm.content.trim(),
          featured_image: articleForm.featured_image.trim() || undefined,
          tags: tagsArray,
          status,
        });
        toast.success(status === "published" ? "Article published publicly!" : "Draft saved!");
        setBlogs((prev) => [created, ...prev]);
      }
      setIsArticleDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save article");
    } finally {
      setSavingArticle(false);
    }
  };

  const handleToggleArticleStatus = async (b: Blog) => {
    const nextStatus = b.status === "published" ? "draft" : "published";
    try {
      const updated = await updateBlog(b.id, { status: nextStatus });
      toast.success(nextStatus === "published" ? "Article is now Live publicly!" : "Article moved to Drafts");
      setBlogs((prev) => prev.map((item) => (item.id === b.id ? updated : item)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update article status");
    }
  };

  const [articleDeleteTarget, setArticleDeleteTarget] = useState<Blog | null>(null);

  const handleDeleteArticle = (blog: Blog) => {
    setArticleDeleteTarget(blog);
  };

  const handleConfirmDeleteArticle = async () => {
    if (!articleDeleteTarget) return;
    setDeletingArticleId(articleDeleteTarget.id);
    try {
      await deleteBlog(articleDeleteTarget.id);
      toast.success(`Article "${articleDeleteTarget.title}" deleted`);
      setBlogs((prev) => prev.filter((item) => item.id !== articleDeleteTarget.id));
      setArticleDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
    } finally {
      setDeletingArticleId(null);
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
          <Button
            onClick={() => setSupportOpen(true)}
            variant="outline"
            className="rounded-full border-border bg-card hover:bg-secondary hover:text-foreground hover:border-accent/40 text-foreground text-xs font-medium px-5 h-11 gap-2 shadow-soft transition-all self-start sm:self-auto"
          >
            <HelpCircle className="size-4 text-accent" />
            <span>Contact Admin</span>
          </Button>
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
            <TabsList
              className="
                grid w-full max-w-[760px] grid-cols-3
                h-12 sm:h-14
                rounded-full
                p-1
                bg-secondary/70
                border border-border/70
                shadow-sm
                mb-10
                backdrop-blur-sm
              "
            >
              <TabsTrigger
                value="appointments"
                className="
                  h-full rounded-full
                  px-3 sm:px-5
                  text-xs sm:text-sm
                  font-medium
                  text-muted-foreground
                  transition-all duration-200
                  gap-1.5 sm:gap-2
                  data-[state=active]:bg-background
                  data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm
                  data-[state=active]:border
                  data-[state=active]:border-border/60
                "
              >
                <Users className="size-3.5 sm:size-4 shrink-0" />
                <span>Client Sessions</span>
              </TabsTrigger>

              <TabsTrigger
                value="availability"
                className="
                  h-full rounded-full
                  px-3 sm:px-5
                  text-xs sm:text-sm
                  font-medium
                  text-muted-foreground
                  transition-all duration-200
                  gap-1.5 sm:gap-2
                  data-[state=active]:bg-background
                  data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm
                  data-[state=active]:border
                  data-[state=active]:border-border/60
                "
              >
                <Clock className="size-3.5 sm:size-4 shrink-0" />
                <span>Weekly Schedule</span>
              </TabsTrigger>

              <TabsTrigger
                value="articles"
                className="
                  h-full rounded-full
                  px-3 sm:px-5
                  text-xs sm:text-sm
                  font-medium
                  text-muted-foreground
                  transition-all duration-200
                  gap-1.5 sm:gap-2
                  data-[state=active]:bg-background
                  data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm
                  data-[state=active]:border
                  data-[state=active]:border-border/60
                "
              >
                <BookOpen className="size-3.5 sm:size-4 shrink-0" />
                <span>Articles & Wisdom</span>
              </TabsTrigger>
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
                    const isPending = b.status === "pending";
                    const isConfirmed = b.status === "confirmed";
                    const isCompleted = b.status === "completed";
                    const isCancelled = b.status === "cancelled";

                    // Service detail lookup
                    const matchedService = services.find((s) => s.id === b.item_id);
                    const serviceName = matchedService?.name || "Therapy Session";

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

                    // Parse attendees safely handle JSON string representation
                    const parsedAttendees = (b.attendees || []).map(a => {
                      if (typeof a === 'string') {
                        try {
                          const parsed = JSON.parse(a);
                          return parsed.name || parsed.email || a;
                        } catch {
                          return a;
                        }
                      } else if (a && typeof a === 'object') {
                        return (a as any).name || (a as any).email || 'Guest';
                      }
                      return a;
                    });

                    const formatPrice = (val: number | null | undefined) => {
                      if (val == null) return "₹0";
                      const inr = val > 10000 ? Math.round(val / 100) : val;
                      return `₹${inr.toLocaleString("en-IN")}`;
                    };

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
                                {b.client_name ?? "Guest Client"}
                              </h3>
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
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
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
                            {parsedAttendees.length > 1 && (
                              <p className="text-[11px] text-muted-foreground truncate" title={parsedAttendees.join(", ")}>
                                Guests: {parsedAttendees.slice(1).join(", ")}
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
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                          <div className="text-[11px] text-muted-foreground">
                            {b.aftercare_notes ? (
                              <span className="text-accent font-medium">✓ Aftercare notes appended</span>
                            ) : (
                              <span>No aftercare notes yet</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(b.id, "confirmed")}
                                disabled={statusBusyId === b.id}
                                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 text-xs font-medium"
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
                                className="rounded-full bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 text-xs font-medium"
                              >
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                Mark Completed
                              </Button>
                            )}

                            {!isCancelled && !isCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelModalBooking(b)}
                                disabled={statusBusyId === b.id}
                                className="rounded-full h-9 px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              >
                                <XCircle className="size-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Aftercare Notes Editor */}
                        <div className="space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/50">
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

                  {appointmentsTotalPages > 1 && (
                    <div className="pt-6 pb-2 border-t border-border mt-8">
                      <AuraPagination
                        page={appointmentsPage}
                        totalPages={appointmentsTotalPages}
                        totalItems={appointmentsTotal}
                        onPageChange={setAppointmentsPage}
                        itemName="appointments"
                      />
                    </div>
                  )}
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
                        className={`rounded-2xl border p-5 transition-smooth ${current.active
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
                                <CircularTimePicker
                                  value={current.start}
                                  onChange={(time) =>
                                    setScheduleState((prev) => ({
                                      ...prev,
                                      [d.day]: { ...current, start: time },
                                    }))
                                  }
                                  className="h-10 w-44 rounded-xl bg-background text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">to</span>
                                <CircularTimePicker
                                  value={current.end}
                                  onChange={(time) =>
                                    setScheduleState((prev) => ({
                                      ...prev,
                                      [d.day]: { ...current, end: time },
                                    }))
                                  }
                                  className="h-10 w-44 rounded-xl bg-background text-xs"
                                />
                              </div>

                              {/* Three-dot exceptions menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary/60 transition-colors"
                                    title="Manage this day"
                                  >
                                    <MoreVertical className="size-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setExceptionDay(d);
                                      setExceptionDate("");
                                      setExceptionStart(current.start);
                                      setExceptionEnd(current.end);
                                      setExceptionType("leave");
                                      setExceptionReason("");
                                      // pre-filter existing exceptions for this specific day using Day-Of-Week to show in modal?
                                      setPendingExceptions([]);
                                    }}
                                    className="gap-2"
                                  >
                                    <CalendarOff className="size-4" />
                                    Manage exceptions
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ALL APPLIED EXCEPTIONS LIST */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-display text-lg text-foreground mb-4">Applied Exceptions</h3>
                {loadingExceptions ? (
                  <p className="text-sm text-muted-foreground">Loading exceptions...</p>
                ) : allExceptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No availability exceptions applied.</p>
                ) : (
                  <div className="border border-border rounded-2xl divide-y divide-border bg-card">
                    {allExceptions.map((ex) => (
                      <div key={ex.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={ex.type === "leave" ? "destructive" : "secondary"}>
                              {ex.type === "leave" ? "Blocked / Leave" : "Special Hours"}
                            </Badge>
                            <span className="font-medium text-sm">{ex.exception_date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ex.start_time} – {ex.end_time} {ex.reason && `· ${ex.reason}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingExceptionId === ex.id}
                          onClick={async () => {
                            if (!profile?.practitioner_slug) return;
                            setDeletingExceptionId(ex.id);
                            try {
                              await deleteException(profile.practitioner_slug, ex.id);
                              setAllExceptions((prev) => prev.filter((e) => e.id !== ex.id));
                              toast.success("Exception removed");
                            } catch (err: any) {
                              toast.error(err.message || "Failed to remove exception");
                            } finally {
                              setDeletingExceptionId(null);
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <XCircle className="size-4 mr-2" /> Release
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* EXCEPTIONS DIALOG */}
            <Dialog open={!!exceptionDay} onOpenChange={(open) => !open && setExceptionDay(null)}>
              <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-2">
                    <CalendarOff className="size-5" /> {exceptionDay?.label} Exceptions
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground pt-1">
                    Block a specific date within this day's schedule — e.g. a holiday, a personal appointment, or reduced hours.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Specific Date to Block</Label>
                      <ClickableDatePicker
                        value={exceptionDate}
                        onChange={setExceptionDate}
                        className="h-11 rounded-xl bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Block From</Label>
                      <CircularTimePicker
                        value={exceptionStart}
                        onChange={setExceptionStart}
                        className="h-11 rounded-xl bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Block Until</Label>
                      <CircularTimePicker
                        value={exceptionEnd}
                        onChange={setExceptionEnd}
                        className="h-11 rounded-xl bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</Label>
                      <Select
                        value={exceptionType}
                        onValueChange={(val) => setExceptionType(val as "leave" | "special")}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl border-border bg-background px-3.5 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="z-[100] rounded-xl border-border bg-card shadow-xl">
                          <SelectItem value="leave">Leave / Day off</SelectItem>
                          <SelectItem value="special">Special reduced hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason (optional)</Label>
                      <Input
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        placeholder="e.g. Doctor's appointment"
                        className="h-11 rounded-xl bg-background"
                      />
                    </div>
                  </div>

                  {pendingExceptions.length > 0 && (
                    <div className="border border-border rounded-xl divide-y divide-border">
                      {pendingExceptions.map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <span className="text-sm font-medium">{ex.exception_date}</span>
                            <span className="text-xs text-muted-foreground ml-2">{ex.start_time} – {ex.end_time}</span>
                            {ex.reason && <span className="text-xs text-muted-foreground ml-2">· {ex.reason}</span>}
                          </div>
                          <button
                            type="button"
                            disabled={deletingExceptionId === ex.id}
                            onClick={async () => {
                              if (!profile?.practitioner_slug) return;
                              setDeletingExceptionId(ex.id);
                              try {
                                await deleteException(profile.practitioner_slug, ex.id);
                                setPendingExceptions((prev) => prev.filter((e) => e.id !== ex.id));
                                toast.success("Exception removed");
                              } catch (err: any) {
                                toast.error(err.message || "Failed to remove");
                              } finally {
                                setDeletingExceptionId(null);
                              }
                            }}
                            className="text-destructive hover:text-destructive/80 ml-3 disabled:opacity-50"
                          >
                            <XCircle className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button variant="outline" onClick={() => setExceptionDay(null)} className="rounded-full h-11">
                    Close
                  </Button>
                  <Button
                    disabled={savingException || !exceptionDate || !exceptionStart || !exceptionEnd}
                    onClick={async () => {
                      if (!profile?.practitioner_slug || !exceptionDate) return;
                      setSavingException(true);
                      try {
                        const res = await createException(profile.practitioner_slug, {
                          exception_date: exceptionDate,
                          start_time: exceptionStart,
                          end_time: exceptionEnd,
                          type: exceptionType,
                          reason: exceptionReason || undefined,
                        });
                        setPendingExceptions((prev) => [...prev, res.exception]);
                        setAllExceptions((prev) => [...prev, res.exception]); // Update main list too
                        setExceptionDate("");
                        setExceptionReason("");
                        toast.success(`Exception added for ${exceptionDate}`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to add exception");
                      } finally {
                        setSavingException(false);
                      }
                    }}
                    className="rounded-full h-11 px-7 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {savingException ? "Blocking…" : "Block this date"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* TAB 3: ARTICLES & WISDOM */}
            <TabsContent value="articles" className="space-y-6 mt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-foreground">Articles & Wisdom</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Write thought-leadership pieces, share healing philosophies, and let clients discover your expertise.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMyArticles}
                    disabled={loadingBlogs}
                    className="rounded-full h-9 px-4 text-xs font-medium"
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOpenCreateArticle}
                    className="rounded-full h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <Plus className="size-3.5 mr-1.5" /> Write Article
                  </Button>
                </div>
              </div>

              {/* Status Pills Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Written</div>
                  <div className="font-display text-2xl mt-1 text-foreground">{blogs.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Live & Public</div>
                  <div className="font-display text-2xl mt-1 text-emerald-600">
                    {blogs.filter((b) => b.status === "published").length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border col-span-2 sm:col-span-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Private Drafts</div>
                  <div className="font-display text-2xl mt-1 text-amber-600">
                    {blogs.filter((b) => b.status === "draft").length}
                  </div>
                </div>
              </div>

              {loadingBlogs ? (
                <div className="rounded-3xl border border-border bg-card p-16 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Loading your articles...</p>
                </div>
              ) : blogs.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
                  <BookOpen className="size-8 mx-auto text-accent mb-3" />
                  <p className="font-display text-xl text-foreground">No articles written yet</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
                    Share your approach to sound therapy, breathing, somatic release, or ancient wellness traditions.
                  </p>
                  <Button
                    onClick={handleOpenCreateArticle}
                    className="rounded-full h-10 px-6 text-xs mt-6 bg-primary"
                  >
                    <Plus className="size-3.5 mr-1.5" /> Write Your First Article
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {blogs.map((b) => {
                    const isPublished = b.status === "published";
                    const readMin = Math.max(1, Math.round((b.content || "").split(/\s+/).length / 200));

                    return (
                      <article
                        key={b.id}
                        className="rounded-[2rem] border border-border bg-card p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-foreground/20 transition-all"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          {b.featured_image ? (
                            <img
                              src={b.featured_image}
                              alt={b.title}
                              className="size-16 sm:size-20 rounded-2xl object-cover shrink-0 border border-border/60 bg-secondary"
                            />
                          ) : (
                            <div className="size-16 sm:size-20 rounded-2xl bg-secondary flex items-center justify-center shrink-0 border border-border/60 text-muted-foreground">
                              <FileText className="size-6" />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {b.category && (
                                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                  {b.category}
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${isPublished
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                                  }`}
                              >
                                {isPublished ? "Live & Public" : "Draft (Private)"}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                · {readMin} min read
                              </span>
                            </div>

                            <h3 className="font-display text-xl text-foreground font-medium">
                              {b.title}
                            </h3>

                            {b.excerpt && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {b.excerpt}
                              </p>
                            )}

                            <div className="text-[11px] text-muted-foreground pt-1">
                              Updated {new Date(b.updated_at || b.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Article Action Controls */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          {isPublished && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="rounded-full h-8 px-3 text-xs"
                            >
                              <Link to={`/journal/${b.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-3 mr-1" /> View Live
                              </Link>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleArticleStatus(b)}
                            className="rounded-full h-8 px-3 text-xs"
                          >
                            <Globe className="size-3 mr-1" />
                            {isPublished ? "Move to Draft" : "Publish Live"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditArticle(b)}
                            className="rounded-full h-8 px-3 text-xs bg-card hover:bg-secondary hover:text-foreground border-border/80 transition-smooth"
                          >
                            <Edit3 className="size-3 mr-1 text-accent" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingArticleId === b.id}
                            onClick={() => handleDeleteArticle(b)}
                            className="rounded-full h-8 px-3 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive transition-smooth"
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* DIALOG: Write & Edit Article */}
        <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {editingBlog ? "Edit Article" : "Write a New Article"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Share your healing knowledge. You can save as a private draft or publish immediately to your public profile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium">Article Title *</label>
                <Input
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="e.g. Why Sound Frequencies Settle an Anxious Nervous System"
                  className="rounded-xl h-11 mt-1 text-sm bg-background"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Category</label>
                  <Select
                    value={articleForm.category}
                    onValueChange={(val) => setArticleForm({ ...articleForm, category: val })}
                  >
                    <SelectTrigger className="rounded-xl h-11 mt-1 text-sm bg-background">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sound Therapy">Sound Therapy</SelectItem>
                      <SelectItem value="Meditation">Meditation</SelectItem>
                      <SelectItem value="Breathwork">Breathwork</SelectItem>
                      <SelectItem value="Reiki & Energy">Reiki & Energy</SelectItem>
                      <SelectItem value="Yoga Therapy">Yoga Therapy</SelectItem>
                      <SelectItem value="Ayurveda">Ayurveda</SelectItem>
                      <SelectItem value="Holistic Health">Holistic Health</SelectItem>
                      <SelectItem value="Somatic Release">Somatic Release</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium">Tags (comma-separated)</label>
                  <Input
                    value={articleForm.tags}
                    onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                    placeholder="healing, nervous system, prana"
                    className="rounded-xl h-11 mt-1 text-sm bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Short Excerpt / Teaser</label>
                <Textarea
                  rows={2}
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  placeholder="A 2-sentence summary that gives readers a quick preview..."
                  className="rounded-xl mt-1 text-xs resize-none bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Cover Image URL</label>
                <Input
                  value={articleForm.featured_image}
                  onChange={(e) => setArticleForm({ ...articleForm, featured_image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="rounded-xl h-11 mt-1 text-sm bg-background"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">Suggested presets:</span>
                  {[
                    { label: "Sound Bowls", url: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80" },
                    { label: "Meditation", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80" },
                    { label: "Breathwork", url: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80" },
                    { label: "Sanctuary", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setArticleForm({ ...articleForm, featured_image: preset.url })}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 border border-border/60 text-muted-foreground transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium">Article Content *</label>
                  <span className="text-[10px] text-muted-foreground">Supports paragraphs, ## Headings, and - Bullets</span>
                </div>
                <Textarea
                  rows={9}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  placeholder="Write your article here...&#10;&#10;## Understanding the Practice&#10;Write detailed guidance for your clients...&#10;&#10;- Take 3 deep breaths&#10;- Notice bodily sensations"
                  className="rounded-2xl text-sm leading-relaxed bg-background"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                disabled={savingArticle}
                onClick={() => handleSaveArticle("draft")}
                className="rounded-full h-11 px-6 text-xs font-medium"
              >
                Save as Draft
              </Button>
              <Button
                disabled={savingArticle}
                onClick={() => handleSaveArticle("published")}
                className="rounded-full h-11 px-7 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingArticle ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Globe className="size-3.5 mr-1.5" /> Publish Publicly
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG: Cancel Appointment */}
        <Dialog
          open={!!cancelModalBooking}
          onOpenChange={(open) => {
            if (!open && statusBusyId !== cancelModalBooking?.id) {
              setCancelModalBooking(null);
            }
          }}
        >
          <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="size-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <XCircle className="size-5 text-destructive" />
                </div>

                <div className="space-y-1">
                  <DialogTitle className="font-display text-2xl">
                    Cancel Session?
                  </DialogTitle>

                  <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                    Are you sure you want to cancel this session? This action cannot
                    be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {cancelModalBooking && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 my-2">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Client
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {cancelModalBooking.client_name || "Guest Client"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Date
                      </span>
                      <p className="text-xs text-foreground mt-0.5">
                        {cancelModalBooking.scheduled_at
                          ? new Date(
                            cancelModalBooking.scheduled_at
                          ).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                          : "Date pending"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Time
                      </span>
                      <p className="text-xs text-foreground mt-0.5">
                        {cancelModalBooking.scheduled_at
                          ? new Date(
                            cancelModalBooking.scheduled_at
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Time pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cancelModalBooking?.amount != null && cancelModalBooking.status === "confirmed" && (() => {
              const paidInr = cancelModalBooking.amount > 10000
                ? Math.round(cancelModalBooking.amount / 100)
                : cancelModalBooking.amount;
              const { subtotal, tax } = splitTaxInclusiveTotal(paidInr);
              return (
                <div className="rounded-2xl border border-border bg-card p-4 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Session price</span>
                    <span className="text-foreground font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Tax (non-refundable)</span>
                    <span>−₹{tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-border font-medium">
                    <span className="text-foreground">Client will be refunded</span>
                    <span className="text-accent">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              );
            })()}

            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-xs text-destructive/90 leading-relaxed">
                The client will be notified that this appointment has been cancelled.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => setCancelModalBooking(null)}
                disabled={statusBusyId === cancelModalBooking?.id}
                className="rounded-full h-11"
              >
                Keep Session
              </Button>

              <Button
                onClick={() =>
                  cancelModalBooking &&
                  handleCancelBooking(cancelModalBooking.id)
                }
                disabled={
                  !cancelModalBooking ||
                  statusBusyId === cancelModalBooking.id
                }
                variant="destructive"
                className="rounded-full h-11 px-6"
              >
                {statusBusyId === cancelModalBooking?.id ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  <>
                    <XCircle className="size-3.5 mr-1.5" />
                    Cancel Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Support / Contact Admin Dialog */}
        <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl bg-card border-border">
            <DialogHeader>
              <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-1">
                <MessageSquare className="size-4" />
                <span>Practitioner Support</span>
              </div>
              <DialogTitle className="font-display text-2xl text-foreground">
                Contact Admin
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Send a message or support query directly to platform administrators. This will notify them via in-app notification and email.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSupportSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="support-category" className="text-xs font-medium text-foreground">
                  Topic / Category
                </Label>
                <Select value={supportCategory} onValueChange={setSupportCategory}>
                  <SelectTrigger id="support-category" className="rounded-xl bg-background border-border text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="General Support">General Support</SelectItem>
                    <SelectItem value="Schedule & Availability">Schedule & Availability</SelectItem>
                    <SelectItem value="Appointment & Booking Issue">Appointment & Booking Issue</SelectItem>
                    <SelectItem value="Payouts & Billing">Payouts & Billing</SelectItem>
                    <SelectItem value="Profile & Services Update">Profile & Services Update</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-title" className="text-xs font-medium text-foreground">
                  Title / Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="support-title"
                  value={supportTitle}
                  onChange={(e) => setSupportTitle(e.target.value)}
                  placeholder="Brief subject of your query or request"
                  className="rounded-xl bg-background border-border text-xs"
                  required
                  maxLength={150}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-desc" className="text-xs font-medium text-foreground">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="support-desc"
                  value={supportDescription}
                  onChange={(e) => setSupportDescription(e.target.value)}
                  placeholder="Describe what you need assistance with in detail..."
                  rows={5}
                  className="rounded-xl bg-background border-border text-xs resize-none"
                  required
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSupportOpen(false)}
                  disabled={supportSubmitting}
                  className="rounded-full h-10 text-xs px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={supportSubmitting || !supportTitle.trim() || !supportDescription.trim()}
                  className="rounded-full h-10 text-xs px-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  {supportSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Send to Admin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog: Delete Article */}
        <ConfirmDialog
          open={!!articleDeleteTarget}
          onOpenChange={(open) => !open && setArticleDeleteTarget(null)}
          title={articleDeleteTarget ? `Delete Article "${articleDeleteTarget.title}"?` : "Delete Article"}
          description={`Are you sure you want to permanently delete "${articleDeleteTarget?.title}"? This cannot be undone and will remove it from your public profile.`}
          confirmLabel="Yes, Delete Article"
          cancelLabel="Keep Article"
          variant="destructive"
          isLoading={deletingArticleId === articleDeleteTarget?.id}
          onConfirm={handleConfirmDeleteArticle}
        />
      </section>
      <Footer />
    </main>
  );
};

export default PractitionerArea;
