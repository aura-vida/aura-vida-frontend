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

type Practitioner = {
  id: string;
  slug: string;
  name: string;
  craft: string;
  city: string;
  rating: number;
  sessions: number;
  price_inr: number;
  image_url: string | null;
  bio: string | null;
  keywords: string[] | null;
  sort_order: number;
  is_published: boolean;
  bookable: boolean;
};

type Centre = {
  id: string;
  name: string;
  area: string;
  pin: string;
  capacity: number;
  is_active: boolean;
  sort_order: number;
};

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
  keywords: [],
  sort_order: order,
  is_published: false,
  bookable: false,
});

const Admin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Practitioner[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = async () => {
    const { data, error } = await supabase
      .from("practitioners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Practitioner[]);
  };

  const loadCentres = async () => {
    const { data, error } = await supabase
      .from("centres")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setCentres((data ?? []) as Centre[]);
  };

  useEffect(() => {
    if (isAdmin) {
      load();
      loadCentres();
    }
  }, [isAdmin]);

  const updateCentre = (id: string, patch: Partial<Centre>) =>
    setCentres((c) => c.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const saveCentre = async (row: Centre) => {
    setBusy(true);
    const { id, ...fields } = row;
    const { error } = await supabase.from("centres").update(fields).eq("id", id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(`${row.name || "Centre"} saved`);
  };

  const addCentre = async () => {
    const { data, error } = await supabase
      .from("centres")
      .insert({ name: "New centre", sort_order: centres.length + 1, capacity: 4, is_active: false })
      .select()
      .single();
    if (error) toast.error(error.message);
    else setCentres((c) => [...c, data as Centre]);
  };

  const removeCentre = async (row: Centre) => {
    if (!confirm(`Remove ${row.name}?`)) return;
    const { error } = await supabase.from("centres").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else setCentres((c) => c.filter((x) => x.id !== row.id));
  };

  const update = (id: string, patch: Partial<Practitioner>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const save = async (row: Practitioner) => {
    setBusy(true);
    const { id, ...fields } = row;
    const { error } = await supabase.from("practitioners").update(fields).eq("id", id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(`${row.name || "Profile"} saved`);
  };

  const addNew = async () => {
    const draft = blank(rows.length + 1);
    const slug = `practitioner-${Date.now()}`;
    const { data, error } = await supabase
      .from("practitioners")
      .insert({ ...draft, slug, name: "New practitioner" })
      .select()
      .single();
    if (error) toast.error(error.message);
    else setRows((r) => [...r, data as Practitioner]);
  };

  const remove = async (row: Practitioner) => {
    if (!confirm(`Remove ${row.name}?`)) return;
    const { error } = await supabase.from("practitioners").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else setRows((r) => r.filter((x) => x.id !== row.id));
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
    await supabase.from("practitioners").update({ image_url: signed.signedUrl }).eq("id", row.id);
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
                    <Label>Focus areas (what clients search for — comma separated)</Label>
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
                      These power the site search — include everyday words clients might type, like "alcohol" or "insomnia".
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

        <div className="flex items-end justify-between gap-6 mt-20 mb-10">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Admin</span>
            <h2 className="font-display text-4xl mt-3">Partner centres</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Add the spaces clients can book. The PIN code is used to find the nearest centre, and capacity is how many people the room can seat.
            </p>
          </div>
          <Button onClick={addCentre} className="rounded-full shrink-0"><Plus className="size-4 mr-1" /> Add</Button>
        </div>

        <div className="space-y-6">
          {centres.map((c) => (
            <section key={c.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Centre name</Label>
                <Input value={c.name} onChange={(e) => updateCentre(c.id, { name: e.target.value })} />
              </div>
              <div>
                <Label>Area / city</Label>
                <Input value={c.area} onChange={(e) => updateCentre(c.id, { area: e.target.value })} placeholder="Bandra West, Mumbai" />
              </div>
              <div>
                <Label>PIN code</Label>
                <Input value={c.pin} maxLength={6} onChange={(e) => updateCentre(c.id, { pin: e.target.value.replace(/\D/g, "") })} placeholder="400050" />
              </div>
              <div>
                <Label>Capacity (people)</Label>
                <Input type="number" min="1" value={c.capacity} onChange={(e) => updateCentre(c.id, { capacity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Order in list</Label>
                <Input type="number" value={c.sort_order} onChange={(e) => updateCentre(c.id, { sort_order: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={c.is_active} onCheckedChange={(v) => updateCentre(c.id, { is_active: v })} />
                  Available for booking
                </label>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => removeCentre(c)} aria-label={`Remove ${c.name}`}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                  <Button className="rounded-full" disabled={busy} onClick={() => saveCentre(c)}>Save</Button>
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
