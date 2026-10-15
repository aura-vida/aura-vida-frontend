import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export interface AuraBookingCalendarProps {
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
  availableSlots: string[]; // ["09:00", "10:00", ...]
  selectedTime: string;
  onTimeChange: (time: string) => void;
  loadingSlots?: boolean;
  durationMin?: number;
  formatSlot?: (slot: string) => { start: string; end: string };
  practitionerSlug?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const AuraBookingCalendar: React.FC<AuraBookingCalendarProps> = ({
  selectedDate,
  onDateChange,
  availableSlots,
  selectedTime,
  onTimeChange,
  loadingSlots = false,
  durationMin = 60,
  formatSlot,
  practitionerSlug,
  className,
}) => {
  // Current date for comparison
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split("T")[0], [today]);

  // Calendar View month & year (starts from selectedDate's month or current month)
  const initialDate = useMemo(() => {
    if (selectedDate && !isNaN(new Date(selectedDate).getTime())) {
      return new Date(selectedDate);
    }
    return new Date();
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState(() => initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => initialDate.getMonth());

  // Practitioner's weekly recurring schedule (days of week they work)
  const [activeDaysOfWeek, setActiveDaysOfWeek] = useState<number[] | null>(null);

  // Cache of slot availability per date (e.g. "2026-10-09": 0, "2026-10-13": 4)
  const [slotsCountCache, setSlotsCountCache] = useState<Record<string, number>>({});

  // Sync cache with current selectedDate slots
  useEffect(() => {
    if (selectedDate && !loadingSlots) {
      setSlotsCountCache((prev) => ({
        ...prev,
        [selectedDate]: availableSlots.length,
      }));
    }
  }, [selectedDate, availableSlots, loadingSlots]);

  // Load practitioner's weekly schedule to know their active days of the week
  useEffect(() => {
    if (!practitionerSlug) {
      setActiveDaysOfWeek(null);
      return;
    }
    api<{ schedule?: { day_of_week: number; is_active: boolean }[] }>(
      `/api/practitioners/${practitionerSlug}/availability`
    )
      .then((res) => {
        if (res?.schedule && res.schedule.length > 0) {
          const days = res.schedule
            .filter((s) => s.is_active !== false)
            .map((s) => s.day_of_week);
          setActiveDaysOfWeek([...new Set(days)]);
        } else {
          setActiveDaysOfWeek(null); // All days active by default
        }
      })
      .catch(() => setActiveDaysOfWeek(null));
  }, [practitionerSlug]);

  // Check if we can navigate back to previous month
  const canGoPrev = useMemo(() => {
    const isCurrentMonthOrPast =
      currentYear < today.getFullYear() ||
      (currentYear === today.getFullYear() && currentMonth <= today.getMonth());
    return !isCurrentMonthOrPast;
  }, [currentYear, currentMonth, today]);

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate calendar grid for currentMonth & currentYear
  const calendarDays = useMemo(() => {
    // Total days in this month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Day of week of the 1st day (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Convert to Monday-start (0 = Mon ... 6 = Sun)
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];

    // Blank cells before the 1st
    for (let i = 0; i < startOffset; i++) {
      days.push({ dayNumber: 0, dateStr: "", isCurrentMonth: false });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Selected date human readable string
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "";
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Helper default formatSlot
  const defaultFormatSlot = (slot: string) => {
    if (!slot) return { start: "--:--", end: "--:--" };
    const parts = slot.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const endTotalMin = h * 60 + m + durationMin;
    const endH = Math.floor(endTotalMin / 60) % 24;
    const endM = endTotalMin % 60;
    const startAmpm = h >= 12 ? "PM" : "AM";
    const endAmpm = endH >= 12 ? "PM" : "AM";
    return {
      start: `${h % 12 || 12}:${String(m).padStart(2, "0")} ${startAmpm}`,
      end: `${endH % 12 || 12}:${String(endM).padStart(2, "0")} ${endAmpm}`,
    };
  };

  const slotFormatter = formatSlot || defaultFormatSlot;

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── 1. Top Section: Interactive Month Calendar ───────────────────────── */}
      <div className="bg-background/50 rounded-2xl border border-border/70 p-5 sm:p-6 space-y-4">
        {/* Month Header & Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-foreground font-semibold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Select a preferred session date to view available time slots below
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canGoPrev}
              onClick={goToPrevMonth}
              className="size-8 rounded-full border-border hover:bg-secondary text-foreground disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="size-8 rounded-full border-border hover:bg-secondary text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w, idx) => (
            <div
              key={w}
              className={cn(
                "text-xs font-semibold uppercase tracking-wider py-1.5",
                idx >= 5 ? "text-muted-foreground/60" : "text-muted-foreground"
              )}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth || item.dayNumber === 0) {
              return <div key={`empty-${idx}`} className="h-11 sm:h-12" />;
            }

            const { dateStr, dayNumber } = item;
            const dayDate = new Date(currentYear, currentMonth, dayNumber);
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;

            // Check if day is an off day for this practitioner
            const dayOfWeek = dayDate.getDay();
            const isOffDay =
              activeDaysOfWeek !== null && !activeDaysOfWeek.includes(dayOfWeek);

            // Availability status
            const cachedSlots = slotsCountCache[dateStr];
            const hasKnownSlots = typeof cachedSlots === "number" && cachedSlots > 0;
            const isKnownEmpty = typeof cachedSlots === "number" && cachedSlots === 0;

            const isDisabled = isPast || isOffDay;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isDisabled}
                onClick={() => onDateChange(dateStr)}
                className={cn(
                  "h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 select-none",
                  isDisabled &&
                    "opacity-35 cursor-not-allowed text-muted-foreground/50 bg-transparent line-through decoration-muted-foreground/40",
                  !isDisabled &&
                    !isSelected &&
                    "cursor-pointer text-foreground hover:bg-secondary/80 hover:border-accent/40 border border-transparent",
                  isToday && !isSelected && "border-primary/40 font-semibold text-primary",
                  isSelected &&
                    "bg-primary text-primary-foreground font-semibold shadow-soft scale-105 z-10 ring-2 ring-primary/25"
                )}
              >
                <span className="text-sm leading-none">{dayNumber}</span>

                {/* Status Dot / Indicator */}
                {!isDisabled && (
                  <span className="flex items-center justify-center h-2 mt-1">
                    {isSelected ? (
                      <span className="size-1.5 rounded-full bg-primary-foreground/90" />
                    ) : hasKnownSlots ? (
                      <span
                        className="size-1.5 rounded-full bg-emerald-500 shadow-xs"
                        title="Available slots open"
                      />
                    ) : isKnownEmpty ? (
                      <span
                        className="size-1.5 rounded-full bg-rose-500/80"
                        title="Fully booked / no open slots"
                      />
                    ) : (
                      // Neutral open indicator for working day
                      <span className="size-1.5 rounded-full bg-emerald-500/70" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>Booked / Full</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>Selected</span>
            </span>
            <span className="flex items-center gap-1.5 opacity-60">
              <span className="size-2 rounded-full bg-muted-foreground" />
              <span>Past / Off</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Bottom Section: Available Time Slots Below Calendar ───────────── */}
      {selectedDate ? (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-soft transition-all">
          {/* Selected Date Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <div className="text-[11px] tracking-widest uppercase font-semibold text-accent flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>Available Times</span>
              </div>
              <h4 className="font-display text-base sm:text-lg text-foreground mt-0.5 font-medium leading-snug">
                {formattedSelectedDate}
              </h4>
            </div>

            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border shrink-0",
                loadingSlots
                  ? "bg-secondary text-muted-foreground border-border"
                  : availableSlots.length > 0
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
              )}
            >
              {loadingSlots
                ? "Checking…"
                : availableSlots.length > 0
                ? `${availableSlots.length} open slot${availableSlots.length > 1 ? "s" : ""}`
                : "Sold out"}
            </span>
          </div>

          {/* Time Slots Content */}
          {loadingSlots ? (
            <div className="space-y-2.5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-14 rounded-xl bg-secondary/60 border border-border/40 animate-pulse"
                  />
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
                <Clock className="size-3.5 animate-spin text-accent" />
                <span>Finding real-time open slots…</span>
              </p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="rounded-2xl border border-border/80 bg-secondary/30 p-6 text-center space-y-2 my-2">
              <CalendarIcon className="size-7 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-medium text-foreground">No open slots on this date</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                All appointments on this date are fully booked or off-schedule. Please select a different day with green availability on the calendar above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  const { start, end } = slotFormatter(slot);

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onTimeChange(slot)}
                      className={cn(
                        "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border transition-all text-center cursor-pointer relative",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-soft ring-1 ring-primary"
                          : "bg-background border-border hover:border-accent/50 text-foreground hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-semibold leading-tight", isSelected ? "text-primary-foreground" : "text-foreground")}>
                          {start}
                        </span>
                        {isSelected && <Check className="size-3 text-primary-foreground shrink-0" />}
                      </div>
                      <span className={cn("text-[10px] mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        to {end}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                <span>Duration: {durationMin} minutes</span>
                <span>Instant confirmation</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-6 text-center space-y-1 text-muted-foreground">
          <CalendarIcon className="size-6 mx-auto opacity-50" />
          <p className="text-xs font-medium">Please select a date from the calendar above to view available slots.</p>
        </div>
      )}
    </div>
  );
};

export default AuraBookingCalendar;
