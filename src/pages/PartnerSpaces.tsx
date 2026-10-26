import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import {
  MapPin,
  Users,
  Search,
  ArrowUpRight,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  listPublicSpaces,
  formatSpaceScheduleSummary,
  parseSpaceSchedule,
  type Space,
  type SpaceImage,
} from "@/lib/spacesApi";
import { listPractitioners, type Practitioner } from "@/lib/practitionersApi";
import fallbackInterior from "@/assets/center-interior.jpg";

function parseAmenities(amenities: unknown): string[] {
  if (!amenities) return [];
  if (Array.isArray(amenities)) return amenities.filter(Boolean).map(String);
  if (typeof amenities === "string") {
    const trimmed = amenities.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {}
    }
    if (trimmed.includes(",")) {
      return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

export default function PartnerSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [allPractitioners, setAllPractitioners] = useState<Practitioner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    listPublicSpaces()
      .then((res) => {
        if (isMounted) {
          setSpaces(res.spaces || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load partner spaces:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    listPractitioners({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          setAllPractitioners(res.practitioners || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load practitioners for spaces:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute list of unique cities
  const cities = useMemo(() => {
    const set = new Set<string>();
    spaces.forEach((s) => {
      if (s.city && s.city.trim()) {
        set.add(s.city.trim());
      }
    });
    return ["All", ...Array.from(set).sort()];
  }, [spaces]);

  // Filtered spaces by search query and city
  const filteredSpaces = useMemo(() => {
    return spaces.filter((s) => {
      const matchesCity =
        selectedCity === "All" ||
        (s.city || "").toLowerCase() === selectedCity.toLowerCase();

      if (!matchesCity) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const name = (s.space_name || "").toLowerCase();
      const address = (s.address || "").toLowerCase();
      const city = (s.city || "").toLowerCase();
      const type = (s.space_type || "").toLowerCase();
      const amenities = parseAmenities(s.amenities).join(" ").toLowerCase();
      const notes = (s.notes || "").toLowerCase();

      return (
        name.includes(q) ||
        address.includes(q) ||
        city.includes(q) ||
        type.includes(q) ||
        amenities.includes(q) ||
        notes.includes(q)
      );
    });
  }, [spaces, selectedCity, searchQuery]);

  const handleOpenSpaceModal = (space: Space) => {
    setActiveSpace(space);
    setActivePhotoIndex(0);
  };

  const currentModalImages: SpaceImage[] = useMemo(() => {
    if (!activeSpace) return [];
    return [...(activeSpace.space_images || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }, [activeSpace]);

  const cityPractitioners = useMemo(() => {
    if (!activeSpace?.city) return [];
    const targetCity = activeSpace.city.trim().toLowerCase();
    return allPractitioners.filter(
      (p) => (p.city || "").trim().toLowerCase() === targetCity
    );
  }, [activeSpace, allPractitioners]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />

      {/* Hero Header */}
      <section className="px-6 lg:px-12 pt-12 pb-10 max-w-[1500px] mx-auto w-full">
        <div className="max-w-3xl">
          <span className="text-[11px] font-semibold tracking-[0.25em] text-accent uppercase block mb-3">
            Sanctuaries & Studios
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground font-normal tracking-tight leading-[1.15]">
            The Spaces
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Sacred, grounded environments curated for deep healing, sound
            journeys, breathwork, and transformative private sessions across India.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/70">
          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`rounded-full px-4 h-9 text-xs sm:text-sm font-medium tracking-wide transition-all ${
                  selectedCity === city
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by space, area, or amenity..."
              className="h-10 pl-9 pr-4 rounded-full bg-card border-border text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Spaces Directory */}
      <section className="px-6 lg:px-12 pb-20 max-w-[1500px] mx-auto w-full flex-1">
        {/* Host Callout Banner (Option 4) */}
        <div className="mb-8 rounded-2xl sm:rounded-[2rem] bg-secondary/50 border border-border/80 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <span className="size-11 rounded-full bg-accent/15 text-accent grid place-items-center shrink-0">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm sm:text-base font-medium text-foreground">
                Do you host a healing space, yoga studio, or quiet wellness room?
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Partner with Kuśala to open your doors to verified conscious practitioners and mindful clients.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-full shrink-0 h-10 px-6 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft"
          >
            <Link to="/list-your-space" className="inline-flex items-center gap-1.5">
              <span>List Your Space</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-[2rem] overflow-hidden border border-border p-6 animate-pulse"
              >
                <div className="w-full aspect-[16/10] bg-secondary/80 rounded-2xl mb-5" />
                <div className="h-6 bg-secondary rounded w-2/3 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/2 mb-4" />
                <div className="h-4 bg-secondary rounded w-full mb-2" />
                <div className="h-10 bg-secondary rounded-full mt-6" />
              </div>
            ))}
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="rounded-[2.5rem] border border-border bg-card p-12 sm:p-16 text-center max-w-xl mx-auto my-8 shadow-soft">
            <div className="size-14 rounded-full bg-secondary grid place-items-center mx-auto mb-4 text-muted-foreground">
              <Building2 className="size-7" />
            </div>
            <h2 className="font-display text-2xl text-foreground">
              No sanctuaries found
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              {searchQuery.trim()
                ? `We couldn't find any partner spaces matching "${searchQuery}".`
                : "There are currently no approved partner spaces in this city."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-full text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("All");
                }}
              >
                Reset Filters
              </Button>
              <Button asChild className="rounded-full text-xs">
                <Link to="/list-your-space">List Your Space</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredSpaces.map((space) => {
              const images = [...(space.space_images || [])].sort(
                (a, b) => a.sort_order - b.sort_order
              );
              const coverImage = images[0]?.image_url || fallbackInterior;
              const photoCount = images.length;
              const schedule = parseSpaceSchedule(space.availability);
              const scheduleSummary = space.availability
                ? schedule.legacy_text || schedule.summary || formatSpaceScheduleSummary(schedule)
                : null;
              const amenitiesList = parseAmenities(space.amenities);

              return (
                <article
                  key={space.id}
                  onClick={() => handleOpenSpaceModal(space)}
                  className="group bg-card rounded-[2rem] overflow-hidden border border-border shadow-soft hover:shadow-elegant transition-smooth flex flex-col cursor-pointer"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary select-none">
                    <img
                      src={coverImage}
                      alt={space.space_name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />

                    {/* Top Overlays */}
                    <div className="absolute top-3.5 left-3.5 pointer-events-none">
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                        {space.space_type || "Sanctuary"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & City */}
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display text-2xl text-foreground group-hover:text-accent transition-colors leading-snug">
                          {space.space_name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <MapPin className="size-3.5 text-accent shrink-0" />
                        <span className="truncate">
                          {space.city}
                          {space.address ? ` · ${space.address}` : ""}
                        </span>
                      </div>

                      {/* Specs / Meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3.5 text-xs text-muted-foreground">
                        {space.capacity > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5 text-muted-foreground/70" />
                            Up to {space.capacity} guests
                          </span>
                        )}
                        {scheduleSummary && scheduleSummary !== "Closed" && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5 text-muted-foreground/70" />
                            {scheduleSummary}
                          </span>
                        )}
                      </div>

                      {/* Amenities Pills */}
                      {amenitiesList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {amenitiesList.slice(0, 3).map((amenity, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-full bg-secondary/80 text-[11px] text-muted-foreground"
                            >
                              {amenity}
                            </span>
                          ))}
                          {amenitiesList.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-[11px] text-muted-foreground">
                              +{amenitiesList.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/80">
                      <span className="text-xs font-medium text-accent inline-flex items-center gap-1 group-hover:underline underline-offset-4">
                        View sanctuary details
                        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="rounded-full text-xs h-8 px-3.5 bg-secondary hover:bg-secondary/80 text-foreground"
                      >
                        Explore
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom Callout: List Your Space */}
        <div className="mt-20 rounded-[2.5rem] bg-secondary/40 border border-border/70 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent block mb-2">
              For Space Owners & Hosts
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground">
              Do you host a healing space or wellness studio?
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Partner with Kuśala to open your doors to verified, conscious
              practitioners and mindful clients looking for sacred rooms.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full px-8 shrink-0">
            <Link to="/list-your-space">List Your Space</Link>
          </Button>
        </div>
      </section>

      {/* Sanctuary Detail & Lightbox Dialog */}
      <Dialog
        open={!!activeSpace}
        onOpenChange={(open) => !open && setActiveSpace(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] p-0 bg-card border-border shadow-2xl">
          {activeSpace && (
            <div>
              {/* Photo Carousel Area */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-black/95 overflow-hidden flex items-center justify-center select-none">
                <img
                  src={
                    currentModalImages[activePhotoIndex]?.image_url ||
                    fallbackInterior
                  }
                  alt={`${activeSpace.space_name} photo ${activePhotoIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                />

                {/* Left / Right Nav Arrows */}
                {currentModalImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) =>
                          prev === 0 ? currentModalImages.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) =>
                          prev === currentModalImages.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}

                {/* Counter Badge */}
                {currentModalImages.length > 0 && (
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-black/70 text-white backdrop-blur-md border border-white/10 shadow-sm">
                    {activePhotoIndex + 1} / {currentModalImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {currentModalImages.length > 1 && (
                <div className="p-3 bg-secondary/30 border-b border-border flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {currentModalImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative size-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        activePhotoIndex === idx
                          ? "border-accent ring-1 ring-accent"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Space Info Body */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Header Title & Badges */}
                <DialogHeader className="text-left space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent/15 text-accent">
                      {activeSpace.space_type || "Partner Sanctuary"}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground">
                      {activeSpace.city}
                    </span>
                  </div>

                  <DialogTitle className="font-display text-3xl sm:text-4xl text-foreground">
                    {activeSpace.space_name}
                  </DialogTitle>

                  <DialogDescription className="text-sm text-muted-foreground flex items-center gap-1.5 pt-1">
                    <MapPin className="size-4 text-accent shrink-0" />
                    <span>
                      {activeSpace.address}, {activeSpace.city} — {activeSpace.pin}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                {/* Key Specs Card */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/70 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Capacity
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Users className="size-3.5 text-accent" />
                      Up to {activeSpace.capacity} people
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Atmosphere
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="size-3.5 text-accent" />
                      Grounded & Quiet
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Status
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 text-emerald-600">
                      <CheckCircle2 className="size-3.5" />
                      Verified Partner
                    </span>
                  </div>
                </div>

                {/* Amenities List */}
                {(() => {
                  const modalAmenities = parseAmenities(activeSpace.amenities);
                  if (modalAmenities.length === 0) return null;
                  return (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sanctuary Amenities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {modalAmenities.map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs text-foreground font-medium border border-border/50"
                          >
                            <Sparkles className="size-3 text-accent" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Description & Internal Guidelines */}
                {activeSpace.notes && (
                  <div className="space-y-2 pt-2 border-t border-border/70">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      About the Space & Guidelines
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-secondary/20 p-4 rounded-2xl border border-border/50">
                      {activeSpace.notes}
                    </p>
                  </div>
                )}

                {/* Operating Schedule */}
                {(() => {
                  if (!activeSpace.availability) return null;
                  const schedule = parseSpaceSchedule(activeSpace.availability);
                  const summary = schedule.legacy_text || schedule.summary || formatSpaceScheduleSummary(schedule);
                  if (!summary || summary === "Closed") return null;
                  return (
                    <div className="space-y-2 pt-2 border-t border-border/70">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Availability Window
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/20 p-3 rounded-2xl border border-border/50">
                        <Clock className="size-4 text-accent" />
                        <span>{summary}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Local Healers in this City Preview */}
                <div className="space-y-3 pt-3 border-t border-border/70">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3 text-accent" />
                      Vetted Guides in {activeSpace.city}
                      <span className="text-foreground font-medium">({cityPractitioners.length})</span>
                    </h3>
                    {cityPractitioners.length > 0 && (
                      <Link
                        to={`/guides?city=${encodeURIComponent(activeSpace.city)}`}
                        onClick={() => setActiveSpace(null)}
                        className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                      >
                        View all
                        <ArrowUpRight className="size-3" />
                      </Link>
                    )}
                  </div>

                  {cityPractitioners.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {cityPractitioners.slice(0, 4).map((prac) => (
                        <Link
                          key={prac.slug}
                          to={`/guides?city=${encodeURIComponent(activeSpace.city)}`}
                          onClick={() => setActiveSpace(null)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border/60 transition-colors group text-left"
                        >
                          <div className="size-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border">
                            {prac.image_url ? (
                              <img
                                src={prac.image_url}
                                alt={prac.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-accent bg-accent/10">
                                {prac.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground group-hover:text-accent transition-colors truncate">
                              {prac.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {prac.craft || "Holistic Practitioner"}
                            </p>
                          </div>
                          <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-accent shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-2xl border border-border/40 leading-relaxed">
                      No practitioners registered locally in {activeSpace.city} yet. You can connect with guides offering online sessions across India.
                    </p>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full w-full sm:w-auto text-xs"
                    onClick={() => setActiveSpace(null)}
                  >
                    Close
                  </Button>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      asChild
                      className="rounded-full w-full sm:w-auto text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Link
                        to={`/guides?city=${encodeURIComponent(activeSpace.city)}`}
                        onClick={() => setActiveSpace(null)}
                      >
                        Explore Healers in {activeSpace.city} {cityPractitioners.length > 0 ? `(${cityPractitioners.length})` : ""}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Action Pill */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <Button
          asChild
          className="rounded-full shadow-2xl bg-foreground text-background hover:bg-foreground/90 h-11 px-5 text-xs font-medium tracking-wide border border-border/40 backdrop-blur-md flex items-center gap-2 group cursor-pointer"
        >
          <Link to="/list-your-space">
            <Building2 className="size-3.5 text-accent" />
            <span>List Your Space</span>
            <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-background transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Button>
      </div>

      <Footer />
    </main>
  );
}
