import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-elegant max-w-md">
        <AlertDialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div
              className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-accent/15 text-accent border border-accent/25"
              }`}
            >
              {variant === "destructive" ? (
                <Trash2 className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
            </div>
            <div>
              <AlertDialogTitle className="font-display text-xl text-foreground">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          {description && (
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-5 gap-2.5 sm:gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="rounded-full h-11 px-6 border-border bg-card/60 text-foreground hover:bg-secondary hover:text-foreground text-sm font-medium transition-smooth"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`rounded-full h-11 px-6 text-sm font-medium transition-smooth ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
