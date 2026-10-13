import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Share2, 
  Check, 
  MapPin, 
  Sparkles, 
  Bookmark, 
  Loader2 
} from "lucide-react";
import { getBlogBySlug, type Blog } from "@/lib/blogsApi";
import { listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import { toast } from "sonner";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [author, setAuthor] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getBlogBySlug(slug)
      .then((data) => {
        setBlog(data);
        // Look up author in practitioners
        listPractitioners({ limit: 100 })
          .then((pData) => {
            const matched = pData.practitioners.find(
              (p) =>
                (data.practitioner_slug && p.slug === data.practitioner_slug) ||
                (data.author?.practitioner_slug && p.slug === data.author.practitioner_slug) ||
                (data.author?.full_name && p.name && data.author.full_name.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
                p.id === data.author_id ||
                (p as any).user_id === data.author_id
            );
            if (matched) setAuthor(matched);
          })
          .catch(() => {});
      })
      .catch((err) => {
        console.error("Failed to load blog:", err);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const readingTime = blog?.content
    ? Math.max(1, Math.round(blog.content.split(/\s+/).length / 200))
    : 3;

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground text-sm">Opening article…</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="max-w-2xl mx-auto px-6 py-28 text-center">
          <h1 className="font-display text-4xl mb-4 text-foreground">Article not found</h1>
          <p className="text-muted-foreground mb-8">
            This article may have been unpublished or moved.
          </p>
          <Button asChild className="rounded-full px-8 bg-primary">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* ARTICLE HEADER & HERO */}
      <article className="max-w-[850px] mx-auto px-6 lg:px-8 pt-10 sm:pt-16 pb-20">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8 transition-colors group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        {/* Category & Metadata */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {blog.category && (
            <Badge variant="outline" className="rounded-full px-3 py-1 bg-secondary border-border/80 text-xs font-medium text-accent">
              {blog.category}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {new Date(blog.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {readingTime} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl sm:text-5xl lg:text-[3.25rem] leading-[1.15] tracking-tight mb-8 text-balance text-foreground">
          {blog.title}
        </h1>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed mb-8 border-l-2 border-accent/40 pl-5 italic">
            "{blog.excerpt}"
          </p>
        )}

        {/* Author Byline Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-border/70 mb-10">
          <div className="flex items-center gap-3">
            {author?.image_url ? (
              <img
                src={author.image_url}
                alt={author.name}
                className="size-12 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-12 rounded-full bg-secondary text-foreground font-display font-medium flex items-center justify-center border border-border">
                {author?.name ? author.name.charAt(0) : "G"}
              </div>
            )}
            <div>
              <div className="font-medium text-sm text-foreground">
                {author?.name || "Kuśala Guide"}
              </div>
              <div className="text-xs text-muted-foreground">
                {author?.craft || "Holistic Practitioner"}
                {author?.city && ` · ${author.city}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="rounded-full h-9 px-4 text-xs font-medium border-border/80 hover:bg-secondary hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 mr-1.5 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="size-3.5 mr-1.5 text-muted-foreground" /> Share Article
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Featured Cover Image */}
        {blog.featured_image && (
          <div className="rounded-[2rem] overflow-hidden aspect-[16/9] mb-12 border border-border shadow-soft bg-secondary">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ARTICLE BODY */}
        <div className="space-y-6 text-foreground/90 text-base sm:text-lg leading-[1.8] font-light">
          {blog.content.split(/\n+/).filter((l) => l.trim()).map((para, i) => {
            const line = para.trim();

            // Headings
            if (line.startsWith("### ")) {
              return (
                <h3 key={i} className="font-display text-xl sm:text-2xl font-medium pt-4 text-foreground">
                  {line.replace("### ", "")}
                </h3>
              );
            }
            if (line.startsWith("## ") || (line.length < 50 && !line.endsWith(".") && !line.startsWith("-"))) {
              return (
                <h2 key={i} className="font-display text-2xl sm:text-3xl font-medium pt-6 pb-1 text-foreground">
                  {line.replace("## ", "")}
                </h2>
              );
            }

            // Blockquote
            if (line.startsWith("> ")) {
              return (
                <blockquote key={i} className="border-l-2 border-accent pl-5 py-2 my-6 italic text-foreground/80 font-serif text-xl">
                  {line.replace("> ", "")}
                </blockquote>
              );
            }

            // Bullet items
            if (line.startsWith("- ") || line.startsWith("• ")) {
              return (
                <div key={i} className="flex items-start gap-3 pl-2 sm:pl-4">
                  <span className="size-1.5 rounded-full bg-accent mt-3 shrink-0" />
                  <p className="flex-1">{line.slice(2)}</p>
                </div>
              );
            }

            // Standard paragraph
            return <p key={i}>{line}</p>;
          })}
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-10 mt-12 border-t border-border/70">
            <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">Topics:</span>
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-3.5 py-1 text-xs text-muted-foreground border border-border/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* PRACTITIONER CALL TO ACTION CARD */}
        {author && (
          <div className="mt-14 p-8 sm:p-10 rounded-[2.5rem] bg-card border border-border shadow-elegant relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {author.image_url && (
                <img
                  src={author.image_url}
                  alt={author.name}
                  className="size-24 sm:size-28 rounded-2xl object-cover shrink-0 border border-border"
                />
              )}
              <div className="flex-1 text-center sm:text-left">
                <span className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium">
                  Author & Practitioner
                </span>
                <h3 className="font-display text-2xl sm:text-3xl mt-1 text-foreground">
                  Experience this healing with {author.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
                  {author.bio?.slice(0, 160)}…
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Session Fee</div>
                    <div className="font-display text-xl text-foreground font-medium">
                      ₹{author.price_inr.toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-muted-foreground"> /session</span>
                    </div>
                  </div>
                  {author.bookable ? (
                    <Button asChild className="rounded-full h-11 px-7 bg-primary text-primary-foreground hover:bg-primary/90 ml-auto">
                      <Link to={`/book?practitioner=${author.slug}`}>
                        Book a session with {author.name.split(" ")[0]}
                      </Link>
                    </Button>
                  ) : (
                    <span className="rounded-full bg-secondary text-muted-foreground h-11 px-6 inline-flex items-center text-xs font-medium ml-auto">
                      Schedule coming soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </article>

      <Footer />
    </main>
  );
}
