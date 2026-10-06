import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const readHashParams = () => {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash);
};

const ResetPassword = () => {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const hashParams = useMemo(readHashParams, []);
  const token =
    pathToken ||
    searchParams.get("token_hash") ||
    searchParams.get("token") ||
    hashParams.get("token_hash") ||
    hashParams.get("token") ||
    "";

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Missing reset link",
        description: "Open the reset link from your email to set a new password.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, email, password);
      toast({ title: "Password updated", description: "Sign in with your new password." });
      navigate("/auth", { replace: true });
    } catch (error) {
      toast({
        title: "Could not reset password",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-md mx-auto px-6 py-16 lg:py-24">
        <h1 className="font-display text-4xl text-foreground text-center">Choose a new password</h1>
        <p className="text-muted-foreground text-center mt-3">
          Use the email from your reset link, then enter a new password.
        </p>

        {!token && (
          <p className="text-sm text-destructive text-center mt-6">
            This page needs the token from your email link. Request a new reset from{" "}
            <Link to="/auth" className="underline underline-offset-4">
              sign in
            </Link>
            .
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-full h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-full h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="rounded-full h-12" />
          </div>
          <Button type="submit" disabled={busy || !token} className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Please wait…" : "Update password"}
          </Button>
        </form>
      </section>
      <Footer />
    </main>
  );
};

export default ResetPassword;
