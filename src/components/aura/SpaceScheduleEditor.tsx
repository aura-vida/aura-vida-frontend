import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CircularTimePicker } from "@/components/aura/CircularTimePicker";
import { ClickableDatePicker } from "@/components/aura/ClickableDatePicker";
import {
  SpaceSchedule,
  DAY_NAMES,
  formatSpaceScheduleSummary,
  parseSpaceSchedule,
} from "@/lib/spacesApi";

interface SpaceScheduleEditorProps {
  value?: string | null | SpaceSchedule;
  onChange: (schedule: SpaceSchedule) => void;
  className?: string;
}

const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

export const SpaceScheduleEditor: React.FC<SpaceScheduleEditorProps> = ({
  value,
  onChange,
  className,
}) => {
  const schedule: SpaceSchedule = React.useMemo(() => {
    if (!value) return parseSpaceSchedule(null);
    if (typeof value === "string") return parseSpaceSchedule(value);
    return {
      days: value.days || [1, 2, 3, 4, 5, 6],
      open_time: value.open_time || "09:00",
      close_time: value.close_time || "19:00",
      available_from: value.available_from || null,
      available_to: value.available_to || null,
      packed_slots: value.packed_slots || [],
      summary: value.summary || formatSpaceScheduleSummary(value),
    };
  }, [value]);

  const update = (patch: Partial<SpaceSchedule>) => {
    const updated = {
      ...schedule,
      ...patch,
    };
    updated.summary = formatSpaceScheduleSummary(updated);
    onChange(updated);
  };

  const toggleDay = (dayIndex: number) => {
    const currentDays = schedule.days || [];
    let nextDays: number[];
    if (currentDays.includes(dayIndex)) {
      nextDays = currentDays.filter((d) => d !== dayIndex);
    } else {
      nextDays = [...currentDays, dayIndex].sort((a, b) => a - b);
    }
    update({ days: nextDays });
  };

  const setPreset = (preset: "mon-sat" | "mon-fri" | "all") => {
    if (preset === "mon-sat") update({ days: [1, 2, 3, 4, 5, 6] });
    else if (preset === "mon-fri") update({ days: [1, 2, 3, 4, 5] });
    else if (preset === "all") update({ days: [0, 1, 2, 3, 4, 5, 6] });
  };

  return (
    <div className={cn("space-y-4 rounded-2xl border border-border/80 bg-secondary/20 p-4 sm:p-5", className)}>
      {/* Header & Live Summary Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Operating Schedule &amp; Hours
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Set open days, operating hours, and active dates (like cafes &amp; studios on Google).
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs text-foreground font-medium self-start sm:self-auto">
          <span className="size-2 rounded-full bg-accent animate-pulse" />
          <span>{schedule.summary}</span>
        </div>
      </div>

      {/* 1. Operating Days Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-foreground">Open Days</Label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("mon-sat")}
              className="text-[11px] text-muted-foreground hover:text-accent underline px-1 py-0.5"
            >
              Mon–Sat
            </button>
            <span className="text-muted-foreground/50 text-[10px]">·</span>
            <button
              type="button"
              onClick={() => setPreset("mon-fri")}
              className="text-[11px] text-muted-foreground hover:text-accent underline px-1 py-0.5"
            >
              Mon–Fri
            </button>
            <span className="text-muted-foreground/50 text-[10px]">·</span>
            <button
              type="button"
              onClick={() => setPreset("all")}
              className="text-[11px] text-muted-foreground hover:text-accent underline px-1 py-0.5"
            >
              Everyday
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAY_INDICES.map((dayIdx) => {
            const isSelected = schedule.days?.includes(dayIdx);
            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => toggleDay(dayIdx)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-xl border text-xs font-medium transition-all duration-150",
                  isSelected
                    ? "bg-accent text-accent-foreground border-accent shadow-xs"
                    : "bg-background text-muted-foreground border-border/70 hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <span className="text-[11px] sm:text-xs font-semibold">{DAY_NAMES[dayIdx]}</span>
                {isSelected && <Check className="size-3 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Operating Hours & Date Range Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div>
          <Label className="text-xs text-muted-foreground">Open From (Time)</Label>
          <CircularTimePicker
            value={schedule.open_time || "09:00"}
            onChange={(val) => update({ open_time: val })}
            className="mt-1 h-10 rounded-xl bg-background text-xs"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Close At (Time)</Label>
          <CircularTimePicker
            value={schedule.close_time || "19:00"}
            onChange={(val) => update({ close_time: val })}
            className="mt-1 h-10 rounded-xl bg-background text-xs"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Available From (Date)</Label>
          <ClickableDatePicker
            value={schedule.available_from || ""}
            onChange={(val) => update({ available_from: val || null })}
            wrapperClassName="mt-1"
            className="h-10 rounded-xl bg-background text-xs"
            placeholder="Available immediately"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Available Until (Date)</Label>
          <ClickableDatePicker
            value={schedule.available_to || ""}
            onChange={(val) => update({ available_to: val || null })}
            wrapperClassName="mt-1"
            className="h-10 rounded-xl bg-background text-xs"
            placeholder="Ongoing if empty"
          />
        </div>
      </div>
    </div>
  );
};

export default SpaceScheduleEditor;
