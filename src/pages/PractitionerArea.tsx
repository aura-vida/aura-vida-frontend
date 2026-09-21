import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  client_name: string | null;
  mode: string;
  pin: string | null;
  status: string;
  amount: number | null;
  aftercare_notes: string | null;
  created_at: string;
  group_size: number | null;
  attendees: string[] | null;
}

const PractitionerArea = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!profile?.practitioner_slug) return;
    supabase
      .from("bookings")
      .select("*")
      .eq("practitioner_slug", profile.practitioner_slug)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as Booking[];
        setBookings(rows);
        setDrafts(Object.fromEntries(rows.map((r) => [r.id, r.aftercare_notes ?? ""])));
      });
  }, [profile?.practitioner_slug]);

  const save = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from("bookings")
      .update({ aftercare_notes: drafts[id], aftercare_updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(null);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    toast({ title: "Notes saved", description: "Your client can now see them in their account." });
  };

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-14 lg:py-20">
        <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Practitioner area</span>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Your clients &amp; aftercare</h1>

        {!profile?.practitioner_slug && (
          <div className="mt-10 rounded-[2rem] border border-border bg-card p-10 shadow-soft">
            <h2 className="font-display text-2xl">This account isn't linked to a practitioner yet</h2>
            <p className="text-muted-foreground mt-2">
              Email sahil.dhanani@kusala.in to have your practitioner profile connected to this account.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-4">
          {profile?.practitioner_slug && bookings.length === 0 && (
            <p className="text-muted-foreground">No bookings with you yet.</p>
          )}

          {bookings.map((b) => (
            <article key={b.id} className="rounded-[2rem] border border-border bg-card p-7 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">
                    {b.client_name ?? "Client"}
                    {(b.group_size ?? 1) > 1 && (
                      <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.2em] text-accent">
                        Group of {b.group_size}
                      </span>
                    )}
                  </h2>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Booked {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{b.mode === "online" ? "Online" : b.mode === "host" ? "Client's home" : `Centre ${b.pin ?? ""}`}
                  </div>
                  {(b.group_size ?? 1) > 1 && b.attendees?.length ? (
                    <div className="text-sm text-muted-foreground mt-1">
                      Attending: {b.attendees.join(", ")}
                    </div>
                  ) : null}
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-accent">{b.status}</span>
              </div>
              <Textarea
                value={drafts[b.id] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [b.id]: e.target.value })}
                placeholder="Aftercare notes for your client — practices, rest, hydration, follow-up…"
                className="mt-4 rounded-2xl min-h-32"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => save(b.id)}
                  disabled={saving === b.id}
                  className="rounded-full h-11 px-7 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving === b.id ? "Saving…" : "Save notes"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default PractitionerArea;
