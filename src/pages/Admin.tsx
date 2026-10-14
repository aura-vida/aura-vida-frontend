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
import { isValidPhoneNumber } from "@/lib/whatsapp";
import { adminCreateService, adminUpdateService, adminDeleteService } from "@/lib/servicesApi";
import { useServices } from "@/hooks/useServices";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, Check, Pencil, ChevronDown, ChevronUp, XCircle, MapPin, Home, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Nav from "@/components/aura/Nav";
import SpaceListingsAdmin from "@/components/aura/SpaceListingsAdmin";
import { adminCreatePractitioner, adminUpdatePractitioner, adminDeletePractitioner, adminApprovePractitioner, adminListPractitioners, listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import AdminAppointments from "@/components/aura/AdminAppointments";
import AdminOverview from "@/components/aura/AdminOverview";
import AdminUsers from "@/components/aura/AdminUsers";
import AdminCoupons from "@/components/aura/AdminCoupons";
import AuraPagination from "@/components/aura/AuraPagination";




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

const ADMIN_TABS = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users & Clients" },
  { value: "appointments", label: "Appointments" },
  { value: "practitioners", label: "Practitioners" },
  { value: "services", label: "Services" },
  { value: "spaces", label: "Spaces" },
  { value: "coupons", label: "Coupons" },
];

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Practitioner[]>([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState<string>(""); // "" | "true" | "false"
  const [filterBookable, setFilterBookable] = useState<string>("");   // "" | "true" | "false"
  const [viewApplicant, setViewApplicant] = useState<Practitioner | null>(null);
  const [approving, setApproving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedPractitioners, setExpandedPractitioners] = useState<Record<string, boolean>>({});

  const togglePractitionerExpanded = (id?: string) => {
    if (!id) return;
    setExpandedPractitioners((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      setTotalCount(data.pagination.total || 0);
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
  const emptyNewPractitioner = () => ({
    name: "",
    email: "",
    mobile_number: "",
    whatsapp_number: "",
    craft: "",
    city: "",
    rating: 5,
    sessions: 0,
    price_inr: 1500,
    bio: "",
  });
  const [newPractitioner, setNewPractitioner] = useState(emptyNewPractitioner());

  const addNew = async () => {
    if (!newPractitioner.name.trim()) { toast.error("Name is required"); return; }
    if (!newPractitioner.email.trim()) { toast.error("Email is required to create their login"); return; }
    if (!isValidPhoneNumber(newPractitioner.mobile_number)) { toast.error("Please enter a valid mobile number"); return; }
    if (!isValidPhoneNumber(newPractitioner.whatsapp_number)) { toast.error("Please enter a valid WhatsApp number, including the country code"); return; }

    const draft = blank(rows.length + 1);

    try {
      const data = await adminCreatePractitioner({
        ...draft,
        name: newPractitioner.name.trim(),
        email: newPractitioner.email.trim(),
        mobile_number: newPractitioner.mobile_number.trim(),
        whatsapp_number: newPractitioner.whatsapp_number.trim(),
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
      setNewPractitioner(emptyNewPractitioner());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(data.message || "Practitioner created!");
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-6 mb-8 sm:mb-10">
            <div>
              <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Kuśala Console</span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-2 text-foreground">Platform Management</h1>
            </div>

            {/* Mobile Navigation: Sleek Active Tab + 3 Dots Menu Button */}
            <div className="flex md:hidden items-center justify-between gap-3 p-1.5 rounded-full bg-secondary/80 border border-border w-full shadow-soft">
              <div className="flex items-center gap-2.5 pl-3.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-foreground tracking-tight">
                  {ADMIN_TABS.find((t) => t.value === activeTab)?.label || "Overview"}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 px-3 gap-1.5 bg-card border-border hover:bg-secondary text-foreground text-xs shadow-soft"
                    aria-label="Open navigation menu"
                  >
                    <span className="text-[11px] font-medium text-muted-foreground">Switch Tab</span>
                    <MoreHorizontal className="size-4 text-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 bg-card border-border shadow-elegant">
                  {ADMIN_TABS.map((tab) => {
                    const isActive = activeTab === tab.value;
                    return (
                      <DropdownMenuItem
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer flex items-center justify-between transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span>{tab.label}</span>
                        {isActive && <Check className="size-3.5 ml-2 shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Navigation: Full Sleek Single-Row Pill Capsule */}
            <div className="hidden md:flex w-full overflow-x-auto no-scrollbar pb-1">
              <TabsList className="inline-flex h-12 items-center rounded-full p-1.5 bg-secondary/80 border border-border w-auto min-w-max gap-1">
                {ADMIN_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-full text-xs font-medium px-5 h-9 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft transition-smooth"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="mt-0">
            <AdminOverview onNavigateTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <AdminUsers />
          </TabsContent>

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
                <Select
                  value={filterPublished || "all"}
                  onValueChange={(val) => {
                    const nextVal = val === "all" ? "" : val;
                    setFilterPublished(nextVal);
                    setPage(1);
                    load(1, searchTerm, nextVal, filterBookable);
                  }}
                >
                  <SelectTrigger className="rounded-full h-10 px-4 text-sm border-input bg-background text-foreground w-40">
                    <SelectValue placeholder="All published" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-card">
                    <SelectItem value="all">All published</SelectItem>
                    <SelectItem value="true">Published only</SelectItem>
                    <SelectItem value="false">Draft only</SelectItem>
                  </SelectContent>
                </Select>
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
                <DialogFooter className="gap-2 sm:justify-between items-center">
                  <Button variant="outline" className="rounded-full" onClick={() => setViewApplicant(null)}>Close</Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      className="rounded-full px-5 gap-1.5"
                      disabled={approving}
                      onClick={async () => {
                        if (!viewApplicant?.id) return;
                        if (!confirm(`Are you sure you want to reject the application for ${viewApplicant.name}?`)) return;
                        setApproving(true);
                        try {
                          await adminUpdatePractitioner(viewApplicant.id, {
                            application_status: "rejected",
                            is_published: false,
                            bookable: false,
                          });
                          toast.success(`Application for ${viewApplicant.name} has been rejected`);
                          setViewApplicant(null);
                          load();
                        } catch (err: any) {
                          toast.error(err.message || "Failed to reject application");
                        } finally {
                          setApproving(false);
                        }
                      }}
                    >
                      <XCircle className="size-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 px-6 gap-1.5"
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
                      <Check className="size-4 mr-1" />
                      {approving ? "Approving…" : "Approve & Send Invite"}
                    </Button>
                  </div>
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
                  <div className="sm:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newPractitioner.email}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, email: e.target.value }))}
                      placeholder="their@email.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">An invite to set their password is sent here.</p>
                  </div>
                  <div>
                    <Label>Mobile number</Label>
                    <Input
                      type="tel"
                      value={newPractitioner.mobile_number}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, mobile_number: e.target.value }))}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp number</Label>
                    <Input
                      type="tel"
                      value={newPractitioner.whatsapp_number}
                      onChange={(e) => setNewPractitioner(p => ({ ...p, whatsapp_number: e.target.value }))}
                      placeholder="e.g. +91 98765 43210"
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

            <div className={cn("space-y-4 transition-opacity duration-200", busy && "opacity-60 pointer-events-none")}>
              {approvedRows.map((row) => {
                const isExpanded = !!expandedPractitioners[row.id];
                return (
                  <section key={row.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft transition-all duration-200">
                    {/* Collapsed Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div 
                        className="flex items-center gap-4 min-w-0 cursor-pointer flex-1"
                        onClick={() => togglePractitionerExpanded(row.id)}
                      >
                        {/* Photo Thumbnail */}
                        <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-secondary overflow-hidden shrink-0 border border-border/60 shadow-sm relative group">
                          {row.image_url ? (
                            <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-[11px] text-muted-foreground font-medium p-1 text-center">
                              No photo
                            </div>
                          )}
                        </div>

                        {/* Summary Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-lg sm:text-xl text-foreground font-medium truncate">
                              {row.name || "Untitled Practitioner"}
                            </h3>
                            {row.is_published ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                Live on site
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                                Draft
                              </span>
                            )}
                            {row.bookable && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/15 text-accent border border-accent/20">
                                Bookable
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                            {[row.craft, row.city].filter(Boolean).join(" · ") || "No craft specified"}
                          </p>

                          <div className="flex items-center gap-3.5 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-semibold text-foreground">
                              ₹{Number(row.price_inr || 0).toLocaleString("en-IN")}
                              <span className="font-normal text-muted-foreground text-[11px]"> / session</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              ⭐ {row.rating ?? 5.0}
                            </span>
                            <span>{row.sessions ?? 0} sessions</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Edit, Delete, Chevron */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full h-9 px-3.5 gap-1.5 text-xs text-foreground hover:bg-secondary border-border/80"
                          onClick={() => togglePractitionerExpanded(row.id)}
                        >
                          <Pencil className="size-3.5 text-accent" />
                          <span>{isExpanded ? "Close" : "Edit"}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full size-9 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(row)}
                          aria-label={`Remove ${row.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full size-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => togglePractitionerExpanded(row.id)}
                          aria-label={isExpanded ? "Collapse card" : "Expand card"}
                        >
                          <ChevronDown className={cn("size-4.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Editing Area */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-border animate-in fade-in-50 duration-200">
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
                              <Label>Price per session (₹)</Label>
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
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-2 pb-1 border-t border-border">
                              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                                <Switch checked={row.is_published} onCheckedChange={(v) => update(row.id, { is_published: v })} />
                                <span className="font-medium text-foreground">Show on site</span>
                              </label>
                              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                                <Switch checked={row.bookable} onCheckedChange={(v) => update(row.id, { bookable: v })} />
                                <span className="font-medium text-foreground">Allow booking</span>
                              </label>
                            </div>

                            {/* Session Delivery Formats / Locations */}
                            <div className="sm:col-span-2 rounded-2xl border border-border bg-secondary/20 p-4 space-y-3 mt-1">
                              <div>
                                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                                  Session Delivery Formats &amp; Locations
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Select which session locations and delivery options this practitioner offers to clients during booking.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <label className={cn(
                                  "flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none",
                                  row.offers_centre !== false ? "bg-card border-border shadow-xs" : "bg-muted/40 border-border/50 opacity-75"
                                )}>
                                  <Switch
                                    className="mt-0.5 shrink-0"
                                    checked={row.offers_centre !== false}
                                    onCheckedChange={(v) => update(row.id, { offers_centre: v })}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <MapPin className="size-3.5 text-accent shrink-0" />
                                      <span>Partner Space</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                      Vetted sanctuary / centre
                                    </p>
                                  </div>
                                </label>

                                <label className={cn(
                                  "flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none",
                                  row.offers_host === true ? "bg-card border-border shadow-xs" : "bg-muted/40 border-border/50 opacity-75"
                                )}>
                                  <Switch
                                    className="mt-0.5 shrink-0"
                                    checked={row.offers_host === true}
                                    onCheckedChange={(v) => update(row.id, { offers_host: v })}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <Home className="size-3.5 text-accent shrink-0" />
                                      <span>At Home (Host)</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                      Practitioner travels to client
                                    </p>
                                  </div>
                                </label>

                                <label className={cn(
                                  "flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none",
                                  row.offers_online === true ? "bg-card border-border shadow-xs" : "bg-muted/40 border-border/50 opacity-75"
                                )}>
                                  <Switch
                                    className="mt-0.5 shrink-0"
                                    checked={row.offers_online === true}
                                    onCheckedChange={(v) => update(row.id, { offers_online: v })}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <Video className="size-3.5 text-accent shrink-0" />
                                      <span>Online Session</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                      Virtual via private video
                                    </p>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {/* Action Buttons Footer */}
                            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                              <Button
                                variant="outline"
                                className="rounded-full px-5 text-xs h-9"
                                onClick={() => togglePractitionerExpanded(row.id)}
                              >
                                Close
                              </Button>
                              <Button
                                className="rounded-full px-6 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={busy}
                                onClick={() => save(row)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Unified Luxury Pagination */}
            <AuraPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={10}
              itemName="practitioners"
              disabled={busy}
              onPageChange={(p) => {
                setPage(p);
                load(p, searchTerm, filterPublished, filterBookable);
              }}
            />

          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServicesManager />
          </TabsContent>

          <TabsContent value="spaces" className="mt-0">
            <SpaceListingsAdmin />
          </TabsContent>

          <TabsContent value="coupons" className="mt-0">
            <AdminCoupons />
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
  const [expandedServices, setExpandedServices] = React.useState<Record<string, boolean>>({});

  const toggleServiceExpanded = (id: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

      <div className="space-y-4">
        {localServices.map((row) => {
          const isExpanded = !!expandedServices[row.id];
          return (
            <section key={row.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft transition-all duration-200">
              {/* Summary Collapsed Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div
                  className="flex items-center gap-4 min-w-0 cursor-pointer flex-1"
                  onClick={() => toggleServiceExpanded(row.id)}
                >
                  <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-secondary overflow-hidden shrink-0 border border-border/60 shadow-sm relative group">
                    {row.image_url ? (
                      <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-muted-foreground font-medium p-1 text-center">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg sm:text-xl text-foreground font-medium truncate">
                        {row.name || "Untitled Service"}
                      </h3>
                      {row.is_active !== false ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                          Hidden
                        </span>
                      )}
                      {row.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-accent/15 text-accent border border-accent/20">
                          {row.category}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                      {row.description || "No description provided"}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground">
                        ₹{Number(row.price_inr ?? 0).toLocaleString("en-IN")}
                      </span>
                      <span>⏱️ {row.duration_min ?? 60} mins</span>
                      <span>Sort order: {row.sort_order ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 px-3.5 gap-1.5 text-xs text-foreground hover:bg-secondary border-border/80"
                    onClick={() => toggleServiceExpanded(row.id)}
                  >
                    <Pencil className="size-3.5 text-accent" />
                    <span>{isExpanded ? "Close" : "Edit"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-9 text-destructive hover:bg-destructive/10"
                    onClick={() => remove(row)}
                    aria-label={`Remove ${row.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onClick={() => toggleServiceExpanded(row.id)}
                    aria-label={isExpanded ? "Collapse card" : "Expand card"}
                  >
                    <ChevronDown className={cn("size-4.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                  </Button>
                </div>
              </div>

              {/* Expandable Editing Area */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-border animate-in fade-in-50 duration-200">
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
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1 border-t border-border mt-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={row.is_active !== false}
                            onCheckedChange={(v) => update(row.id, { is_active: v })}
                          />
                          Show on site
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          <Button variant="outline" className="rounded-full" onClick={() => toggleServiceExpanded(row.id)}>
                            Close
                          </Button>
                          <Button className="rounded-full" disabled={busy} onClick={() => save(row)}>Save</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
