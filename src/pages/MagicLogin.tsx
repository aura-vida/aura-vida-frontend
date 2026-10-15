import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles } from "lucide-react";

// Deliberately NOT auto-verified on page load. Email clients and security
// gateways (Outlook Safe Links, Gmail's link proxy, antivirus scanners) often
// pre-fetch links in emails before the user clicks them — if this page
// consumed the token on mount, those automated visits would silently burn
// the one-time magic link before the real person ever got to it. Requiring
// an explicit click here keeps the link immune to that.
const MagicLogin = () => {
  const [searchParams] = useSearchParams();
  const tokenHash = searchParams.get("token_hash") || "";
  const redirectTo = searchParams.get("redirect") || "/";

  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { verifyMagicLink } = useAuth();

  const handleContinue = async () => {
    setBusy(true);
    try {
      await verifyMagicLink(tokenHash);
      toast({ title: "Logged in", description: "Welcome back!" });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFailed(true);
      toast({
        title: "Could not log you in",
        description: error instanceof Error ? error.message : "This link may have expired.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-md mx-auto px-6 py-16 lg:py-24 text-center">
        <div className="size-14 rounded-2xl bg-accent/15 border border-accent/25 grid place-items-center mx-auto mb-6">
          <Sparkles className="size-6 text-accent" />
        </div>
        <h1 className="font-display text-3xl text-foreground">Continue to your account</h1>

        {!tokenHash ? (
          <p className="text-sm text-destructive mt-6">
            This link is missing its login token. Please use the link from your email directly.
          </p>
        ) : failed ? (
          <p className="text-sm text-destructive mt-6">
            This login link is invalid or has expired. Please request a new one or sign in with your password.
          </p>
        ) : (
          <p className="text-muted-foreground mt-3">
            Click below to securely log in — no password needed.
          </p>
        )}

        <Button
          onClick={handleContinue}
          disabled={busy || !tokenHash || failed}
          className="w-full rounded-full h-12 mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
          {busy ? "Logging you in…" : "Continue"}
        </Button>
      </section>
      <Footer />
    </main>
  );
};

export default MagicLogin;
