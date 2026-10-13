import React, { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClickableDatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  wrapperClassName?: string;
}

export const ClickableDatePicker: React.FC<ClickableDatePickerProps> = ({
  value,
  onChange,
  className,
  wrapperClassName,
  disabled,
  min,
  max,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      inputRef.current?.showPicker?.();
    } catch (_) {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      onClick={handleOpenPicker}
      className={cn(
        "relative flex items-center w-full cursor-pointer group",
        disabled && "cursor-not-allowed opacity-50",
        wrapperClassName
      )}
    >
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onClick={(e) => {
          try {
            (e.currentTarget as any).showPicker?.();
          } catch (_) {}
        }}
        className={cn(
          "clickable-date-input h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-10 text-sm text-foreground cursor-pointer shadow-none transition-colors hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          className
        )}
        {...props}
      />
      <Calendar className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-hover:text-accent transition-colors" />
    </div>
  );
};

export default ClickableDatePicker;
