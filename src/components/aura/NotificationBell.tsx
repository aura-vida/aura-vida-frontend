import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  Star, 
  Building2, 
  FileText, 
  Wallet, 
  Clock, 
  Loader2 
} from "lucide-react";
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  listNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  type NotificationItem 
} from "@/lib/notificationsApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const data = await listNotifications(30);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Background polling every 45 seconds for real-time alerts
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (item: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.is_read) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );

    try {
      await markNotificationAsRead(item.id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await markAllNotificationsAsRead();
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all read:", err);
      toast.error("Failed to update notifications");
      fetchNotifications(true);
    }
  };

  const handleClickItem = async (item: NotificationItem) => {
    await handleMarkAsRead(item);
    setOpen(false);

    // Contextual routing based on role and notification type
    if (profile?.role === "admin") {
      if (item.type === "practitioner") {
        navigate("/admin?tab=practitioners");
      } else if (item.type === "space") {
        navigate("/admin?tab=spaces");
      } else {
        navigate("/admin?tab=appointments");
      }
    } else if (profile?.role === "practitioner") {
      navigate("/practitioner");
    } else {
      navigate("/account");
    }
  };

  const getRelativeTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(timestamp).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
    } catch (_) {
      return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="size-4 text-emerald-600" />;
      case "payment":
        return <CreditCard className="size-4 text-accent" />;
      case "review":
        return <Star className="size-4 text-amber-500 fill-amber-500" />;
      case "practitioner":
        return <Sparkles className="size-4 text-purple-600" />;
      case "space":
        return <Building2 className="size-4 text-sky-600" />;
      case "notes":
        return <FileText className="size-4 text-emerald-600" />;
      case "credit":
        return <Wallet className="size-4 text-accent" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  if (!user) return null;

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          className="relative inline-flex items-center justify-center size-11 rounded-full border border-border/80 bg-card hover:bg-secondary text-foreground transition-colors group cursor-pointer focus:outline-none shadow-soft"
        >
          <Bell className="size-4.5 text-foreground/80 group-hover:text-foreground transition-transform group-hover:scale-105" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white shadow-soft animate-in zoom-in-50 duration-200">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 rounded-[2rem] bg-card border-border shadow-elegant overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-medium border border-accent/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-full"
              >
                <CheckCheck className="size-3.5 mr-1 text-accent" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === "all"
                  ? "bg-foreground text-background font-medium"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === "unread"
                  ? "bg-foreground text-background font-medium"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto no-scrollbar overscroll-contain divide-y divide-border/40">
          {loading && notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin mx-auto text-accent mb-2" />
              <p className="text-xs">Fetching updates…</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="py-12 px-6 text-center text-muted-foreground">
              <div className="size-11 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Check className="size-5 text-muted-foreground" />
              </div>
              <p className="font-display text-base text-foreground">All caught up</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {filter === "unread"
                  ? "You have no unread notifications."
                  : "No platform alerts or session notifications yet."}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`p-4 flex items-start gap-3.5 hover:bg-secondary/40 transition-colors cursor-pointer group relative ${
                  !n.is_read ? "bg-accent/5" : ""
                }`}
              >
                {/* Type Icon */}
                <div className="size-9 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {getTypeIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs truncate ${
                        !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/85"
                      }`}
                    >
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {getRelativeTime(n.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {/* Unread indicator */}
                {!n.is_read && (
                  <span
                    className="size-2 rounded-full bg-accent shrink-0 mt-2 self-start"
                    title="Unread"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Grounding footer */}
        {notifications.length > 0 && (
          <div className="py-2.5 px-4 text-center border-t border-border/50 bg-secondary/15">
            <span className="text-[11px] text-muted-foreground/80 font-mono tracking-wide">
              {filter === "unread"
                ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
                : `Showing latest ${notifications.length} updates`}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
