import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Space, adminPackSpaceSlot } from "@/lib/spacesApi";
import { CircularTimePicker } from "@/components/aura/CircularTimePicker";
import { ClickableDatePicker } from "@/components/aura/ClickableDatePicker";

interface PackSpaceSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: Space | null;
  onSuccess: (updatedSpace: Space) => void;
}

export const PackSpaceSlotDialog: React.FC<PackSpaceSlotDialogProps> = ({
  open,
  onOpenChange,
  space,
  onSuccess,
}) => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [busy, setBusy] = useState(false);

  const handlePackSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;

    if (!date || !startTime || !endTime) {
      toast.error("Please specify the date, start time, and end time.");
      return;
    }

    if (startTime >= endTime) {
      toast.error("Start time must be before end time.");
      return;
    }

    setBusy(true);
    try {
      const res = await adminPackSpaceSlot(space.id, {
        date,
        start_time: startTime,
        end_time: endTime,
        reason,
        notify_owner: notifyOwner,
      });

      toast.success(
        notifyOwner && space.email
          ? `Slot packed! Confirmation email sent to ${space.email}.`
          : "Slot reserved & packed successfully."
      );

      onSuccess(res.space);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to pack slot.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-elegant max-w-lg">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-accent/15 text-accent border border-accent/25 flex items-center justify-center shrink-0">
              <Lock className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl text-foreground">
                Pack / Reserve Space Slot
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Block hours at <strong className="text-foreground">{space?.space_name}</strong> for exclusive platform bookings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handlePackSlot} className="space-y-4 pt-3">
          <div>
            <Label className="text-xs font-medium">Reservation Date *</Label>
            <ClickableDatePicker
              value={date}
              onChange={setDate}
              wrapperClassName="mt-1"
              className="h-11 rounded-xl bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Start Time *</Label>
              <CircularTimePicker
                value={startTime}
                onChange={setStartTime}
                className="mt-1 h-11 rounded-xl bg-background text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">End Time *</Label>
              <CircularTimePicker
                value={endTime}
                onChange={setEndTime}
                className="mt-1 h-11 rounded-xl bg-background text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Purpose / Booking Notes</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sound Bath Workshop, Private Meditation, Host Hold"
              className="mt-1 h-11 rounded-xl bg-background"
            />
          </div>

          {/* Email Notification Switch */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Mail className="size-4 text-accent shrink-0" />
              <div>
                <div className="text-xs font-medium text-foreground">
                  Email Sanctuary Host
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Send confirmation to {space?.email || "space host"}
                </div>
              </div>
            </div>
            <Switch
              checked={notifyOwner}
              onCheckedChange={setNotifyOwner}
              disabled={!space?.email}
            />
          </div>

          <DialogFooter className="mt-5 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
              className="rounded-full h-11 px-5 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="rounded-full h-11 px-6 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Packing Slot...
                </>
              ) : (
                "Pack & Reserve Slot"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackSpaceSlotDialog;
