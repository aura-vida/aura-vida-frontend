import { useEffect, useState } from "react";
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  User, 
  Calendar, 
  Video, 
  MapPin, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  getAdminReviews, 
  updateAdminReviewStatus, 
  type AdminReview 
} from "@/lib/adminApi";
import AuraPagination from "@/components/aura/AuraPagination";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "all", label: "All Reviews" },
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
] as const;

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const fetchReviews = async (targetPage = page, targetStatus = statusFilter, targetRating = ratingFilter) => {
    setLoading(true);
    try {
      const res = await getAdminReviews({
        status: targetStatus !== "all" ? targetStatus : undefined,
        rating: targetRating,
        page: targetPage,
        limit: 15,
      });
      setReviews(res.reviews || []);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err: any) {
      console.error("Failed to load admin reviews:", err);
      toast.error(err.message || "Failed to load customer reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, statusFilter, ratingFilter);
  }, [page, statusFilter, ratingFilter]);

  const handleUpdateStatus = async (reviewId: string, newStatus: "approved" | "rejected" | "pending") => {
    setActionBusyId(reviewId);
    try {
      await updateAdminReviewStatus(reviewId, newStatus);
      toast.success(`Review ${newStatus === "approved" ? "approved" : newStatus === "rejected" ? "rejected" : "updated"}`);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update review status");
    } finally {
      setActionBusyId(null);
    }
  };

  // Calculate average rating across current loaded reviews
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-card border border-border shadow-soft">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Star className="size-5 fill-accent text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl text-foreground">Customer Reviews & Ratings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified client reviews and feedback submitted after completed wellness sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Reviews</span>
            <div className="font-display text-xl text-foreground">{totalCount}</div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchReviews(page, statusFilter, ratingFilter)}
            disabled={loading}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Refresh reviews"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setPage(1);
              }}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-medium transition-smooth",
                statusFilter === f.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Stars:</span>
          {[undefined, 5, 4, 3, 2, 1].map((r) => (
            <button
              key={r ?? "all"}
              onClick={() => {
                setRatingFilter(r);
                setPage(1);
              }}
              className={cn(
                "h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1",
                ratingFilter === r
                  ? "bg-accent text-accent-foreground border-accent font-semibold"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {r ? (
                <>
                  <span>{r}</span>
                  <Star className="size-3 fill-current" />
                </>
              ) : (
                "All"
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <RefreshCw className="size-6 animate-spin mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <MessageSquare className="size-8 mx-auto text-muted-foreground mb-3 opacity-60" />
          <p className="font-display text-xl text-foreground">No reviews found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter !== "all" || ratingFilter
              ? "No reviews match the selected filter criteria."
              : "Customers will be able to review their sessions once completed."}
          </p>
        </div>
      ) : (
        <div className={cn("space-y-4 transition-opacity duration-200", loading && "opacity-60 pointer-events-none")}>
          {reviews.map((r) => {
            const isApproved = r.status === "approved";
            const isPending = r.status === "pending";
            const isRejected = r.status === "rejected";

            return (
              <article
                key={r.id}
                className="p-6 rounded-[2rem] bg-card border border-border shadow-soft space-y-4 hover:border-primary/30 transition-smooth"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Client & Practitioner Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="size-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-display text-xs text-accent font-bold">
                        {(r.client?.full_name || "C")[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-foreground text-sm">
                          {r.client?.full_name || "Verified Customer"}
                        </span>
                        {r.client?.email && (
                          <span className="text-xs text-muted-foreground ml-2">({r.client.email})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pl-10.5">
                      Practitioner:{" "}
                      <strong className="text-foreground">
                        {r.practitioners?.name || r.practitioners?.slug || "Unknown Practitioner"}
                      </strong>
                    </div>
                  </div>

                  {/* Status Badge & Rating */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "size-4",
                            star <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                      <span className="text-xs font-semibold text-foreground ml-1">{r.rating}.0</span>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full",
                        isApproved && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
                        isPending && "border-amber-500/30 bg-amber-500/10 text-amber-700",
                        isRejected && "border-rose-500/30 bg-rose-500/10 text-rose-700"
                      )}
                    >
                      {r.status}
                    </Badge>
                  </div>
                </div>

                {/* Review Written Feedback */}
                {r.comment ? (
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 text-sm text-foreground/90 leading-relaxed italic">
                    "{r.comment}"
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    (No written comments left by customer - star rating only)
                  </div>
                )}

                {/* Footer Details & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      <span>Reviewed on {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {r.booking && (
                      <span className="text-[11px] text-muted-foreground/80">
                        · Session mode: {r.booking.mode}
                      </span>
                    )}
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(r.id, "approved")}
                        disabled={actionBusyId === r.id}
                        className="rounded-full h-8 px-3 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-500/30"
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        Approve
                      </Button>
                    )}

                    {!isRejected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(r.id, "rejected")}
                        disabled={actionBusyId === r.id}
                        className="rounded-full h-8 px-3 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle className="size-3 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <AuraPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={15}
        itemName="reviews"
        disabled={loading}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}

