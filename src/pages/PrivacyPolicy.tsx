import { useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Mail, Phone, Calendar, ChevronRight } from "lucide-react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Kuśala Privacy Policy | Kuśala";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Learn how Kusala Wellness LLP collects, uses, shares and protects your personal information."
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Nav />

      <main className="max-w-[960px] mx-auto px-6 py-16 lg:py-24 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">Privacy Policy</span>
        </nav>

        {/* Header */}
        <header className="space-y-4 border-b border-border pb-10 mb-12">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-accent border-accent/30 bg-accent/5 gap-1.5">
            <ShieldCheck className="size-3.5" />
            Legal & Trust
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground text-balance">
            Kuśala Privacy Policy
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 text-accent" />
            <span>Last updated: 19th November 2026</span>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed pt-2">
            This Privacy Policy explains how <strong className="text-foreground font-medium">Kusala Wellness LLP</strong> (“Kuśala”, “we”, “us”) collects, uses, shares and protects your personal information when you use the Kuśala website (<a href="https://kusala.in" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:text-accent/80">kusala.in</a>), our mobile app, and our events and pop-ups (together, the “Services”). Kuśala is a platform that helps you discover independent wellness guides and book sessions with them.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground italic bg-secondary/60 p-4 rounded-xl border border-border/70">
            By using the Services, you agree to this Policy. If you do not agree, please do not use the Services.
          </p>
        </header>

        {/* Content Sections */}
        <div className="space-y-12 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">1. Who we are</h2>
            <p>
              <strong className="text-foreground">Kusala Wellness LLP</strong> incorporated in Mumbai, India.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <a
                href="mailto:sahil.dhanani@kusala.in"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Mail className="size-3.5 text-accent" />
                sahil.dhanani@kusala.in
              </a>
              <a
                href="tel:+919819777244"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Phone className="size-3.5 text-accent" />
                +91 98197 77244
              </a>
            </div>
            <p>
              We handle personal information in line with applicable Indian law, including the Information Technology Act, 2000, the rules made under it, and the Digital Personal Data Protection Act, 2023.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-5">
            <h2 className="font-display text-2xl text-foreground">2. Information we collect</h2>
            
            <div className="space-y-3">
              <h3 className="font-medium text-foreground text-lg">Information you give us</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Account details:</strong> your name, email address and phone number, which we use to create your account and send one-time passwords.
                </li>
                <li>
                  <strong className="text-foreground">Booking details:</strong> the guide and craft you choose, whether the session is online or in person, your preferred dates and times, and any notes you choose to share.
                </li>
                <li>
                  <strong className="text-foreground">Billing details:</strong> your name, address and GST details, if you provide them for an invoice.
                </li>
                <li>
                  <strong className="text-foreground">Messages:</strong> anything you send us by email, WhatsApp or a form, including details you give us at our events and pop-ups.
                </li>
                <li>
                  <strong className="text-foreground">Reviews:</strong> any reviews or feedback you choose to post on the platform.
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-medium text-foreground text-lg">Information collected automatically</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Device and usage information:</strong> your device model, operating system, app version, IP address, the screens and pages you view, and crash reports.
                </li>
                <li>
                  <strong className="text-foreground">Notification token:</strong> so we can send you push notifications if you allow them.
                </li>
                <li>
                  <strong className="text-foreground">Location:</strong> only if you allow it, to show guides near you.
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-medium text-foreground text-lg">Payment information</h3>
              <p>
                Payments are processed by <strong className="text-foreground">Razorpay</strong>. We do not store your full card or UPI details on our servers.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-medium text-foreground text-lg">Information about your wellbeing</h3>
              <p>
                Some of what you share when booking or messaging may relate to your emotional, mental or physical wellbeing. Please share only what you are comfortable with. We use this information only to arrange your session and to support you. Kuśala is not a medical service, and our guides are independent practitioners who may keep their own session notes under their own responsibility.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">3. How we use your information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create and manage your account, and verify your phone number or email;</li>
              <li>Arrange, confirm and remind you about bookings, and pass the details your guide needs to them;</li>
              <li>Process payments, apply offers and issue invoices;</li>
              <li>Answer your questions and provide customer support;</li>
              <li>Improve the Services, fix problems, keep them secure and prevent fraud;</li>
              <li>Send you service messages and, if you agree, offers and updates, which you can opt out of at any time; and</li>
              <li>Meet our legal obligations, including tax and accounting requirements.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">4. Who we share it with</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">The guide you book:</strong> We share your name, contact details and the booking details needed for your session.
              </li>
              <li>
                <strong className="text-foreground">Service providers:</strong> Companies that help us run the Services, such as hosting and database providers, Google Firebase (sign-in, analytics and notifications), and Razorpay. They may use your information only to provide their services to us.
              </li>
              <li>
                <strong className="text-foreground">Authorities:</strong> Where the law requires it, or to protect the rights and safety of our users or others.
              </li>
              <li>
                <strong className="text-foreground">A successor:</strong> If Kuśala is part of a merger, sale or reorganisation, your information may transfer to the new owner, and we will tell you.
              </li>
            </ul>
            <p className="font-medium text-foreground bg-accent/5 border border-accent/20 p-4 rounded-xl">
              We do not sell your personal information. We do not use it to track you across other companies’ apps or websites for advertising.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">5. Where your information is processed</h2>
            <p>
              Some of our providers may process your information on servers outside India. When that happens, we take reasonable steps to make sure your information stays protected in accordance with applicable laws.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">6. How long we keep your information</h2>
            <p>
              We keep your information for as long as your account is active and as long as we need it to provide the Services. We may keep some records for longer where tax, accounting or other laws require it, or to resolve disputes. After that, we delete or anonymise it.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">7. Your choices and rights</h2>
            <p>You can:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ask to see the personal information we hold about you;</li>
              <li>Ask us to correct or update it;</li>
              <li>Delete your account in the app (<Link to="/settings" className="text-accent underline underline-offset-4">Settings &gt; Delete account</Link>) or by emailing us, after which we will delete your information, except what we must keep by law;</li>
              <li>Withdraw your consent to marketing messages or push notifications at any time, using the link in a message or your device settings; and</li>
              <li>Make a complaint to our Grievance Officer (details below). If you are not satisfied with our response, you may approach the authority set up under applicable law.</li>
            </ul>
            <p>
              To use any of these rights, contact us at{" "}
              <a href="mailto:sahil.dhanani@kusala.in" className="text-accent underline underline-offset-4 font-medium hover:text-accent/80">
                sahil.dhanani@kusala.in
              </a>.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">8. Children</h2>
            <p>
              The Services are meant for people aged 18 and over. We do not knowingly collect personal information from anyone under 18. If you believe a child has given us their information, please contact us and we will promptly delete it.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">9. Cookies and similar technologies</h2>
            <p>
              Our website uses cookies and similar tools to keep it working, remember your preferences and understand how it is used. You can control cookies through your browser settings, though some parts of the website may not work properly without them.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">10. Security</h2>
            <p>
              We use reasonable technical and organisational measures to protect your information. No system is completely secure, so we cannot guarantee absolute security. Please keep your account details and one-time passwords private.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">11. Links to other sites</h2>
            <p>
              The Services may link to websites or services run by others, including our guides. We are not responsible for their privacy practices, so please read their individual policies.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-foreground">12. Changes to this Policy</h2>
            <p>
              We may update this Policy from time to time. We will post the new version here with a new “Last updated” date, and tell you about important changes through the Services or by email.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-4 rounded-2xl bg-secondary/50 border border-border p-6 sm:p-8">
            <h2 className="font-display text-2xl text-foreground">13. Contact and Grievance Officer</h2>
            <p>
              If you have questions about this Policy or how we handle your information, or wish to raise a concern, please contact:
            </p>
            <div className="space-y-2 pt-1">
              <div>
                <strong className="text-foreground">Grievance Officer:</strong> Sahil Dhanani
              </div>
              <div>
                <strong className="text-foreground">Email:</strong>{" "}
                <a href="mailto:sahil.dhanani@kusala.in" className="text-accent underline underline-offset-4 hover:text-accent/80">
                  sahil.dhanani@kusala.in
                </a>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pt-2">
              We aim to acknowledge your message within 48 hours and respond within 30 days.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground pt-1 border-t border-border/80">
              This Policy is governed by the laws of India, and the courts at Mumbai, Maharashtra will have jurisdiction, subject to applicable law.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
