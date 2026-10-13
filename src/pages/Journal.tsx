import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  BookOpen, 
  Sparkles,
  Loader2 
} from "lucide-react";
import { listPublishedBlogs, type Blog } from "@/lib/blogsApi";

const FALLBACK_BLOG_IMAGES = [
  "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512290900672-1f55a1d7c366?auto=format&fit=crop&w=1200&q=80",
];

export default function Journal() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    setLoading(true);
    listPublishedBlogs({ limit: 100 })
      .then((res) => {
        setBlogs(res.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load blogs:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category?.trim()) set.add(b.category.trim());
    });
    return ["All", ...Array.from(set)];
  }, [blogs]);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesCategory =
        selectedCategory === "All" ||
        b.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  const featured = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
  const remaining = filteredBlogs.length > 0 ? filteredBlogs.slice(1) : [];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />

        {/* HERO HEADER */}
        <section className="max-w-[1200px] mx-auto px-6 lg:px-12 pt-12 pb-8 sm:pt-20 sm:pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border text-xs text-accent font-medium mb-5">
            <Sparkles className="size-3.5" />
            <span>Wisdom &amp; Practice</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl tracking-tight text-foreground text-balance">
            The Kuśala Journal
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Essays, practices, and perspectives from our vetted alternative healing practitioners on balance, mindfulness, and holistic wellness.
          </p>

          {/* SEARCH & FILTERS */}
          <div className="mt-10 max-w-xl mx-auto flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by topic, keyword, or guide…"
                className="pl-11 pr-4 h-12 rounded-full bg-secondary/40 border-border text-sm placeholder:text-muted-foreground"
              />
            </div>

            {/* Category Pills */}
            {categories.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-4 py-1.5 rounded-full border transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border hover:border-accent/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ARTICLES CONTENT */}
        <section className="max-w-[1200px] mx-auto px-6 lg:px-12 pb-24">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Gathering articles…</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-border bg-card p-8">
              <BookOpen className="size-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-display text-2xl text-foreground">No articles found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "All"
                  ? "Try adjusting your search query or choosing a different category filter."
                  : "New articles and reflections are coming soon from our practitioners."}
              </p>
              {(searchQuery || selectedCategory !== "All") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="rounded-full mt-6 text-xs h-9 px-5"
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {/* FEATURED STORY */}
              {featured && (
                <Link
                  to={`/journal/${featured.slug}`}
                  className="group block rounded-3xl border border-border bg-card overflow-hidden hover:border-accent/40 hover:shadow-soft transition-all duration-300"
                >
                  <div className="grid md:grid-cols-2 gap-6 lg:gap-8 p-6 sm:p-8 items-center">
                    <div className="relative aspect-[16/10] md:aspect-auto md:h-full min-h-[260px] rounded-2xl overflow-hidden bg-secondary">
                      <img
                        src={featured.featured_image || FALLBACK_BLOG_IMAGES[0]}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-between py-2 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          {featured.category && (
                            <Badge variant="outline" className="rounded-full px-3 py-1 bg-secondary text-xs font-medium text-accent border-border/80">
                              {featured.category}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {Math.max(1, Math.round((featured.content?.split(/\s+/).length || 200) / 200))} min read
                          </span>
                        </div>
                        <h2 className="font-display text-2xl sm:text-4xl text-foreground group-hover:text-accent transition-colors leading-tight">
                          {featured.title}
                        </h2>
                        {featured.excerpt && (
                          <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed">
                            {featured.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {new Date(featured.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                          <span>Read article</span>
                          <ArrowUpRight className="size-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* REMAINING ARTICLES GRID */}
              {remaining.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {remaining.map((b, idx) => (
                    <Link
                      key={b.id}
                      to={`/journal/${b.slug}`}
                      className="group flex flex-col justify-between rounded-3xl border border-border bg-card overflow-hidden hover:border-accent/40 hover:shadow-soft transition-all duration-300 p-6"
                    >
                      <div className="space-y-4">
                        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-secondary">
                          <img
                            src={b.featured_image || FALLBACK_BLOG_IMAGES[(idx + 1) % FALLBACK_BLOG_IMAGES.length]}
                            alt={b.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {b.category && (
                            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 bg-secondary text-[11px] font-medium text-accent border-border/80">
                              {b.category}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {Math.max(1, Math.round((b.content?.split(/\s+/).length || 200) / 200))} min read
                          </span>
                        </div>
                        <h3 className="font-display text-xl text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2">
                          {b.title}
                        </h3>
                        {b.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {b.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(b.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-accent group-hover:translate-x-0.5 transition-transform">
                          <span>Read</span>
                          <ArrowUpRight className="size-3.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
