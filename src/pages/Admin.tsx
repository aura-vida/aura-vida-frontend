import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminCreateService, adminUpdateService, adminDeleteService } from "@/lib/servicesApi";
import { useServices } from "@/hooks/useServices";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Nav from "@/components/aura/Nav";
import SpaceListingsAdmin from "@/components/aura/SpaceListingsAdmin";
import { adminCreatePractitioner, adminUpdatePractitioner, adminDeletePractitioner, adminApprovePractitioner, adminListPractitioners, listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import AdminAppointments from "@/components/aura/AdminAppointments";




const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

const blank = (order: number): Omit<Practitioner, "id"> => ({
  slug: "",
  name: "",
  craft: "",
  city: "",
  rating: 5,
  sessions: 0,
  price_inr: 0,
  image_url: null,
  bio: "",
  sort_order: order,
  is_published: false,
  bookable: false,
  offers_centre: true,
  offers_host: false,
  offers_online: false,
});

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Practitioner[]>([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState<string>(""); // "" | "true" | "false"
  const [filterBookable, setFilterBookable] = useState<string>("");   // "" | "true" | "false"
  const [viewApplicant, setViewApplicant] = useState<Practitioner | null>(null);
  const [approving, setApproving] = useState(false);




  useEffect(() => {
    if (!user) return;
    setIsAdmin(profile?.role === "admin");
  }, [user, profile]);

  const load = async (p = page, q = searchTerm, pub = filterPublished, bk = filterBookable) => {
    setBusy(true);
    try {
      const data = await adminListPractitioners({
        limit: 10,
        page: p,
        search: q || undefined,
        ...(pub !== "" ? { is_published: pub === "true" } : {}),
      });
      setRows(data.practitioners);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load practitioners");
    } finally {
      setBusy(false);
    }
  };

  // Pending applications (not yet approved)
  const pendingApplicants = rows.filter(r => r.application_status === 'pending');
  const approvedRows = rows.filter(r => r.application_status !== 'pending');

  useEffect(() => {
    if (isAdmin) {
      load(page, searchTerm);
    }
  }, [isAdmin]);





  const update = (id: string, patch: Partial<Practitioner>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const save = async (row: Practitioner) => {
    setBusy(true);
    const { id, ...fields } = row;
    try {
      await adminUpdatePractitioner(id!, fields);
      toast.success(`${row.name || "Profile"} saved`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  const [isAddPractitionerOpen, setIsAddPractitionerOpen] = useState(false);
  const [newPractitioner, setNewPractitioner] = useState({
    name: "",
    craft: "",
    city: "",
    rating: 5,
    sessions: 0,
    price_inr: 1500,
    bio: "",
  });

  const addNew = async () => {
    if (!newPractitioner.name.trim()) { toast.error("Name is required"); return; }

    const draft = blank(rows.length + 1);
    const slug = newPractitioner.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      const data = await adminCreatePractitioner({
        ...draft,
        slug,
        name: newPractitioner.name.trim(),
        craft: newPractitioner.craft.trim(),
        city: newPractitioner.city.trim(),
        rating: Number(newPractitioner.rating) || 5,
        sessions: Number(newPractitioner.sessions) || 0,
        price_inr: Number(newPractitioner.price_inr) || 0,
        bio: newPractitioner.bio.trim(),
        is_published: true,
        bookable: true,
      });
      setRows((r) => [data.practitioner, ...r]);
      setIsAddPractitionerOpen(false);
      setNewPractitioner({
        name: "",
        craft: "",
        city: "",
        rating: 5,
        sessions: 0,
        price_inr: 1500,
        bio: "",
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success("Practitioner created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create practitioner");
    }
  };

  const remove = async (row: Practitioner) => {
    if (!confirm(`Remove ${row.name}?`)) return;
    try {
      await adminDeletePractitioner(row.id!);
      setRows((r) => r.filter((x) => x.id !== row.id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const uploadPhoto = async (row: Practitioner, file: File) => {
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${row.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("practitioner-photos")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setBusy(false);
      toast.error(upErr.message);
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("practitioner-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    setBusy(false);
    if (signErr || !signed) {
      toast.error(signErr?.message ?? "Could not create photo link");
      return;
    }
    update(row.id, { image_url: signed.signedUrl });
    await adminUpdatePractitioner(row.id, { image_url: signed.signedUrl });
    toast.success("Photo updated");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-3">Please sign in</h1>
          <Button asChild className="rounded-full"><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl mb-3">Admins only</h1>
          <p className="text-muted-foreground">This account doesn't have access to the practitioner manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <Tabs defaultValue="appointments" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Admin Dashboard</span>
              <h1 className="font-display text-4xl mt-3">Platform Management</h1>
            </div>
            <TabsList className="grid w-full sm:w-[500px] grid-cols-3 rounded-full p-1 bg-secondary border border-border">
              <TabsTrigger value="appointments" className="rounded-full">Appointments</TabsTrigger>
              <TabsTrigger value="practitioners" className="rounded-full">Practitioners</TabsTrigger>
              <TabsTrigger value="services" className="rounded-full">Services</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="appointments" className="mt-0">
            <AdminAppointments />
          </TabsContent>

          <TabsContent value="practitioners" className="mt-0">
            {/* Header row: description + search + add button */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm max-w-md">
                  All practitioners (including drafts &amp; pending applicants).
                </p>
                <Button onClick={() => setIsAddPractitionerOpen(true)} className="rounded-full shrink-0">
                  <Plus className="size-4 mr-1" /> Add Practitioner
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(1, searchTerm, filterPublished, filterBookable); } }}
                    placeholder="Search by name…"
                    className="rounded-full h-10 pl-9 pr-4 text-sm w-52"
                  />
                </div>
                <select
                  value={filterPublished}
                  onChange={(e) => { setFilterPublished(e.target.value); setPage(1); load(1, searchTerm, e.target.value, filterBookable); }}
                  className="rounded-full h-10 px-4 text-sm border border-input bg-background text-foreground appearance-none pr-8 cursor-pointer"
                >
                  <option value="">All published</option>
                  <option value="true">Published only</option>
                  <option value="false">Draft only</option>
                </select>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-5 text-sm shrink-0"
                  onClick={() => { setPage(1); load(1, searchTerm, filterPublished, filterBookable); }}
                  disabled={busy}
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Pending Applications from Apply form */}
            {pendingApplicants.length > 0 && (
              <div className="mb-8 rounded-3xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-6">
                <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-4">⏳ Pending Applications ({pendingApplicants.length})</h3>
                <div className="space-y-2.5">
                  {pendingApplicants.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{row.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[row.craft, row.city].filter(Boolean).join(' · ')}
                          {row.application_email && <span> · 📧 {row.application_email}</span>}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-8 px-4 text-xs shrink-0"
                        onClick={() => setViewApplicant(row)}
                      >
                        View Application
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant Detail Modal */}
            <Dialog open={!!viewApplicant} onOpenChange={(o) => !o && setViewApplicant(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">{viewApplicant?.name}</DialogTitle>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Pending Application</p>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Modality</span><p className="font-medium mt-0.5">{viewApplicant?.craft || '—'}</p></div>
                    <div><span className="text-muted-foreground text-xs uppercase tracking-wider">City</span><p className="font-medium mt-0.5">{viewApplicant?.city || '—'}</p></div>
                    <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Price / session</span><p className="font-medium mt-0.5">₹{viewApplicant?.price_inr?.toLocaleString("en-IN")}</p></div>
                    <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Sessions completed</span><p className="font-medium mt-0.5">{viewApplicant?.sessions ?? 0}</p></div>
                    <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Rating</span><p className="font-medium mt-0.5">{viewApplicant?.rating}</p></div>
                    <div><span className="text-muted-foreground text-xs uppercase tracking-wider">Email</span><p className="font-medium mt-0.5 break-all">{viewApplicant?.application_email || '—'}</p></div>
                  </div>
                  {viewApplicant?.bio && (
                    <div className="rounded-2xl bg-secondary/60 p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">About</p>
                      <p className="text-sm leading-relaxed">{viewApplicant.bio}</p>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => setViewApplicant(null)}>Close</Button>
                  <Button
                    className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 px-6"
                    disabled={approving}
                    onClick={async () => {
                      if (!viewApplicant?.id) return;
                      setApproving(true);
                      try {
                        const res = await adminApprovePractitioner(viewApplicant.id);
                        toast.success(`✅ ${viewApplicant.name} approved! Invite sent to ${res.email}`);
                        setViewApplicant(null);
                        load();
                      } catch (err: any) {
                        toast.error(err.message || "Failed to approve");
                      } finally {
                        setApproving(false);
                      }
                    }}
                  >
                    {approving ? "Approving…" : "Approve & Send Invite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddPractitionerOpen} onOpenChange={setIsAddPractitionerOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Practitioner</DialogTitle>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Name</Label>
                    <Input
                      value={newPractitioner.name}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Dr. Shah"
                    />
                  </div>
                  <div>
                    <Label>Modality / title</Label>
                    <Input
                      value={newPractitioner.craft}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, craft: e.target.value }))}
                      placeholder="e.g. Yoga Therapist"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={newPractitioner.city}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={newPractitioner.rating}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, rating: parseFloat(e.target.value) || 5 }))}
                    />
                  </div>
                  <div>
                    <Label>Sessions completed</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newPractitioner.sessions}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, sessions: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>Price per session (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newPractitioner.price_inr}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, price_inr: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>About this practitioner</Label>
                    <Textarea
                      value={newPractitioner.bio}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, bio: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPractitionerOpen(false)}>Cancel</Button>
                  <Button onClick={addNew}>Save Practitioner</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="space-y-8">
              {approvedRows.map((row) => (
                <section key={row.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="sm:w-40 shrink-0">
                      <div className="aspect-[4/5] rounded-2xl bg-secondary overflow-hidden mb-3">
                        {row.image_url ? (
                          <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">No photo</div>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="text-xs"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadPhoto(row, f);
                        }}
                      />
                    </div>

                    <div className="flex-1 grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label>Name</Label>
                        <Input value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Modality / title</Label>
                        <Input value={row.craft} onChange={(e) => update(row.id, { craft: e.target.value })} />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={row.city} onChange={(e) => update(row.id, { city: e.target.value })} />
                      </div>
                      <div>
                        <Label>Rating</Label>
                        <Input type="number" step="0.01" min="0" max="5" value={row.rating}
                          onChange={(e) => update(row.id, { rating: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Sessions completed</Label>
                        <Input type="number" min="0" value={row.sessions}
                          onChange={(e) => update(row.id, { sessions: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Price per session (Γé╣)</Label>
                        <Input type="number" min="0" value={row.price_inr}
                          onChange={(e) => update(row.id, { price_inr: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Order on page</Label>
                        <Input type="number" value={row.sort_order}
                          onChange={(e) => update(row.id, { sort_order: Number(e.target.value) })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>About this practitioner</Label>
                        <Textarea rows={3} value={row.bio ?? ""} onChange={(e) => update(row.id, { bio: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Focus areas (what clients search for - comma separated)</Label>
                        <Input
                          value={(row.keywords ?? []).join(", ")}
                          placeholder="addiction, alcohol, anxiety, sleep, trauma"
                          onChange={(e) =>
                            update(row.id, {
                              keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          These power the site search - include everyday words clients might type, like "alcohol" or "insomnia".
                        </p>
                      </div>
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch checked={row.is_published} onCheckedChange={(v) => update(row.id, { is_published: v })} />
                          Show on site
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch checked={row.bookable} onCheckedChange={(v) => update(row.id, { bookable: v })} />
                          Allow booking
                        </label>
                      </div>
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1 border-t border-border mt-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch checked={row.offers_centre !== false} onCheckedChange={(v) => update(row.id, { offers_centre: v })} />
                          Partner Space (Centre)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch checked={row.offers_host === true} onCheckedChange={(v) => update(row.id, { offers_host: v })} />
                          At Home (Host)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch checked={row.offers_online === true} onCheckedChange={(v) => update(row.id, { offers_online: v })} />
                          Online Session
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => remove(row)} aria-label={`Remove ${row.name}`}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                          <Button className="rounded-full" disabled={busy} onClick={() => save(row)}>Save</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Pagination bar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  {/* Previous */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 w-9 p-0"
                    disabled={page <= 1 || busy}
                    onClick={() => {
                      const prev = page - 1;
                      setPage(prev);
                      load(prev, searchTerm);
                    }}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-9 min-w-9 px-3"
                        disabled={busy}
                        onClick={() => {
                          setPage(pageNumber);
                          load(pageNumber, searchTerm);
                        }}
                      >
                        {pageNumber}
                      </Button>
                    )
                  )}

                  {/* Next */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 w-9 p-0"
                    disabled={page >= totalPages || busy}
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      load(next, searchTerm);
                    }}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServicesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;


const ServicesManager = () => {
  const { services, loading } = useServices();
  const [localServices, setLocalServices] = React.useState(services);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setLocalServices(services);
  }, [services]);

  const [isAddServiceOpen, setIsAddServiceOpen] = React.useState(false);
  const [newService, setNewService] = React.useState({
    name: "",
    category: "",
    price_inr: 1000,
    duration_min: 60,
    description: "",
  });

  const update = (id: string, patch: any) => {
    setLocalServices((curr) => curr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addNew = async () => {
    if (!newService.name.trim()) { toast.error("Name required"); return; }

    try {
      const res = await adminCreateService({
        name: newService.name.trim(),
        category: newService.category.trim(),
        price_inr: Number(newService.price_inr) || 0,
        duration_min: Number(newService.duration_min) || 60,
        description: newService.description.trim(),
        is_active: true,
      });
      setLocalServices([res.service, ...localServices]);
      setIsAddServiceOpen(false);
      setNewService({
        name: "",
        category: "",
        price_inr: 1000,
        duration_min: 60,
        description: "",
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success("Service created!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create service");
    }
  };

  const save = async (row: any) => {
    setBusy(true);
    const { id, ...fields } = row;
    try {
      await adminUpdateService(id, fields);
      toast.success(`${row.name || "Service"} saved`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update service");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: any) => {
    if (!confirm(`Remove ${row.name}?`)) return;
    try {
      await adminDeleteService(row.id);
      setLocalServices((curr) => curr.filter((s) => s.id !== row.id));
      toast.success("Service removed");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete service");
    }
  };

  const uploadPhoto = async (row: any, file: File) => {
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `services/${row.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("practitioner-photos")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setBusy(false);
      toast.error(upErr.message);
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("practitioner-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    setBusy(false);
    if (signErr || !signed) {
      toast.error(signErr?.message ?? "Could not create photo link");
      return;
    }
    update(row.id, { image_url: signed.signedUrl });
    await adminUpdateService(row.id, { image_url: signed.signedUrl });
    toast.success("Service photo updated");
  };

  if (loading) return <div className="text-muted-foreground py-8">Loading services...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <p className="text-muted-foreground text-sm max-w-lg">
          Add new therapies, update descriptions, categories, and prices. Turn on "Show on site" to make active.
        </p>
        <Button onClick={() => setIsAddServiceOpen(true)} className="rounded-full shrink-0"><Plus className="size-4 mr-1" /> Add Service</Button>
      </div>

      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService(s => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Reiki Healing"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={newService.category}
                onChange={(e) => setNewService(s => ({ ...s, category: e.target.value }))}
                placeholder="e.g. Energy Healing"
              />
            </div>
            <div>
              <Label>Price (INR)</Label>
              <Input
                type="number"
                min="0"
                value={newService.price_inr}
                onChange={(e) => setNewService(s => ({ ...s, price_inr: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Duration (Min)</Label>
              <Input
                type="number"
                min="0"
                value={newService.duration_min}
                onChange={(e) => setNewService(s => ({ ...s, duration_min: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService(s => ({ ...s, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>Cancel</Button>
            <Button onClick={addNew}>Save Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {localServices.map((row) => (
          <section key={row.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-40 shrink-0">
                <div className="aspect-[4/5] rounded-2xl bg-secondary overflow-hidden mb-3">
                  {row.image_url ? (
                    <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">No photo</div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPhoto(row, f);
                  }}
                />
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={row.category ?? ""} onChange={(e) => update(row.id, { category: e.target.value })} />
                </div>
                <div>
                  <Label>Duration (Min)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={row.duration_min ?? 0}
                    onChange={(e) => update(row.id, { duration_min: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price per session (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={row.price_inr ?? 0}
                    onChange={(e) => update(row.id, { price_inr: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Order on page</Label>
                  <Input
                    type="number"
                    value={row.sort_order ?? 0}
                    onChange={(e) => update(row.id, { sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={row.description ?? ""}
                    onChange={(e) => update(row.id, { description: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={row.is_active !== false}
                      onCheckedChange={(v) => update(row.id, { is_active: v })}
                    />
                    Show on site
                  </label>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => remove(row)} aria-label={`Remove ${row.name}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                    <Button className="rounded-full" disabled={busy} onClick={() => save(row)}>Save</Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
