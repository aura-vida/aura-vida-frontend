import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends React.ComponentProps<"input"> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative w-full">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-4 py-2 pr-11 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer select-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-4 shrink-0" />
          ) : (
            <Eye className="size-4 shrink-0" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
