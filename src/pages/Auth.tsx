import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const referralCode = (searchParams.get("ref") ?? "").trim().toUpperCase();
  const [mode, setMode] = useState<"signin" | "signup">(referralCode ? "signup" : "signin");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/account", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: { full_name: fullName, phone, referral_code: referralCode || null },
        },
      });
      setBusy(false);
      if (error) return toast({ title: "Could not create your account", description: error.message, variant: "destructive" });
      toast({ title: "Check your email", description: "We've sent you a link to confirm your account." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast({ title: "Could not sign in", description: error.message, variant: "destructive" });
      navigate("/account");
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/account");
  };

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-md mx-auto px-6 py-16 lg:py-24">
        <h1 className="font-display text-4xl text-foreground text-center">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-muted-foreground text-center mt-3">
          Your sessions, aftercare notes and bookings, all in one place.
        </p>

        {referralCode && (
          <div className="mt-6 rounded-2xl border border-primary/25 bg-accent-soft p-4 text-center">
            <p className="text-sm text-foreground">
              You've been invited by a friend — sign up with email and you'll both get
              <span className="font-medium"> ₹200 off</span> after your first session.
            </p>
          </div>
        )}

        <Button
          onClick={handleGoogle}
          variant="outline"
          className="w-full rounded-full h-12 mt-8 border-foreground/20"
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-4 my-6">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="rounded-full h-12" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-full h-12" placeholder="+91" />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-full h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-full h-12" />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signin" ? "New to Kuśala?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary underline underline-offset-4"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
      <Footer />
    </main>
  );
};

export default AuthPage;
