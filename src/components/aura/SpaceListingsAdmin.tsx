import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type Listing = {
  id: string; contact_name: string; email: string; phone: string | null; space_name: string;
  space_type: string | null; address: string; city: string; pin: string; capacity: number;
  amenities: string | null; availability: string | null; notes: string | null; status: string; created_at: string;
};

const SpaceListingsAdmin = () => {
  const [rows, setRows] = useState<Listing[]>([]);

  const load = async () => {
    const { data } = await supabase.from("space_listings").select("*").order("created_at", { ascending: false });
    setRows((data as Listing[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("space_listings").update({ status }).eq("id", id);
    if (error) return toast.error("Couldn't update");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    const { error } = await supabase.from("space_listings").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="mt-20">
      <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Admin</span>
      <h2 className="font-display text-4xl mt-3">Space submissions</h2>
      <p className="text-muted-foreground mt-2 text-sm mb-8">Spaces sent in through the "List your space" form. Add approved ones to Partner centres above.</p>
      {rows.length === 0 && <p className="text-muted-foreground">No submissions yet.</p>}
      <div className="space-y-4">
        {rows.map((r) => (
          <section key={r.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl">{r.space_name}</h3>
                <p className="text-sm text-muted-foreground">{[r.space_type, `${r.city} ${r.pin}`, `holds ${r.capacity}`].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="text-xs uppercase tracking-widest rounded-full border border-border px-3 py-1">{r.status}</span>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <p><span className="text-muted-foreground">Contact:</span> {r.contact_name}</p>
              <p><span className="text-muted-foreground">Email:</span> <a className="underline" href={`mailto:${r.email}`}>{r.email}</a></p>
              {r.phone && <p><span className="text-muted-foreground">Phone:</span> {r.phone}</p>}
              <p className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {r.address}</p>
              {r.availability && <p className="sm:col-span-2"><span className="text-muted-foreground">Availability:</span> {r.availability}</p>}
              {r.amenities && <p className="sm:col-span-2"><span className="text-muted-foreground">Amenities:</span> {r.amenities}</p>}
              {r.notes && <p className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {r.notes}</p>}
              <p className="text-muted-foreground text-xs mt-2">Received {new Date(r.created_at).toLocaleDateString("en-IN")}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              {["new", "contacted", "approved", "declined"].map((s) => (
                <Button key={s} size="sm" variant={r.status === s ? "default" : "outline"} className="rounded-full capitalize" onClick={() => setStatus(r.id, s)}>{s}</Button>
              ))}
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SpaceListingsAdmin;
