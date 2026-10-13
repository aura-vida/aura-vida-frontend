import React, { useState, useRef, useEffect, useMemo } from "react";
import { Clock, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CircularTimePickerProps {
  value?: string; // Format: "HH:mm" (24-hour, e.g. "09:00", "17:00")
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export const CircularTimePicker: React.FC<CircularTimePickerProps> = ({
  value = "09:00",
  onChange,
  disabled = false,
  className,
  placeholder = "Select time",
  ariaLabel = "Time picker",
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"hours" | "minutes">("hours");

  // Parse 24h string
  const parseTime = (val: string) => {
    const [hStr, mStr] = (val || "09:00").split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    if (isNaN(h)) h = 9;
    const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { hour: h12, minute: m, period: ampm };
  };

  const parsed = useMemo(() => parseTime(value), [value]);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    const p = parseTime(value);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
  }, [value]);

  const emitChange = (h12: number, min: number, ampm: "AM" | "PM") => {
    let h24 = h12 % 12;
    if (ampm === "PM") h24 += 12;
    const timeStr = `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    onChange?.(timeStr);
  };

  const clockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Compact dial dimensions: Center = 76px, Radius = 55px (total size 152px)
  const CENTER = 76;
  const RADIUS = 55;

  const handlePointerInteract = (clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === "hours") {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      setSelectedHour(h);
      emitChange(h, selectedMinute, selectedPeriod);
    } else {
      let m = Math.round(angle / 6) % 60;
      setSelectedMinute(m);
      emitChange(selectedHour, m, selectedPeriod);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointerInteract(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handlePointerInteract(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (mode === "hours") {
        setTimeout(() => setMode("minutes"), 180);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handlePointerInteract(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches[0]) {
      handlePointerInteract(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (mode === "hours") {
        setTimeout(() => setMode("minutes"), 180);
      }
    }
  };

  const handAngle = mode === "hours" ? selectedHour * 30 : selectedMinute * 6;
  const activeTipX = CENTER + RADIUS * Math.sin((handAngle * Math.PI) / 180);
  const activeTipY = CENTER - RADIUS * Math.cos((handAngle * Math.PI) / 180);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 text-sm text-foreground shadow-none transition-colors hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 group",
            className
          )}
        >
          <span className="font-mono text-sm tracking-wide">
            {value || placeholder}
          </span>
          <Clock className="size-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0 ml-2" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="z-[100] w-[208px] rounded-2xl border border-border/80 bg-card p-3 shadow-xl backdrop-blur-md select-none"
      >
        {/* Compact Header: Digital readout + AM/PM toggle */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
          <div className="flex items-baseline gap-0.5">
            <button
              type="button"
              onClick={() => setMode("hours")}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xl font-display font-semibold transition-all",
                mode === "hours"
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {String(selectedHour).padStart(2, "0")}
            </button>
            <span className="text-lg font-display text-muted-foreground">:</span>
            <button
              type="button"
              onClick={() => setMode("minutes")}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xl font-display font-semibold transition-all",
                mode === "minutes"
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {String(selectedMinute).padStart(2, "0")}
            </button>
          </div>

          {/* AM / PM Toggle */}
          <div className="flex rounded-full border border-border/70 bg-secondary/60 p-0.5 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => {
                setSelectedPeriod("AM");
                emitChange(selectedHour, selectedMinute, "AM");
              }}
              className={cn(
                "rounded-full px-2 py-0.5 transition-all",
                selectedPeriod === "AM"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPeriod("PM");
                emitChange(selectedHour, selectedMinute, "PM");
              }}
              className={cn(
                "rounded-full px-2 py-0.5 transition-all",
                selectedPeriod === "PM"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              PM
            </button>
          </div>
        </div>

        {/* Mode subtitle */}
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex items-center justify-between px-0.5">
          <span>{mode === "hours" ? "Select Hour" : "Select Minute"}</span>
          <span className="text-accent text-[9px] lowercase">{mode === "hours" ? "1-12" : "0-59"}</span>
        </div>

        {/* Compact Analog Circular Clock Face */}
        <div className="flex justify-center my-1">
          <div
            ref={clockRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: `${CENTER * 2}px`, height: `${CENTER * 2}px` }}
            className="relative rounded-full bg-secondary/50 border border-border/70 cursor-pointer shadow-inner touch-none mx-auto"
          >
            {/* Clock Hand SVG */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CENTER * 2}
              height={CENTER * 2}
              viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
            >
              <circle cx={CENTER} cy={CENTER} r={3} className="fill-accent" />
              <line
                x1={CENTER}
                y1={CENTER}
                x2={activeTipX}
                y2={activeTipY}
                stroke="currentColor"
                strokeWidth={2}
                className="text-accent"
              />
              <circle
                cx={activeTipX}
                cy={activeTipY}
                r={10.5}
                className="fill-accent text-accent"
              />
            </svg>

            {/* Hour Numbers (1..12) */}
            {mode === "hours" &&
              [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
                const angle = (h * 30 * Math.PI) / 180;
                const x = CENTER + RADIUS * Math.sin(angle);
                const y = CENTER - RADIUS * Math.cos(angle);
                const isSelected = selectedHour === h;

                return (
                  <div
                    key={h}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={cn(
                      "absolute flex size-5 items-center justify-center rounded-full text-[10px] font-medium pointer-events-none transition-colors",
                      isSelected
                        ? "text-accent-foreground font-bold z-10"
                        : "text-foreground/80"
                    )}
                  >
                    {h}
                  </div>
                );
              })}

            {/* Minute Numbers (00, 05, 10, 15... 55) */}
            {mode === "minutes" &&
              [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                const angle = (m * 6 * Math.PI) / 180;
                const x = CENTER + RADIUS * Math.sin(angle);
                const y = CENTER - RADIUS * Math.cos(angle);
                const isSelected = selectedMinute === m;

                return (
                  <div
                    key={m}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={cn(
                      "absolute flex size-5 items-center justify-center rounded-full text-[9px] font-medium pointer-events-none transition-colors",
                      isSelected
                        ? "text-accent-foreground font-bold z-10"
                        : "text-foreground/80"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                );
              })}

            {/* Minute tick dots */}
            {mode === "minutes" &&
              Array.from({ length: 60 }).map((_, i) => {
                if (i % 5 === 0) return null;
                const angle = (i * 6 * Math.PI) / 180;
                const x = CENTER + RADIUS * Math.sin(angle);
                const y = CENTER - RADIUS * Math.cos(angle);
                const isSelected = selectedMinute === i;

                return (
                  <div
                    key={i}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={cn(
                      "absolute size-0.5 rounded-full pointer-events-none",
                      isSelected
                        ? "bg-accent-foreground scale-150 z-10"
                        : "bg-muted-foreground/35"
                    )}
                  />
                );
              })}
          </div>
        </div>

        {/* Compact Footer Action */}
        <div className="pt-2 mt-1 border-t border-border/60">
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(false)}
            className="w-full rounded-full h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-medium gap-1 shadow-none"
          >
            <Check className="size-3" />
            Done ({value})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CircularTimePicker;
