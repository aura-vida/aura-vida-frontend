import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, MapPin, Video, Home, NotebookPen, Users } from "lucide-react";
import WellnessThermometer from "@/components/aura/WellnessThermometer";
import ReferralCard from "@/components/aura/ReferralCard";

import { listPractitioners } from "@/lib/practitionersApi";
import { getMyAppointments, type Appointment as Booking } from "@/lib/usersApi";

const modeIcon = (mode: string) => (mode === "online" ? Video : mode === "host" ? Home : MapPin);
const modeLabel = (mode: string) =>
  mode === "online" ? "Online session" : mode === "host" ? "At your home" : "Partner centre";

const Account = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [craftBySlug, setCraftBySlug] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    getMyAppointments()
      .then((data) => {
        setBookings(data.appointments);
        setFetching(false);
      })
      .catch((err) => {
        console.error("Failed to load sessions:", err);
        setFetching(false);
      });
  }, [user]);

  useEffect(() => {
    listPractitioners({ limit: 100 })
      .then((data) => {
        const map: Record<string, string> = {};
        data.practitioners.forEach((p) => {
          if (p.craft) map[p.slug] = p.craft.split("·")[0].trim();
        });
        setCraftBySlug(map);
      });
  }, []);

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-14 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Your space</span>
            <h1 className="font-display text-4xl md:text-5xl mt-3">
              {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "My sessions"}
            </h1>
          </div>
          <div className="flex gap-3">
            {profile?.practitioner_slug && (
              <Link to="/practitioner">
                <Button variant="outline" className="rounded-full h-11 px-6 border-foreground/20">Practitioner area</Button>
              </Link>
            )}
            {profile?.role === "admin" && (<Link to="/admin"><Button variant="outline" className="rounded-full h-11 px-6 border-foreground/20 mr-3">Admin Dashboard</Button></Link>)}
              <Button onClick={() => signOut()} variant="outline" className="rounded-full h-11 px-6 border-foreground/20">
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <ReferralCard />
        </div>

        <div className="mt-8">
          <WellnessThermometer bookings={bookings} craftBySlug={craftBySlug} />
        </div>

        <div className="mt-8 space-y-4">
          {fetching && <p className="text-muted-foreground">Loading your sessions…</p>}

          {!fetching && bookings.length === 0 && (
            <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-soft">
              <CalendarDays className="size-6 text-accent mx-auto" />
              <h2 className="font-display text-2xl mt-4">No sessions yet</h2>
              <p className="text-muted-foreground mt-2">
                Once you book a session it will appear here, along with your aftercare notes.
              </p>
              <Link to="/book">
                <Button className="rounded-full h-12 px-8 mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Book a session
                </Button>
              </Link>
            </div>
          )}

          {bookings.map((b) => {
            const Icon = modeIcon(b.mode);
            return (
              <article key={b.id} className="rounded-[2rem] border border-border bg-card p-7 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl text-foreground">{b.practitioner_name}</h2>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                      <Icon className="size-4" /> {modeLabel(b.mode)}
                      {b.pin && <span>· {b.pin}</span>}
                    </div>
                    {(b.group_size ?? 1) > 1 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Users className="size-4" /> Group of {b.group_size}
                        {b.attendees?.length ? ` · ${b.attendees.join(", ")}` : ""}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Booked {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-accent">{b.status}</span>
                    {b.amount != null && (
                      <div className="font-display text-2xl">₹{(b.amount / 100).toLocaleString("en-IN")}</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    <NotebookPen className="size-3.5" /> Aftercare notes
                  </div>
                  <p className="text-sm text-foreground/80 mt-3 whitespace-pre-line leading-relaxed">
                    {b.aftercare_notes ?? "Your practitioner will add notes here after your session."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default Account;
