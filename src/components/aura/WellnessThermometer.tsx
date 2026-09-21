import { useMemo } from "react";
import { Sparkles, Flame, Compass } from "lucide-react";

export interface ThermometerBooking {
  status: string;
  item_id: string;
}

const TIERS = [
  { name: "Seed", min: 0 },
  { name: "Bloom", min: 3 },
  { name: "Radiance", min: 6 },
  { name: "Luminary", min: 12 },
];

const POINTS_PER_SESSION = 100;
const NEW_MODALITY_BONUS = 50;

interface Props {
  bookings: ThermometerBooking[];
  craftBySlug: Record<string, string>;
}

const WellnessThermometer = ({ bookings, craftBySlug }: Props) => {
  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "completed");
    const crafts = new Set(
      completed.map((b) => craftBySlug[b.item_id]).filter(Boolean) as string[],
    );
    const sessions = completed.length;
    const points = sessions * POINTS_PER_SESSION + crafts.size * NEW_MODALITY_BONUS;

    let tierIndex = 0;
    TIERS.forEach((t, i) => {
      if (sessions >= t.min) tierIndex = i;
    });
    const tier = TIERS[tierIndex];
    const next = TIERS[tierIndex + 1];
    const floor = tier.min;
    const ceiling = next ? next.min : tier.min || 1;
    const progress = next
      ? Math.min(100, Math.round(((sessions - floor) / (ceiling - floor)) * 100))
      : 100;

    return { sessions, points, crafts, tier, next, progress };
  }, [bookings, craftBySlug]);

  return (
    <section className="rounded-[2rem] border border-border bg-card p-7 md:p-9 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">
            Wellness thermometer
          </span>
          <h2 className="font-display text-3xl mt-3">{stats.tier.name}</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {stats.next
              ? `${Math.max(0, stats.next.min - stats.sessions)} more session${
                  stats.next.min - stats.sessions === 1 ? "" : "s"
                } to reach ${stats.next.name}.`
              : "You've reached the highest tier. Beautifully done."}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" /> Reward points
          </div>
          <div className="font-display text-4xl mt-1">{stats.points.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="mt-7">
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-[width] duration-700"
            style={{ width: `${Math.max(4, stats.progress)}%` }}
          />
        </div>
        <div className="flex justify-between mt-3">
          {TIERS.map((t) => (
            <span
              key={t.name}
              className={`text-[10px] uppercase tracking-[0.18em] ${
                stats.sessions >= t.min ? "text-accent" : "text-muted-foreground/60"
              }`}
            >
              {t.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        <div className="rounded-2xl border border-border/70 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Flame className="size-3.5 text-accent" /> Sessions
          </div>
          <div className="font-display text-2xl mt-2">{stats.sessions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {POINTS_PER_SESSION} points for every completed session.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Compass className="size-3.5 text-accent" /> Modalities explored
          </div>
          <div className="font-display text-2xl mt-2">{stats.crafts.size}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +{NEW_MODALITY_BONUS} points the first time you try a new practice.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" /> Rewards
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Keep collecting — points will soon unlock perks on your next booking.
          </p>
        </div>
      </div>

      {stats.crafts.size > 0 && (
        <p className="text-xs text-muted-foreground mt-6">
          You've tried: {Array.from(stats.crafts).join(" · ")}
        </p>
      )}
    </section>
  );
};

export default WellnessThermometer;
