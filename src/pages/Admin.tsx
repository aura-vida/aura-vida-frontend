import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Nav from "@/components/aura/Nav";
import SpaceListingsAdmin from "@/components/aura/SpaceListingsAdmin";
import { adminCreatePractitioner, adminUpdatePractitioner, adminDeletePractitioner, listPractitioners, type Practitioner } from "@/lib/practitionersApi";




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
});

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Practitioner[]>([]);
  const [busy, setBusy] = useState(false);
  

  
  
  useEffect(() => {
    if (!user) return;
    setIsAdmin(profile?.role === "admin");
  }, [user, profile]);

  const load = async () => {
    setBusy(true);
    try {
      // Temporarily fetching from the public endpoint until the backend team
      // creates a GET /api/admin/practitioners endpoint to include drafts.
      const data = await listPractitioners({ limit: 100 });
      setRows(data.practitioners);
    } catch (err: any) {
      toast.error(err.message || "Failed to load practitioners");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      load();
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

  const addNew = async () => {
    const draft = blank(rows.length + 1);
    const slug = `practitioner-${Date.now()}`;
    try {
      const data = await adminCreatePractitioner({ ...draft, slug, name: "New practitioner" });
      setRows((r) => [...r, data.practitioner]);
    } catch (err: any) {
      toast.error(err.message);
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
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Admin</span>
            <h1 className="font-display text-4xl mt-3">Practitioner profiles</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Upload a photo and edit details. Turn on "Show on site" when a profile is ready, and "Allow booking" to replace Coming soon with a booking button.
            </p>
          </div>
          <Button onClick={addNew} className="rounded-full shrink-0"><Plus className="size-4 mr-1" /> Add</Button>
        </div>

        <div className="space-y-8">
          {rows.map((row) => (
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

          <SpaceListingsAdmin />
      </main>
    </div>
  );
};

export default Admin;
