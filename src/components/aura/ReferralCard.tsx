import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Gift, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const ReferralCard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const code = profile?.referral_code ?? "";
  const link = code ? `${window.location.origin}/auth?ref=${code}` : "";
  const credit = profile?.credit_inr ?? 0;
  // Read from the server-computed count on the profile rather than querying
  // `referrals` directly — that table's RLS checks auth.uid(), which this
  // app's frontend Supabase client never has set (login goes through the
  // Node backend, not supabase-js's own session), so a direct client-side
  // query always silently returned zero regardless of the real count.
  const count = profile?.referral_count ?? 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Share it with a friend to give them ₹200 off." });
    } catch {
      toast({ title: "Couldn't copy", description: link, variant: "destructive" });
    }
  };

  const whatsappMessage = encodeURIComponent(
    `I've been booking healing sessions on Kuśala — trusted practitioners, centres near you and online sessions. Join with my link and we both get ₹200 off our next session: ${link}`,
  );

  if (!code) return null;

  return (
    <section className="rounded-[2rem] border border-primary/25 bg-accent-soft p-7 md:p-9 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-accent font-medium">
            <Gift className="size-3.5" /> Refer a friend
          </span>
          <h2 className="font-display text-3xl mt-3">Give ₹200, get ₹200</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
            Share your personal link. When a friend books their first session, you both receive ₹200
            off your next one.
          </p>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Users className="size-3.5" /> Friends joined
            </div>
            <div className="font-display text-3xl mt-1">{count}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Credit earned</div>
            <div className="font-display text-3xl mt-1">₹{credit.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 rounded-full border border-border bg-card px-5 h-12 flex items-center overflow-hidden">
          <span className="text-sm text-foreground/80 truncate">{link}</span>
        </div>
        <Button
          onClick={copy}
          variant="outline"
          className="rounded-full h-12 px-6 border-foreground/20 shrink-0"
        >
          {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button asChild className="rounded-full h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          <a href={`https://wa.me/?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4 mr-2" /> Share on WhatsApp
          </a>
        </Button>
      </div>
    </section>
  );
};

export default ReferralCard;
