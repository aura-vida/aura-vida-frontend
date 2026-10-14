import { useEffect, useState } from "react";
import {
  getAdminDashboardSummary,
  reconcilePayments,
  type AdminDashboardSummary
} from "@/lib/adminApi";
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Clock, 
  Sparkles, 
  Building2, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export default function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await getAdminDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load admin summary:", err);
      toast.error(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const result = await reconcilePayments();
      const anomalyCount = result.anomalies.filter((a) => a.type !== "auto_fixed").length;
      if (result.autoFixed > 0 || anomalyCount > 0) {
        toast.message(
          `Reconciled last 48h: ${result.matched} matched, ${result.autoFixed} auto-fixed, ${anomalyCount} need review.`,
          { description: "Check the server logs for the full anomaly list." }
        );
      } else {
        toast.success(`All clear — ${result.matched} payments matched Razorpay for the last 48 hours.`);
      }
      if (result.autoFixed > 0) fetchSummary();
    } catch (err: any) {
      toast.error(err.message || "Failed to reconcile with Razorpay");
    } finally {
      setReconciling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Top Banner / Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-card border border-border shadow-soft">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl text-foreground">Kuśala Platform Pulse</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time platform metrics, user registrations, and booking operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Systems Active
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={loading}
            className="rounded-full h-8 px-3 text-xs"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="p-6 rounded-[2rem] bg-card border border-border shadow-soft hover:shadow-elegant transition-smooth">
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-medium uppercase tracking-widest text-accent">Total Revenue</span>
            <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="font-display text-3xl text-foreground">
            {loading ? "…" : formatCurrency(summary?.totalRevenueInr || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Settled client payments across all modalities
          </p>
          <button
            type="button"
            onClick={handleReconcile}
            disabled={reconciling}
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`size-3 ${reconciling ? "animate-spin" : ""}`} />
            {reconciling ? "Reconciling with Razorpay…" : "Reconcile with Razorpay (last 48h)"}
          </button>
        </div>

        {/* Registered Users */}
        <div 
          onClick={() => onNavigateTab("users")}
          className="p-6 rounded-[2rem] bg-card border border-border shadow-soft hover:shadow-elegant hover:border-primary/40 cursor-pointer transition-smooth group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-medium uppercase tracking-widest text-accent">Total Users</span>
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-3xl text-foreground">
              {loading ? "…" : (summary?.totalUsers || 0).toLocaleString()}
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Clients, practitioners, and registered profiles
          </p>
        </div>

        {/* Confirmed Sessions */}
        <div 
          onClick={() => onNavigateTab("appointments")}
          className="p-6 rounded-[2rem] bg-card border border-border shadow-soft hover:shadow-elegant hover:border-primary/40 cursor-pointer transition-smooth group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-medium uppercase tracking-widest text-accent">Confirmed</span>
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-3xl text-foreground">
              {loading ? "…" : (summary?.confirmedBookings || 0).toLocaleString()}
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Active scheduled and completed appointments
          </p>
        </div>

        {/* Pending Bookings */}
        <div 
          onClick={() => onNavigateTab("appointments")}
          className="p-6 rounded-[2rem] bg-card border border-border shadow-soft hover:shadow-elegant hover:border-amber-500/40 cursor-pointer transition-smooth group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">Needs Action</span>
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-3xl text-amber-600 dark:text-amber-400">
              {loading ? "…" : (summary?.pendingBookings || 0).toLocaleString()}
            </div>
            {(summary?.pendingBookings || 0) > 0 && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Pending
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Appointments awaiting client payment or confirmation
          </p>
        </div>
      </div>

      {/* Secondary Resource Metrics & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guides Overview Card */}
        <div className="p-6 rounded-[2rem] bg-card border border-border shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">The Guides</span>
              <Sparkles className="size-4 text-accent" />
            </div>
            <h3 className="font-display text-2xl text-foreground">
              {loading ? "…" : summary?.totalPractitioners || 0} Vetted Guides
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Curated holistic practitioners across sound therapy, energy healing, acupuncture, and breathwork.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigateTab("practitioners")}
            className="rounded-full mt-6 w-full justify-between hover:bg-secondary text-xs"
          >
            Manage Practitioners
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>

        {/* Space Listings Overview */}
        <div className="p-6 rounded-[2rem] bg-card border border-border shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Sanctuaries</span>
              <Building2 className="size-4 text-accent" />
            </div>
            <h3 className="font-display text-2xl text-foreground">
              {loading ? "…" : summary?.totalSpaces || 0} Partner Spaces
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Physical wellness studios and partner host spaces approved for hosting healing sessions.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigateTab("spaces")}
            className="rounded-full mt-6 w-full justify-between hover:bg-secondary text-xs"
          >
            Review Space Applications
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>

        {/* User Account Access & Governance */}
        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-medium">Access Control</span>
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <h3 className="font-display text-2xl text-foreground">
              Client &amp; User Directory
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Instantly toggle active/inactive status for any client account. Deactivated accounts are blocked from logging in.
            </p>
          </div>
          <Button
            onClick={() => onNavigateTab("users")}
            className="rounded-full mt-6 w-full justify-between bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-soft"
          >
            Open User Directory
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
