import { useState } from "react";
import { submitContact } from "@/lib/contactApi";
import { Button } from "@/components/ui/button";
import coupleImage from "@/assets/waitlist-couple.jpg";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      await submitContact({
        name: "Waitlist Signup",
        email: trimmed,
        message: "User wants to join the waitlist for the app."
      });
    } catch (error: any) {
      if (error.message && error.message.includes("already")) {
        setStatus("done");
        setMessage("You\'re already on the list — we\'ll be in touch soon.");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
      return;
    }
    setStatus("done");
    setMessage("You're on the list. We'll email you the moment the app is ready.");
  };

  return (
    <section id="waitlist" className="bg-background py-24 lg:py-32">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={coupleImage}
              alt="A fair-skinned North Indian couple running together in a park at sunrise"
              loading="lazy"
              width={1024}
              height={768}
              className="w-full h-auto rounded-2xl"
            />
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium">Coming soon</span>
            <h2 className="font-sans font-semibold text-4xl md:text-5xl lg:text-6xl mt-4 text-balance text-foreground">
              Join the waitlist for the Kuśala app.
            </h2>
            <p className="mt-6 text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
              Your sessions, practitioners and guided wellness library — in your pocket. Be first in line when the app launches.
            </p>

            {status === "done" ? (
              <p className="mt-8 text-accent font-medium text-lg">{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="flex-1 h-12 rounded-full border border-input bg-transparent px-5 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-12 rounded-full px-8 text-base"
                >
                  {status === "loading" ? "Joining…" : "Join the waitlist"}
                </Button>
              </form>
            )}
            {status === "error" && <p className="mt-3 text-sm text-destructive">{message}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
