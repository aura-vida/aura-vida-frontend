import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Building2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AuraPagination from "@/components/aura/AuraPagination";
import {
  adminListSpaces,
  adminCreateSpace,
  adminUpdateSpace,
  adminUpdateSpaceStatus,
  adminDeleteSpace,
  type Space,
} from "@/lib/spacesApi";
import ConfirmDialog from "@/components/aura/ConfirmDialog";

const STATUS_CONFIG: Record<
  Space["status"],
  { label: string; badgeClass: string; dotClass: string }
> = {
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  new: {
    label: "New",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  contacted: {
    label: "Contacted",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  declined: {
    label: "Declined",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
};

const blankSpace = (): Partial<Space> => ({
  space_name: "",
  space_type: "",
  contact_name: "",
  email: "",
  phone: "",
  city: "",
  pin: "",
  capacity: 10,
  address: "",
  amenities: [],
  availability: "",
  notes: "",
  status: "approved",
});

const SpaceListingsAdmin = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // UI Expand / Edit states
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  const [editedSpaces, setEditedSpaces] = useState<Record<string, Partial<Space>>>({});

  // Create Space Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSpace, setNewSpace] = useState<Partial<Space>>(blankSpace());
  const [newAmenitiesStr, setNewAmenitiesStr] = useState("");

  const loadSpaces = useCallback(
    async (targetPage = page, searchTerm = search, status = statusFilter) => {
      setLoading(true);
      try {
        const res = await adminListSpaces({
          page: targetPage,
          limit,
          search: searchTerm.trim() || undefined,
          status: status || undefined,
        });
        setSpaces(res.spaces || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);

        // Reset edited buffers
        const initEdits: Record<string, Partial<Space>> = {};
        (res.spaces || []).forEach((s) => {
          initEdits[s.id] = { ...s };
        });
        setEditedSpaces(initEdits);
      } catch (err: any) {
        console.error("Failed to load spaces:", err);
        toast.error(err.message || "Failed to load partner spaces");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter]
  );

  useEffect(() => {
    loadSpaces(page, search, statusFilter);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    loadSpaces(1, search, statusFilter);
  };

  const toggleExpand = (id: string) => {
    setExpandedSpaces((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateEditField = (id: string, fields: Partial<Space>) => {
    setEditedSpaces((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...fields,
      },
    }));
  };

  // Quick status update button
  const handleQuickStatus = async (id: string, newStatus: Space["status"]) => {
    try {
      setBusy(true);
      await adminUpdateSpaceStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setSpaces((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      updateEditField(id, { status: newStatus });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  // Save changes to a space card
  const handleSaveSpace = async (id: string) => {
    const spaceData = editedSpaces[id];
    if (!spaceData) return;

    if (!spaceData.space_name?.trim()) {
      toast.error("Space name is required");
      return;
    }
    if (!spaceData.address?.trim() || !spaceData.city?.trim() || !spaceData.pin?.trim()) {
      toast.error("Address, city, and PIN code are required");
      return;
    }

    try {
      setBusy(true);
      const res = await adminUpdateSpace(id, spaceData);
      toast.success(res.message || "Space updated successfully");
      setSpaces((prev) => prev.map((s) => (s.id === id ? res.space : s)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update space");
    } finally {
      setBusy(false);
    }
  };

  const [spaceDeleteTarget, setSpaceDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSpace, setIsDeletingSpace] = useState(false);

  // Delete space
  const handleDeleteSpace = (id: string, name: string) => {
    setSpaceDeleteTarget({ id, name });
  };

  const handleConfirmDeleteSpace = async () => {
    if (!spaceDeleteTarget) return;

    try {
      setIsDeletingSpace(true);
      await adminDeleteSpace(spaceDeleteTarget.id);
      toast.success(`Space "${spaceDeleteTarget.name}" deleted successfully`);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceDeleteTarget.id));
      setTotalCount((c) => Math.max(0, c - 1));
      setSpaceDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete space");
    } finally {
      setIsDeletingSpace(false);
    }
  };

  // Create new space
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpace.space_name?.trim()) {
      toast.error("Space name is required");
      return;
    }
    if (!newSpace.address?.trim() || !newSpace.city?.trim() || !newSpace.pin?.trim()) {
      toast.error("Address, city, and PIN code are required");
      return;
    }

    try {
      setBusy(true);
      const amenitiesArr = newAmenitiesStr
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await adminCreateSpace({
        ...newSpace,
        amenities: amenitiesArr,
      });

      toast.success(res.message || "Partner space created!");
      setIsAddOpen(false);
      setNewSpace(blankSpace());
      setNewAmenitiesStr("");
      setPage(1);
      loadSpaces(1, search, statusFilter);
    } catch (err: any) {
      toast.error(err.message || "Failed to create space");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-foreground">Partner Spaces & Sanctuaries</h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Vetted sanctuaries, studios, and rooms where clients book in-person sessions with practitioners.
            </p>
          </div>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 shadow-soft"
          >
            <Plus className="size-4 mr-1.5" />
            Add Partner Space
          </Button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search space name, city, PIN…"
              className="rounded-full h-10 pl-9 pr-4 text-sm w-64 bg-card border-border"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-full h-10 px-4 text-sm border border-input bg-card text-foreground appearance-none pr-8 cursor-pointer shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved only</option>
            <option value="new">New only</option>
            <option value="contacted">Contacted only</option>
            <option value="declined">Declined only</option>
          </select>

          <Button
            variant="outline"
            className="rounded-full h-10 px-5 text-sm"
            onClick={() => handleSearchSubmit()}
            disabled={loading}
          >
            Filter
          </Button>
        </div>
      </div>

      {/* Spaces List or Empty State */}
      {loading && spaces.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading partner spaces…</p>
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <Building2 className="size-10 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="font-display text-xl text-foreground">No partner spaces found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter
              ? "No spaces match your filter criteria. Try clearing search filters."
              : "No partner spaces have been added yet. Click '+ Add Partner Space' to create one."}
          </p>
          {(search || statusFilter) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
                loadSpaces(1, "", "");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cn("space-y-3.5 transition-opacity duration-200", busy && "opacity-60 pointer-events-none")}>
          {spaces.map((space) => {
            const isExpanded = !!expandedSpaces[space.id];
            const edited = editedSpaces[space.id] || space;
            const statusMeta = STATUS_CONFIG[space.status] || STATUS_CONFIG.new;

            return (
              <section
                key={space.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 bg-card overflow-hidden",
                  isExpanded ? "border-primary/50 shadow-medium" : "border-border shadow-xs hover:border-foreground/30"
                )}
              >
                {/* Collapsed Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="size-11 rounded-xl bg-secondary/80 border border-border grid place-items-center shrink-0 text-accent">
                      <Building2 className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-lg text-foreground truncate">
                          {space.space_name}
                        </h3>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1.5",
                            statusMeta.badgeClass
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", statusMeta.dotClass)} />
                          {statusMeta.label}
                        </span>
                        {space.space_type && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                            {space.space_type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-accent" />
                          {[space.city, space.pin].filter(Boolean).join(" · ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3 text-accent" />
                          Capacity: {space.capacity}
                        </span>
                        {space.contact_name && (
                          <span>Contact: {space.contact_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 px-3 text-xs gap-1.5 text-foreground bg-card hover:bg-secondary hover:text-foreground border-border/80 transition-smooth"
                      onClick={() => toggleExpand(space.id)}
                    >
                      <Pencil className="size-3 text-accent" />
                      <span>{isExpanded ? "Close" : "Edit"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-8 text-destructive hover:bg-destructive/15 hover:text-destructive transition-smooth"
                      onClick={() => handleDeleteSpace(space.id, space.space_name)}
                      aria-label="Delete space"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-8 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
                      onClick={() => toggleExpand(space.id)}
                      aria-label="Expand space"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Card Edit Form */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/15 p-5 sm:p-6 space-y-5 animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Space Name *</Label>
                        <Input
                          value={edited.space_name || ""}
                          onChange={(e) => updateEditField(space.id, { space_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Space Type</Label>
                        <Input
                          value={edited.space_type || ""}
                          onChange={(e) => updateEditField(space.id, { space_type: e.target.value })}
                          placeholder="e.g. Yoga Studio, Meditation Hall"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Capacity (Guests)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={edited.capacity || 1}
                          onChange={(e) => updateEditField(space.id, { capacity: Number(e.target.value) || 1 })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Contact Person</Label>
                        <Input
                          value={edited.contact_name || ""}
                          onChange={(e) => updateEditField(space.id, { contact_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Contact Email</Label>
                        <Input
                          type="email"
                          value={edited.email || ""}
                          onChange={(e) => updateEditField(space.id, { email: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Contact Phone</Label>
                        <Input
                          value={edited.phone || ""}
                          onChange={(e) => updateEditField(space.id, { phone: e.target.value })}
                          placeholder="+91..."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">City *</Label>
                        <Input
                          value={edited.city || ""}
                          onChange={(e) => updateEditField(space.id, { city: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">PIN Code *</Label>
                        <Input
                          value={edited.pin || ""}
                          onChange={(e) => updateEditField(space.id, { pin: e.target.value })}
                          placeholder="e.g. 400050"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Status</Label>
                        <select
                          value={edited.status || "approved"}
                          onChange={(e) => updateEditField(space.id, { status: e.target.value as Space["status"] })}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs cursor-pointer"
                        >
                          <option value="approved">Approved</option>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Full Address *</Label>
                        <Input
                          value={edited.address || ""}
                          onChange={(e) => updateEditField(space.id, { address: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Amenities (Comma separated)</Label>
                        <Input
                          value={
                            Array.isArray(edited.amenities)
                              ? edited.amenities.join(", ")
                              : edited.amenities || ""
                          }
                          onChange={(e) =>
                            updateEditField(space.id, {
                              amenities: e.target.value.split(",").map((a) => a.trim()).filter(Boolean),
                            })
                          }
                          placeholder="e.g. Yoga mats, Bolsters, AC, Sound bowls, Changing rooms"
                          className="mt-1"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Availability schedule</Label>
                        <Input
                          value={edited.availability || ""}
                          onChange={(e) => updateEditField(space.id, { availability: e.target.value })}
                          placeholder="e.g. Mon-Fri 7am - 8pm, Weekends by appointment"
                          className="mt-1"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Internal Notes / Space Instructions</Label>
                        <Textarea
                          rows={2}
                          value={edited.notes || ""}
                          onChange={(e) => updateEditField(space.id, { notes: e.target.value })}
                          placeholder="Private notes, host access details, or client parking directions..."
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Card Footer: Quick Status Switcher & Save Button */}
                    <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-1">Quick status:</span>
                        {(["new", "contacted", "approved", "declined"] as Space["status"][]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={space.status === st ? "default" : "outline"}
                            className="rounded-full h-7 px-3 text-[11px] capitalize"
                            onClick={() => handleQuickStatus(space.id, st)}
                            disabled={busy}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full h-9 px-4 text-xs"
                          onClick={() => toggleExpand(space.id)}
                        >
                          Close
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full h-9 px-5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleSaveSpace(space.id)}
                          disabled={busy}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="pt-2">
          <AuraPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
            onPageChange={setPage}
            disabled={loading || busy}
          />
        </div>
      )}

      {/* Create New Partner Space Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add New Partner Space</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Create an approved or candidate sanctuary location where practitioners host sessions.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateSpace} className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="add-name">Space Name *</Label>
              <Input
                id="add-name"
                required
                value={newSpace.space_name}
                onChange={(e) => setNewSpace((p) => ({ ...p, space_name: e.target.value }))}
                placeholder="e.g. Zen Sanctuary Bandra"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-type">Space Type</Label>
              <Input
                id="add-type"
                value={newSpace.space_type || ""}
                onChange={(e) => setNewSpace((p) => ({ ...p, space_type: e.target.value }))}
                placeholder="e.g. Yoga Studio, Sound Hall"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-cap">Capacity (People)</Label>
              <Input
                id="add-cap"
                type="number"
                min="1"
                value={newSpace.capacity}
                onChange={(e) => setNewSpace((p) => ({ ...p, capacity: Number(e.target.value) || 10 }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-contact">Contact Person</Label>
              <Input
                id="add-contact"
                value={newSpace.contact_name}
                onChange={(e) => setNewSpace((p) => ({ ...p, contact_name: e.target.value }))}
                placeholder="e.g. Rohan Sharma"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={newSpace.email}
                onChange={(e) => setNewSpace((p) => ({ ...p, email: e.target.value }))}
                placeholder="host@sanctuary.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-city">City *</Label>
              <Input
                id="add-city"
                required
                value={newSpace.city}
                onChange={(e) => setNewSpace((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-pin">6-digit PIN Code *</Label>
              <Input
                id="add-pin"
                required
                value={newSpace.pin}
                onChange={(e) => setNewSpace((p) => ({ ...p, pin: e.target.value }))}
                placeholder="e.g. 400050"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="add-addr">Full Address *</Label>
              <Input
                id="add-addr"
                required
                value={newSpace.address}
                onChange={(e) => setNewSpace((p) => ({ ...p, address: e.target.value }))}
                placeholder="e.g. 14 Perry Cross Road, Bandra West"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="add-amen">Amenities (Comma separated)</Label>
              <Input
                id="add-amen"
                value={newAmenitiesStr}
                onChange={(e) => setNewAmenitiesStr(e.target.value)}
                placeholder="e.g. Mats, Bolsters, AC, Sound System, Restrooms"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="add-notes">Internal Notes</Label>
              <Textarea
                id="add-notes"
                rows={2}
                value={newSpace.notes || ""}
                onChange={(e) => setNewSpace((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any special host or parking guidelines..."
                className="mt-1"
              />
            </div>

            <DialogFooter className="sm:col-span-2 pt-4 border-t border-border mt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy}>
                {busy ? "Saving…" : "Create Partner Space"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Delete Space */}
      <ConfirmDialog
        open={!!spaceDeleteTarget}
        onOpenChange={(open) => !open && setSpaceDeleteTarget(null)}
        title={spaceDeleteTarget ? `Delete "${spaceDeleteTarget.name}"?` : "Delete Partner Space"}
        description={`Are you sure you want to delete "${spaceDeleteTarget?.name}"? This action cannot be undone and will permanently remove this partner location from the platform.`}
        confirmLabel="Yes, Delete Space"
        cancelLabel="Keep Space"
        variant="destructive"
        isLoading={isDeletingSpace}
        onConfirm={handleConfirmDeleteSpace}
      />
    </div>
  );
};

export default SpaceListingsAdmin;
