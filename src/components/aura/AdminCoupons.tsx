import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronDown, Tag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  type Coupon,
} from "@/lib/couponsApi";

const emptyDraft = () => ({
  code: "",
  discount_percent: 0,
  first_booking_only: true,
  min_booking_amount_inr: "" as string | number,
});

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  const load = () => {
    setLoading(true);
    adminListCoupons()
      .then((res) => setCoupons(res.coupons))
      .catch((err: any) => {
        console.error("Failed to load coupons:", err);
        toast.error(err.message || "Failed to load coupons");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const update = (id: string, patch: Partial<Coupon>) => {
    setCoupons((curr) => curr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addNew = async () => {
    const code = draft.code.trim().toUpperCase();
    if (!code) {
      toast.error("Code is required");
      return;
    }
    // 0 is allowed on purpose — a coupon can carry only eligibility rules
    // (e.g. a minimum booking amount) without discounting anything.
    if (draft.discount_percent < 0 || draft.discount_percent > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }
    try {
      const res = await adminCreateCoupon({
        code,
        discount_percent: draft.discount_percent,
        is_active: true,
        first_booking_only: draft.first_booking_only,
        min_booking_amount_inr: draft.min_booking_amount_inr === "" ? null : Number(draft.min_booking_amount_inr),
      });
      setCoupons((curr) => [res.coupon, ...curr]);
      setIsAddOpen(false);
      setDraft(emptyDraft());
      toast.success(`${res.coupon.code} created!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    }
  };

  const save = async (row: Coupon) => {
    setBusy(true);
    try {
      const res = await adminUpdateCoupon(row.id, {
        code: row.code,
        discount_percent: row.discount_percent,
        is_active: row.is_active,
        first_booking_only: row.first_booking_only,
        min_booking_amount_inr: row.min_booking_amount_inr,
      });
      update(row.id, res.coupon);
      toast.success(`${res.coupon.code} saved`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Coupon) => {
    if (!confirm(`Delete coupon ${row.code}? This cannot be undone.`)) return;
    try {
      await adminDeleteCoupon(row.id);
      setCoupons((curr) => curr.filter((c) => c.id !== row.id));
      toast.success("Coupon deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  if (loading) return <div className="text-muted-foreground py-8">Loading coupons...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4">
        <p className="text-muted-foreground text-sm max-w-lg">
          Create and manage promo codes, with configurable eligibility rules — restrict to a
          customer's first booking, require a minimum booking amount, or both.
        </p>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-full shrink-0">
          <Plus className="size-4 mr-1" /> Add Coupon
        </Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Coupon</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Code</Label>
              <Input
                value={draft.code}
                onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
                placeholder="e.g. LAUNCH30"
                className="uppercase placeholder:normal-case"
              />
            </div>
            <div>
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={draft.discount_percent}
                onChange={(e) => setDraft((d) => ({ ...d, discount_percent: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">0 is fine — a coupon can carry only eligibility rules with no discount.</p>
            </div>
            <div>
              <Label>Minimum booking amount (₹, optional)</Label>
              <Input
                type="number"
                min="0"
                placeholder="No minimum"
                value={draft.min_booking_amount_inr}
                onChange={(e) => setDraft((d) => ({ ...d, min_booking_amount_inr: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={draft.first_booking_only}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, first_booking_only: v }))}
              />
              First booking only
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={addNew}>Save Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {coupons.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          No coupons yet. Click "Add Coupon" to create your first one.
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((row) => {
            const isExpanded = !!expanded[row.id];
            return (
              <section key={row.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-4 min-w-0 cursor-pointer flex-1"
                    onClick={() => toggleExpanded(row.id)}
                  >
                    <div className="size-12 rounded-2xl bg-accent/10 text-accent grid place-items-center shrink-0 border border-accent/20">
                      <Tag className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-lg sm:text-xl text-foreground font-medium tracking-wide">
                          {row.code}
                        </h3>
                        {row.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {Number(row.discount_percent)}% off
                        {row.first_booking_only ? " · first booking only" : ""}
                        {row.min_booking_amount_inr ? ` · min. ₹${Number(row.min_booking_amount_inr).toLocaleString("en-IN")} booking` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9 px-3.5 gap-1.5 text-xs text-foreground hover:bg-secondary border-border/80"
                      onClick={() => toggleExpanded(row.id)}
                    >
                      <Pencil className="size-3.5 text-accent" />
                      <span>{isExpanded ? "Close" : "Edit"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-9 text-destructive hover:bg-destructive/10"
                      onClick={() => remove(row)}
                      aria-label={`Delete ${row.code}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      onClick={() => toggleExpanded(row.id)}
                      aria-label={isExpanded ? "Collapse card" : "Expand card"}
                    >
                      <ChevronDown className={cn("size-4.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-border animate-in fade-in-50 duration-200">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Code</Label>
                        <Input
                          value={row.code}
                          onChange={(e) => update(row.id, { code: e.target.value.toUpperCase() })}
                          className="uppercase"
                        />
                      </div>
                      <div>
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={row.discount_percent}
                          onChange={(e) => update(row.id, { discount_percent: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Minimum booking amount (₹, optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="No minimum"
                          value={row.min_booking_amount_inr ?? ""}
                          onChange={(e) => update(row.id, { min_booking_amount_inr: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1 border-t border-border mt-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={row.is_active}
                            onCheckedChange={(v) => update(row.id, { is_active: v })}
                          />
                          Active
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={row.first_booking_only}
                            onCheckedChange={(v) => update(row.id, { first_booking_only: v })}
                          />
                          First booking only
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          <Button variant="outline" className="rounded-full" onClick={() => toggleExpanded(row.id)}>
                            Close
                          </Button>
                          <Button className="rounded-full" disabled={busy} onClick={() => save(row)}>Save</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
