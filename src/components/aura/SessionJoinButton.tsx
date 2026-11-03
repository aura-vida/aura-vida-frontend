import React, { useState, useEffect } from "react";
import { Video, Lock, CheckCircle2 } from "lucide-react";

interface SessionJoinButtonProps {
  scheduledAt?: string | null;
  meetLink?: string | null;
  durationMin?: number;
  status?: string;
  isPractitioner?: boolean;
  className?: string;
}

export const SessionJoinButton: React.FC<SessionJoinButtonProps> = ({
  scheduledAt,
  meetLink,
  durationMin = 60,
  status,
  isPractitioner = false,
  className = "",
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // Tick every 30 seconds to update button stage dynamically
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (status === "cancelled") return null;

  if (status === "completed") {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs text-blue-700 font-medium ${className}`}>
        <CheckCircle2 className="size-3.5" />
        <span>Session Completed</span>
      </div>
    );
  }

  // Calculate timing boundaries if scheduledAt exists
  const startTime = scheduledAt ? new Date(scheduledAt).getTime() : 0;
  const endTime = startTime + durationMin * 60 * 1000;
  const unlockTime = startTime - 30 * 60 * 1000; // 30 mins before start
  const autoCompletedTime = endTime + 15 * 60 * 1000; // 15 mins after slot end

  // Stage 3: After slot end + 15 mins (applies to both client & practitioner)
  if (startTime && now > autoCompletedTime) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs text-blue-700 font-medium ${className}`}>
        <CheckCircle2 className="size-3.5" />
        <span>Session Completed</span>
      </div>
    );
  }

  // PRACTITIONER MODE: Practitioners are the host, so the link is ALWAYS visible with NO 30-min block
  if (isPractitioner) {
    if (meetLink) {
      return (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all ${className}`}
        >
          <Video className="size-3.5" />
          <span>Join Google Meet</span>
        </a>
      );
    }
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-700 font-medium ${className}`}>
        <Video className="size-3.5" />
        <span>Online video session · Meet link generating…</span>
      </div>
    );
  }

  // CLIENT MODE:
  // If no scheduled date, fall back to showing meetLink directly if present
  if (!scheduledAt) {
    if (meetLink) {
      return (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all ${className}`}
        >
          <Video className="size-3.5" />
          <span>Join Google Meet</span>
        </a>
      );
    }
    return null;
  }

  // Client Stage 2: Active window (30 mins before start until 15 mins after slot end)
  if (now >= unlockTime) {
    if (meetLink) {
      return (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all animate-pulse ${className}`}
        >
          <Video className="size-3.5" />
          <span>Join Google Meet</span>
        </a>
      );
    }

    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-700 font-medium ${className}`}>
        <Video className="size-3.5" />
        <span>Session starting · Google Meet link will appear shortly</span>
      </div>
    );
  }

  // Client Stage 1: Before 30 mins to start (e.g. 2 days earlier, 1 day earlier)
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground font-medium ${className}`}
      title="The Google Meet link unlocks 30 minutes before your scheduled session time."
    >
      <Lock className="size-3.5 text-muted-foreground/70" />
      <span>Join button unlocks 30 mins before session</span>
    </div>
  );
};
