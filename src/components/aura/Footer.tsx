const Footer = () => (
  <footer className="bg-background border-t border-border">
    <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-20">
      <div className="grid md:grid-cols-3 gap-12 mb-16">
        {[
          { h: "Discover", l: [
            { label: "All modalities", href: "/#modalities" },
            { label: "Practitioners", href: "/book" },
            { label: "Partner centers", href: "/book" },
            { label: "Refer a friend", href: "/account" },
          ]},
          { h: "For Healers", l: [
            { label: "Apply to join", href: "mailto:sahil.dhanani@kusala.in?subject=Practitioner%20Application%20%E2%80%94%20Ku%C5%9Bala" },
            { label: "List your space", href: "/list-your-space" },
            { label: "Tools & pricing", href: "/#healers" },
            { label: "Practitioner academy", href: "/#healers" },
            { label: "Stories", href: "/#healers" },
          ]},
          { h: "Company", l: [
            { label: "About", href: "/#about" },
            { label: "Trust & safety", href: "/values" },
            { label: "Journal", href: "/guides" },
            { label: "Contact", href: "mailto:sahil.dhanani@kusala.in" },
          ]},
        ].map((c) => (
          <div key={c.h}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-5">{c.h}</div>
            <ul className="flex flex-col gap-3">
              {c.l.map((li) => (
                <li key={li.label}><a href={li.href} className="text-foreground hover:text-accent transition-colors">{li.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} Kuśala. Wellness simplified.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
