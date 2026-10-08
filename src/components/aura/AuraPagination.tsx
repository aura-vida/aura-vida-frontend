import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuraPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
  itemName?: string;
  className?: string;
}

export default function AuraPagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  disabled = false,
  itemName = "results",
  className,
}: AuraPaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  // Calculate "Showing X to Y of Z"
  const startItem = totalItems ? Math.min((page - 1) * pageSize + 1, totalItems) : (page - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(page * pageSize, totalItems) : page * pageSize;

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 pt-6 border-t border-border/80 text-xs text-muted-foreground",
        className
      )}
    >
      {/* Left side: Results Count */}
      <div className="font-medium text-foreground/80 tracking-wide">
        {totalItems !== undefined ? (
          <span>
            Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> {itemName}
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-foreground">{page}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Right side: Navigation Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || disabled}
          onClick={() => onPageChange(page - 1)}
          className="rounded-full h-9 px-3 gap-1 text-xs border-border bg-card/60 hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-muted-foreground font-mono select-none"
                >
                  …
                </span>
              );
            }

            const isActive = p === page;
            return (
              <Button
                key={p}
                size="sm"
                variant={isActive ? "default" : "outline"}
                disabled={disabled}
                onClick={() => onPageChange(p)}
                className={cn(
                  "rounded-full h-9 min-w-9 p-0 text-xs font-medium transition-all",
                  isActive
                    ? "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                    : "border-border bg-card/60 hover:bg-secondary hover:text-foreground"
                )}
                aria-label={`Go to page ${p}`}
                aria-current={isActive ? "page" : undefined}
              >
                {p}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || disabled}
          onClick={() => onPageChange(page + 1)}
          className="rounded-full h-9 px-3 gap-1 text-xs border-border bg-card/60 hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
