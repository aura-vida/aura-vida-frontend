import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const SIGN_IN_CODE_LENGTH = 6;

type AuthView = "signin" | "signup" | "forgot" | "confirm";
type SignMethod = "password" | "code";

const otpWaitSeconds = (message: string) => {
  const match = message.match(/after (\d+) seconds/i);
  if (match) return Number(match[1]);
  if (/security purposes/i.test(message)) return 60;
  return null;
};

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const referralCode = (searchParams.get("ref") ?? "").trim().toUpperCase();
  const requestedView = searchParams.get("view");
  const redirectTo = searchParams.get("redirect") || "/account";
  const [view, setView] = useState<AuthView>(
    requestedView === "signup" || referralCode ? "signup" : requestedView === "forgot" ? "forgot" : "signin"
  );
  const [signMethod, setSignMethod] = useState<SignMethod>("password");
  const [codeSent, setCodeSent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, sendOtp, verifyOtp, requestPasswordReset } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const goSignIn = () => {
    setOtp("");
    setCodeSent(false);
    setSignMethod("password");
    setView("signin");
  };

  const sendSignInCode = async () => {
    try {
      await sendOtp(email);
      setOtp("");
      setCodeSent(true);
      setResendIn(60);
      toast({
        title: "Email sent",
        description: "Enter the 6-digit code from your email.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const wait = otpWaitSeconds(message);
      if (wait != null) {
        setOtp("");
        setCodeSent(true);
        setResendIn(wait);
        toast({
          title: "Code already sent",
          description: `Check your inbox. You can resend in ${wait} seconds.`,
        });
        return;
      }
      throw error;
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(redirectTo);
    } catch (error) {
      toast({
        title: "Could not sign in",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await sendSignInCode();
    } catch (error) {
      toast({
        title: "Could not send code",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signUp({ email, password, name: fullName, referral_code: referralCode || undefined });
      if (result.session?.access_token && result.user) {
        navigate(redirectTo);
        return;
      }
      setView("confirm");
      toast({
        title: "Check your email",
        description: "Tap Confirm email address in the Kusala message, then sign in.",
      });
    } catch (error) {
      toast({
        title: "Could not create your account",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(email);
      toast({
        title: "Check your email",
        description: "Open the reset link we sent, then choose a new password.",
      });
      goSignIn();
    } catch (error) {
      toast({
        title: "Could not send reset email",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0) return;
    setBusy(true);
    try {
      await sendSignInCode();
    } catch (error) {
      toast({
        title: "Could not send code",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== SIGN_IN_CODE_LENGTH) {
      toast({ title: `Enter the ${SIGN_IN_CODE_LENGTH}-digit sign-in code`, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(email, otp);
      navigate(redirectTo);
    } catch (error) {
      toast({
        title: "Could not verify the code",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const heading =
    view === "signup"
      ? "Create your account"
      : view === "forgot"
        ? "Reset your password"
        : view === "confirm"
          ? "Confirm your email"
          : "Welcome back";

  const pillTriggerClass =
    "rounded-full h-10 text-sm shadow-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-md mx-auto px-6 py-16 lg:py-24">
        <h1 className="font-display text-4xl text-foreground text-center">{heading}</h1>
        <p className="text-muted-foreground text-center mt-3">
          Your sessions, aftercare notes and bookings, all in one place.
        </p>

        {referralCode && view === "signup" && (
          <div className="mt-6 rounded-2xl border border-primary/25 bg-accent-soft p-4 text-center">
            <p className="text-sm text-foreground">
              You've been invited by a friend — sign up with email and you'll both get
              <span className="font-medium"> ₹200 off</span> after your first session.
            </p>
          </div>
        )}

        {view === "signin" && (
          <div className="mt-8">
            {signMethod === "password" ? (
              <form onSubmit={handlePasswordSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="username email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-full h-12"
                  />
                </div>

                <Tabs value={signMethod} onValueChange={(value) => setSignMethod(value as SignMethod)}>
                  <TabsList className="grid w-full grid-cols-2 h-12 rounded-full bg-muted p-1">
                    <TabsTrigger value="password" className={pillTriggerClass}>
                      Password
                    </TabsTrigger>
                    <TabsTrigger value="code" className={pillTriggerClass}>
                      Email code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="password" className="mt-5 space-y-4 focus-visible:ring-0">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password">Password</Label>
                      <PasswordInput
                        id="signin-password"
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="rounded-full h-12"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setView("forgot")} className="text-sm text-primary underline underline-offset-4">
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" disabled={busy} className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                      {busy ? "Please wait…" : "Sign in"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="code-email">Email</Label>
                  <Input
                    id="code-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-full h-12"
                  />
                </div>

                <Tabs value={signMethod} onValueChange={(value) => setSignMethod(value as SignMethod)}>
                  <TabsList className="grid w-full grid-cols-2 h-12 rounded-full bg-muted p-1">
                    <TabsTrigger value="password" className={pillTriggerClass}>
                      Password
                    </TabsTrigger>
                    <TabsTrigger value="code" className={pillTriggerClass}>
                      Email code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="mt-5 focus-visible:ring-0">
                    {!codeSent ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">
                          We’ll email a 6-digit sign-in code.
                        </p>
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={handleSendCode}
                          className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {busy ? "Sending code…" : "Send sign-in code"}
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                          Enter the 6-digit code from your email.
                        </p>
                        <div className="flex justify-center">
                          <InputOTP maxLength={SIGN_IN_CODE_LENGTH} value={otp} onChange={setOtp}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <Button
                          type="submit"
                          disabled={busy || otp.length !== SIGN_IN_CODE_LENGTH}
                          className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {busy ? "Please wait…" : "Sign in with code"}
                        </Button>
                        <button
                          type="button"
                          disabled={busy || resendIn > 0}
                          onClick={handleResendOtp}
                          className="w-full text-sm text-muted-foreground underline underline-offset-4 disabled:no-underline disabled:opacity-60"
                        >
                          {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                        </button>
                      </form>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4 mt-8">
            <div className="space-y-1.5">
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                id="signup-name"
                name="name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="rounded-full h-12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-phone">Phone</Label>
              <Input
                id="signup-phone"
                name="tel"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-full h-12"
                placeholder="+91"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-full h-12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput
                id="signup-password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-full h-12"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
              {busy ? "Please wait…" : "Create account"}
            </Button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              We'll email a reset link. Open it to choose a new password.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-full h-12"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90">
              {busy ? "Please wait…" : "Send reset link"}
            </Button>
          </form>
        )}

        {view === "confirm" && (
          <div className="space-y-4 mt-8 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent <span className="text-foreground font-medium">Confirm your email address</span> to{" "}
              <span className="text-foreground font-medium">{email}</span>. Tap that button, then sign in
              with your password. That mail is not a sign-in code.
            </p>
            <Button
              type="button"
              onClick={goSignIn}
              className="w-full rounded-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              I've confirmed — sign in
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {view === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={goSignIn} className="text-primary underline underline-offset-4">
                Sign in
              </button>
            </>
          ) : view === "signin" ? (
            <>
              New to Kuśala?{" "}
              <button type="button" onClick={() => setView("signup")} className="text-primary underline underline-offset-4">
                Create an account
              </button>
            </>
          ) : (
            <button type="button" onClick={goSignIn} className="text-primary underline underline-offset-4">
              Back to sign in
            </button>
          )}
        </p>
      </section>
      <Footer />
    </main>
  );
};

export default AuthPage;
