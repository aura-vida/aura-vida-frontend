import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Building2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Loader2,
  ImagePlus,
  X,
  Lock,
  Calendar,
  Eye,
  Crop,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { isImageTooLarge, IMAGE_TOO_LARGE_MESSAGE } from "@/lib/fileValidation";
import { cn } from "@/lib/utils";
import AuraPagination from "@/components/aura/AuraPagination";
import {
  adminListSpaces,
  adminCreateSpace,
  adminUpdateSpace,
  adminUpdateSpaceStatus,
  adminDeleteSpace,
  adminUploadSpaceImages,
  adminDeleteSpaceImage,
  adminReleaseSpaceSlot,
  parseSpaceSchedule,
  formatSpaceScheduleSummary,
  formatTime12h,
  type Space,
  type SpaceImage,
  type SpaceSchedule,
} from "@/lib/spacesApi";
import ConfirmDialog from "@/components/aura/ConfirmDialog";
import SpaceScheduleEditor from "@/components/aura/SpaceScheduleEditor";
import ImageCropDialog from "@/components/aura/ImageCropDialog";
import PackSpaceSlotDialog from "@/components/aura/PackSpaceSlotDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { compressImageFile } from "@/lib/cropImage";
import { fetchSafeImageBlobUrl } from "@/lib/safeImageFetch";

const STATUS_CONFIG: Record<
  Space["status"],
  { label: string; badgeClass: string; dotClass: string }
> = {
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  new: {
    label: "New",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  contacted: {
    label: "Contacted",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  declined: {
    label: "Declined",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
};

const blankSpace = (): Partial<Space> => ({
  space_name: "",
  space_type: "",
  contact_name: "",
  email: "",
  phone: "",
  city: "",
  pin: "",
  capacity: 10,
  address: "",
  amenities: [],
  availability: "",
  notes: "",
  status: "approved",
});

const SpaceListingsAdmin = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("");

  // UI Expand / Edit states
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  const [editedSpaces, setEditedSpaces] = useState<Record<string, Partial<Space>>>({});

  // Create Space Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSpace, setNewSpace] = useState<Partial<Space>>(blankSpace());
  const [newAmenitiesStr, setNewAmenitiesStr] = useState("");
  const [newSpaceFiles, setNewSpaceFiles] = useState<File[]>([]);
  const [newSpacePreviews, setNewSpacePreviews] = useState<string[]>([]);
  const [newSpaceImageError, setNewSpaceImageError] = useState(false);

  // Photo gallery state
  const [uploadingImagesFor, setUploadingImagesFor] = useState<Record<string, boolean>>({});
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  interface CropQueueItem {
    file: File;
    previewUrl: string;
  }

  const [cropQueue, setCropQueue] = useState<{
    items: CropQueueItem[];
    currentIndex: number;
    processedFiles: File[];
    target: { type: "existing"; spaceId: string } | { type: "new" };
  } | null>(null);

  const startCropForExistingSpace = (spaceId: string, fileList: FileList | null) => {
    const allFiles = fileList ? Array.from(fileList) : [];
    if (allFiles.length === 0) return;
    const validFiles = allFiles.filter(
      (f) => !["heic", "heif"].includes(f.name.split(".").pop()?.toLowerCase() || "")
    );
    if (validFiles.length < allFiles.length) {
      toast.error("iPhone HEIC photos cannot be displayed by web browsers. Please select a JPG, PNG, or WEBP photo.");
    }
    if (validFiles.length === 0) return;

    const items = validFiles.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setCropQueue({
      items,
      currentIndex: 0,
      processedFiles: [],
      target: { type: "existing", spaceId },
    });
  };

  const startCropForNewSpace = (fileList: FileList | null) => {
    const allFiles = fileList ? Array.from(fileList) : [];
    if (allFiles.length === 0) return;
    const validFiles = allFiles.filter(
      (f) => !["heic", "heif"].includes(f.name.split(".").pop()?.toLowerCase() || "")
    );
    if (validFiles.length < allFiles.length) {
      toast.error("iPhone HEIC photos cannot be displayed by web browsers. Please select a JPG, PNG, or WEBP photo.");
    }
    if (validFiles.length === 0) return;

    const items = validFiles.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setCropQueue({
      items,
      currentIndex: 0,
      processedFiles: [],
      target: { type: "new" },
    });
  };

  const handleQueueCropSave = async (croppedFile: File) => {
    if (!cropQueue) return;
    const updatedProcessed = [...cropQueue.processedFiles, croppedFile];
    const nextIndex = cropQueue.currentIndex + 1;

    if (nextIndex < cropQueue.items.length) {
      setCropQueue({
        ...cropQueue,
        currentIndex: nextIndex,
        processedFiles: updatedProcessed,
      });
    } else {
      const target = cropQueue.target;
      cropQueue.items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setCropQueue(null);

      if (target.type === "existing") {
        await executeUploadSpaceImages(target.spaceId, updatedProcessed);
      } else {
        await addNewSpaceFilesDirectly(updatedProcessed);
      }
    }
  };

  const handleQueueSkip = async () => {
    if (!cropQueue) return;
    const currentOriginalFile = cropQueue.items[cropQueue.currentIndex].file;
    const optimizedFile = await compressImageFile(currentOriginalFile);
    const updatedProcessed = [...cropQueue.processedFiles, optimizedFile];
    const nextIndex = cropQueue.currentIndex + 1;

    if (nextIndex < cropQueue.items.length) {
      setCropQueue({
        ...cropQueue,
        currentIndex: nextIndex,
        processedFiles: updatedProcessed,
      });
    } else {
      const target = cropQueue.target;
      cropQueue.items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setCropQueue(null);

      if (target.type === "existing") {
        await executeUploadSpaceImages(target.spaceId, updatedProcessed);
      } else {
        await addNewSpaceFilesDirectly(updatedProcessed);
      }
    }
  };

  const handleQueueCancel = () => {
    if (!cropQueue) return;
    cropQueue.items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setCropQueue(null);
  };

  // Full-photo preview modal state
  const [previewTarget, setPreviewTarget] = useState<{
    open: boolean;
    space: Space;
    image: SpaceImage;
  } | null>(null);

  // Single-photo adjust/crop modal state for already saved photos
  const [adjustTarget, setAdjustTarget] = useState<{
    open: boolean;
    spaceId: string;
    imageId: string;
    spaceName: string;
    src: string;
    fileName: string;
  } | null>(null);
  const [isPreparingAdjust, setIsPreparingAdjust] = useState<string | null>(null);

  const startAdjustSavedPhoto = async (space: Space, img: SpaceImage) => {
    setIsPreparingAdjust(img.id);
    try {
      const blobUrl = await fetchSafeImageBlobUrl(img.image_url);
      setAdjustTarget({
        open: true,
        spaceId: space.id,
        imageId: img.id,
        spaceName: space.space_name,
        src: blobUrl,
        fileName: "adjusted-photo.jpg",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load image for framing");
    } finally {
      setIsPreparingAdjust(null);
    }
  };

  const handleSaveAdjustedPhoto = async (croppedFile: File) => {
    if (!adjustTarget) return;
    const { spaceId, imageId, src } = adjustTarget;
    if (src.startsWith("blob:")) {
      URL.revokeObjectURL(src);
    }
    setAdjustTarget(null);
    setUploadingImagesFor((prev) => ({ ...prev, [spaceId]: true }));
    try {
      const res = await adminUploadSpaceImages(spaceId, [croppedFile]);
      const newImage = res.images?.[0];
      if (newImage) {
        await adminDeleteSpaceImage(spaceId, imageId);
        const updateImageList = (list: SpaceImage[] = []) =>
          list.map((item) => (item.id === imageId ? newImage : item));

        setSpaces((prev) =>
          prev.map((s) => (s.id === spaceId ? { ...s, space_images: updateImageList(s.space_images) } : s))
        );
        setEditedSpaces((prev) => ({
          ...prev,
          [spaceId]: {
            ...prev[spaceId],
            space_images: updateImageList(prev[spaceId]?.space_images),
          },
        }));
        toast.success("Photo framing updated successfully");
      }
    } catch (err: any) {
      console.error("Failed to update photo framing:", err);
      toast.error(err.message || "Failed to update photo framing");
    } finally {
      setUploadingImagesFor((prev) => ({ ...prev, [spaceId]: false }));
    }
  };

  const addNewSpaceFilesDirectly = async (files: File[]) => {
    const optimized = await Promise.all(files.map((f) => compressImageFile(f)));
    const valid = optimized.filter((f) => !isImageTooLarge(f));
    const tooLarge = valid.length < optimized.length;
    setNewSpaceImageError(tooLarge);
    if (tooLarge) toast.error(IMAGE_TOO_LARGE_MESSAGE);
    if (valid.length === 0) return;
    setNewSpaceFiles((prev) => [...prev, ...valid]);
    setNewSpacePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewSpaceFile = (index: number) => {
    setNewSpacePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setNewSpaceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetNewSpaceFiles = () => {
    newSpacePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewSpaceFiles([]);
    setNewSpacePreviews([]);
    setNewSpaceImageError(false);
  };

  const executeUploadSpaceImages = async (spaceId: string, files: File[]) => {
    setUploadingImagesFor((prev) => ({ ...prev, [spaceId]: true }));
    try {
      const res = await adminUploadSpaceImages(spaceId, files);
      const currentImages = spaces.find((s) => s.id === spaceId)?.space_images || [];
      const mergedImages = [...currentImages, ...res.images];
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId ? { ...s, space_images: mergedImages } : s
        )
      );
      setEditedSpaces((prev) => ({
        ...prev,
        [spaceId]: {
          ...prev[spaceId],
          space_images: mergedImages,
        },
      }));
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photos");
    } finally {
      setUploadingImagesFor((prev) => ({ ...prev, [spaceId]: false }));
    }
  };

  const handleDeleteSpaceImage = async (spaceId: string, imageId: string) => {
    setDeletingImageId(imageId);
    try {
      await adminDeleteSpaceImage(spaceId, imageId);
      const remainingImages = (spaces.find((s) => s.id === spaceId)?.space_images || []).filter((img) => img.id !== imageId);
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId
            ? { ...s, space_images: remainingImages }
            : s
        )
      );
      setEditedSpaces((prev) => ({
        ...prev,
        [spaceId]: {
          ...prev[spaceId],
          space_images: remainingImages,
        },
      }));
      toast.success("Photo removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setDeletingImageId(null);
    }
  };

  const loadSpaces = useCallback(
    async (targetPage = page, searchTerm = search, status = statusFilter) => {
      setLoading(true);
      try {
        const res = await adminListSpaces({
          page: targetPage,
          limit,
          search: searchTerm.trim() || undefined,
          status: status || undefined,
        });
        setSpaces(res.spaces || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);

        // Reset edited buffers
        const initEdits: Record<string, Partial<Space>> = {};
        (res.spaces || []).forEach((s) => {
          initEdits[s.id] = { ...s };
        });
        setEditedSpaces(initEdits);
      } catch (err: any) {
        console.error("Failed to load spaces:", err);
        toast.error(err.message || "Failed to load partner spaces");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, statusFilter]
  );

  useEffect(() => {
    setPage(1);
    loadSpaces(1, debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadSpaces(page, debouncedSearch, statusFilter);
  }, [page]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    loadSpaces(1, search, statusFilter);
  };

  const toggleExpand = (id: string) => {
    setExpandedSpaces((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateEditField = (id: string, fields: Partial<Space>) => {
    setEditedSpaces((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...fields,
      },
    }));
  };

  // Quick status update button
  const handleQuickStatus = async (id: string, newStatus: Space["status"]) => {
    try {
      setBusy(true);
      await adminUpdateSpaceStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setSpaces((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      updateEditField(id, { status: newStatus });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  // Save changes to a space card
  const handleSaveSpace = async (id: string) => {
    const spaceData = editedSpaces[id];
    if (!spaceData) return;

    if (!spaceData.space_name?.trim()) {
      toast.error("Space name is required");
      return;
    }
    if (!spaceData.address?.trim() || !spaceData.city?.trim() || !spaceData.pin?.trim()) {
      toast.error("Address, city, and PIN code are required");
      return;
    }

    try {
      setBusy(true);
      const res = await adminUpdateSpace(id, spaceData);
      toast.success(res.message || "Space updated successfully");
      const currentImages = spaces.find((s) => s.id === id)?.space_images || [];
      const updatedImages = (res.space.space_images && res.space.space_images.length > 0)
        ? res.space.space_images
        : currentImages;
      const mergedSpace = { ...res.space, space_images: updatedImages };
      setSpaces((prev) => prev.map((s) => (s.id === id ? mergedSpace : s)));
      setEditedSpaces((prev) => ({
        ...prev,
        [id]: { ...mergedSpace },
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to update space");
    } finally {
      setBusy(false);
    }
  };

  const [spaceDeleteTarget, setSpaceDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSpace, setIsDeletingSpace] = useState(false);

  // Delete space
  const handleDeleteSpace = (id: string, name: string) => {
    setSpaceDeleteTarget({ id, name });
  };

  const handleConfirmDeleteSpace = async () => {
    if (!spaceDeleteTarget) return;

    try {
      setIsDeletingSpace(true);
      await adminDeleteSpace(spaceDeleteTarget.id);
      toast.success(`Space "${spaceDeleteTarget.name}" deleted successfully`);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceDeleteTarget.id));
      setTotalCount((c) => Math.max(0, c - 1));
      setSpaceDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete space");
    } finally {
      setIsDeletingSpace(false);
    }
  };

  // Pack & Release Space Slot state
  const [packingSpace, setPackingSpace] = useState<Space | null>(null);
  const [releaseSlotTarget, setReleaseSlotTarget] = useState<{
    spaceId: string;
    slotId: string;
    spaceName: string;
    details: string;
  } | null>(null);
  const [isReleasingSlot, setIsReleasingSlot] = useState(false);

  const handleConfirmReleaseSlot = async () => {
    if (!releaseSlotTarget) return;
    try {
      setIsReleasingSlot(true);
      const res = await adminReleaseSpaceSlot(releaseSlotTarget.spaceId, releaseSlotTarget.slotId);
      toast.success("Reserved slot released successfully");
      setSpaces((prev) => prev.map((s) => (s.id === releaseSlotTarget.spaceId ? res.space : s)));
      setReleaseSlotTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to release reserved slot");
    } finally {
      setIsReleasingSlot(false);
    }
  };

  // Create new space
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpace.space_name?.trim()) {
      toast.error("Space name is required");
      return;
    }
    if (!newSpace.address?.trim() || !newSpace.city?.trim() || !newSpace.pin?.trim()) {
      toast.error("Address, city, and PIN code are required");
      return;
    }

    try {
      setBusy(true);
      const amenitiesArr = newAmenitiesStr
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await adminCreateSpace({
        ...newSpace,
        amenities: amenitiesArr,
      });

      // The space needs an id before photos can be attached, so they upload
      // right after creation rather than in the same request.
      if (newSpaceFiles.length > 0) {
        try {
          await adminUploadSpaceImages(res.space.id, newSpaceFiles);
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "Space created, but photo upload failed");
        }
      }

      toast.success(res.message || "Partner space created!");
      setIsAddOpen(false);
      setNewSpace(blankSpace());
      setNewAmenitiesStr("");
      resetNewSpaceFiles();
      // Reset search and filters to guarantee newly created space is visible
      setSearch("");
      setStatusFilter("");
      setPage(1);
      loadSpaces(1, "", "");
    } catch (err: any) {
      toast.error(err.message || "Failed to create space");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-foreground">Partner Spaces & Sanctuaries</h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Vetted sanctuaries, studios, and rooms where clients book in-person sessions with practitioners.
            </p>
          </div>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 shadow-soft"
          >
            <Plus className="size-4 mr-1.5" />
            Add Partner Space
          </Button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search space name, city, PIN…"
              className="rounded-full h-10 pl-9 pr-8 text-sm w-64 bg-card border-border"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  loadSpaces(1, "", statusFilter);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          <Select
            value={statusFilter || "all"}
            onValueChange={(val) => {
              const nextVal = val === "all" ? "" : val;
              setStatusFilter(nextVal);
              setPage(1);
              loadSpaces(1, search, nextVal);
            }}
          >
            <SelectTrigger className="rounded-full h-10 px-4 text-sm border-input bg-card text-foreground w-44 shadow-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border bg-card">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved only</SelectItem>
              <SelectItem value="new">New only</SelectItem>
              <SelectItem value="contacted">Contacted only</SelectItem>
              <SelectItem value="declined">Declined only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="rounded-full h-10 px-5 text-sm"
            onClick={() => handleSearchSubmit()}
            disabled={loading}
          >
            Filter
          </Button>

          {(search || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
                loadSpaces(1, "", "");
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>

      {/* Spaces List or Empty State */}
      {loading && spaces.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading partner spaces…</p>
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <Building2 className="size-10 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="font-display text-xl text-foreground">No partner spaces found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter
              ? "No spaces match your filter criteria. Try clearing search filters."
              : "No partner spaces have been added yet. Click '+ Add Partner Space' to create one."}
          </p>
          {(search || statusFilter) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
                loadSpaces(1, "", "");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cn("space-y-3.5 transition-opacity duration-200", busy && "opacity-60 pointer-events-none")}>
          {spaces.map((space) => {
            const isExpanded = !!expandedSpaces[space.id];
            const edited = editedSpaces[space.id] || space;
            const statusMeta = STATUS_CONFIG[space.status] || STATUS_CONFIG.new;
            const parsedSched = parseSpaceSchedule(edited.availability || space.availability);

            return (
              <section
                key={space.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 bg-card overflow-hidden",
                  isExpanded ? "border-primary/50 shadow-medium" : "border-border shadow-xs hover:border-foreground/30"
                )}
              >
                {/* Collapsed Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="size-11 rounded-xl bg-secondary/80 border border-border grid place-items-center shrink-0 text-accent">
                      <Building2 className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-lg text-foreground truncate">
                          {space.space_name}
                        </h3>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1.5",
                            statusMeta.badgeClass
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", statusMeta.dotClass)} />
                          {statusMeta.label}
                        </span>
                        {space.space_type && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                            {space.space_type}
                          </span>
                        )}
                        {parsedSched.packed_slots && parsedSched.packed_slots.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="size-2.5" />
                            {parsedSched.packed_slots.length} reserved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-accent" />
                          {[space.city, space.pin].filter(Boolean).join(" · ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3 text-accent" />
                          Capacity: {space.capacity}
                        </span>
                        <span className="flex items-center gap-1 text-foreground/80 font-medium">
                          <Clock className="size-3 text-accent" />
                          {parsedSched.summary}
                        </span>
                        {space.contact_name && (
                          <span>Contact: {space.contact_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9 px-3.5 gap-1.5 text-xs text-foreground bg-card hover:bg-secondary hover:text-foreground border-border/80 transition-smooth"
                      onClick={() => setPackingSpace(space)}
                    >
                      <Lock className="size-3.5 text-accent" />
                      <span>Pack Slot</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9 px-3.5 gap-1.5 text-xs text-foreground bg-card hover:bg-secondary hover:text-foreground border-border/80 transition-smooth"
                      onClick={() => toggleExpand(space.id)}
                    >
                      <Pencil className="size-3.5 text-accent" />
                      <span>{isExpanded ? "Close" : "Edit"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-9 text-destructive hover:bg-destructive/15 hover:text-destructive transition-smooth"
                      onClick={() => handleDeleteSpace(space.id, space.space_name)}
                      aria-label={`Delete ${space.space_name}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
                      onClick={() => toggleExpand(space.id)}
                      aria-label={isExpanded ? "Collapse space" : "Expand space"}
                    >
                      <ChevronDown className={cn("size-4.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                    </Button>
                  </div>
                </div>

                {/* Expanded Card Edit Form */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/15 p-5 sm:p-6 space-y-5 animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Space Name *</Label>
                        <Input
                          value={edited.space_name || ""}
                          onChange={(e) => updateEditField(space.id, { space_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Space Type</Label>
                        <Input
                          value={edited.space_type || ""}
                          onChange={(e) => updateEditField(space.id, { space_type: e.target.value })}
                          placeholder="e.g. Yoga Studio, Meditation Hall"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Capacity (Guests)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={edited.capacity || 1}
                          onChange={(e) => updateEditField(space.id, { capacity: Number(e.target.value) || 1 })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Contact Person</Label>
                        <Input
                          value={edited.contact_name || ""}
                          onChange={(e) => updateEditField(space.id, { contact_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Contact Email</Label>
                        <Input
                          type="email"
                          value={edited.email || ""}
                          onChange={(e) => updateEditField(space.id, { email: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Contact Phone</Label>
                        <Input
                          value={edited.phone || ""}
                          onChange={(e) => updateEditField(space.id, { phone: e.target.value })}
                          placeholder="+91..."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">City *</Label>
                        <Input
                          value={edited.city || ""}
                          onChange={(e) => updateEditField(space.id, { city: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">PIN Code *</Label>
                        <Input
                          value={edited.pin || ""}
                          onChange={(e) => updateEditField(space.id, { pin: e.target.value })}
                          placeholder="e.g. 400050"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Status</Label>
                        <select
                          value={edited.status || "approved"}
                          onChange={(e) => updateEditField(space.id, { status: e.target.value as Space["status"] })}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs cursor-pointer"
                        >
                          <option value="approved">Approved</option>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Full Address *</Label>
                        <Input
                          value={edited.address || ""}
                          onChange={(e) => updateEditField(space.id, { address: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Amenities (Comma separated)</Label>
                        <Input
                          value={
                            Array.isArray(edited.amenities)
                              ? edited.amenities.join(", ")
                              : edited.amenities || ""
                          }
                          onChange={(e) =>
                            updateEditField(space.id, {
                              amenities: e.target.value.split(",").map((a) => a.trim()).filter(Boolean),
                            })
                          }
                          placeholder="e.g. Yoga mats, Bolsters, AC, Sound bowls, Changing rooms"
                          className="mt-1"
                        />
                      </div>

                      {/* Structured Google-style Operating Schedule */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <SpaceScheduleEditor
                          value={edited.availability}
                          onChange={(sched) =>
                            updateEditField(space.id, { availability: JSON.stringify(sched) })
                          }
                        />
                      </div>

                      {/* Reserved / Packed Slots Section */}
                      <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-border/80 bg-background/50 p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <Lock className="size-4 text-accent" />
                            <span className="text-xs font-semibold text-foreground">
                              Reserved / Packed Slots ({parsedSched.packed_slots?.length || 0})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full h-8 px-3 text-xs gap-1.5"
                            onClick={() => setPackingSpace(space)}
                          >
                            <Plus className="size-3 text-accent" />
                            <span>Pack Slot</span>
                          </Button>
                        </div>

                        {(!parsedSched.packed_slots || parsedSched.packed_slots.length === 0) ? (
                          <p className="text-xs text-muted-foreground py-2">
                            No slots currently reserved for this space. Click "Pack Slot" to hold hours for platform sessions.
                          </p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            {parsedSched.packed_slots.map((slot) => (
                              <div
                                key={slot.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/80 bg-secondary/30 text-xs"
                              >
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="size-3.5 text-accent" />
                                    {slot.date}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                                    {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                                  </span>
                                  {slot.reason && (
                                    <span className="text-muted-foreground max-w-xs truncate">
                                      · {slot.reason}
                                    </span>
                                  )}
                                  {slot.notified_email && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                                      <Mail className="size-3 text-emerald-500" />
                                      Host notified
                                    </span>
                                  )}
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setReleaseSlotTarget({
                                      spaceId: space.id,
                                      slotId: slot.id,
                                      spaceName: space.space_name,
                                      details: `${slot.date} (${formatTime12h(slot.start_time)} – ${formatTime12h(slot.end_time)})`,
                                    })
                                  }
                                  className="rounded-full h-8 px-3 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive self-end sm:self-center transition-smooth"
                                >
                                  Release Slot
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Internal Notes / Space Instructions</Label>
                        <Textarea
                          rows={2}
                          value={edited.notes || ""}
                          onChange={(e) => updateEditField(space.id, { notes: e.target.value })}
                          placeholder="Private notes, host access details, or client parking directions..."
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Photo Gallery */}
                    <div className="pt-4 border-t border-border">
                      <Label className="text-xs">
                        Photo Gallery {space.space_images?.length ? `(${space.space_images.length})` : ""}
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-2.5">
                        {[...(space.space_images || [])]
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((img) => (
                            <div key={img.id} className="relative size-20 rounded-xl group overflow-hidden border border-border bg-secondary shadow-sm">
                              <img src={img.image_url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

                              {/* Hover overlay with Eye (preview), Crop (adjust), and Delete actions */}
                              <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-[2px]">
                                <button
                                  type="button"
                                  onClick={() => setPreviewTarget({ open: true, space, image: img })}
                                  className="size-6 rounded-md bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all hover:scale-110"
                                  title="Preview Photo"
                                  aria-label="Preview Photo"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startAdjustSavedPhoto(space, img)}
                                  disabled={isPreparingAdjust === img.id}
                                  className="size-6 rounded-md bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                                  title="Adjust / Re-crop"
                                  aria-label="Adjust / Re-crop"
                                >
                                  {isPreparingAdjust === img.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Crop className="size-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSpaceImage(space.id, img.id)}
                                  disabled={deletingImageId === img.id}
                                  className="size-6 rounded-md bg-destructive/80 hover:bg-destructive text-white flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                                  title="Remove Photo"
                                  aria-label="Remove Photo"
                                >
                                  {deletingImageId === img.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        <label
                          className={cn(
                            "size-20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-foreground/40 hover:text-foreground transition-smooth",
                            uploadingImagesFor[space.id] && "opacity-50 pointer-events-none"
                          )}
                        >
                          {uploadingImagesFor[space.id] ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              <ImagePlus className="size-4" />
                              <span className="text-[10px]">Add</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={uploadingImagesFor[space.id]}
                            onChange={(e) => {
                              startCropForExistingSpace(space.id, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Card Footer: Quick Status Switcher & Save Button */}
                    <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-1">Quick status:</span>
                        {(["new", "contacted", "approved", "declined"] as Space["status"][]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={space.status === st ? "default" : "outline"}
                            className="rounded-full h-7 px-3 text-[11px] capitalize"
                            onClick={() => handleQuickStatus(space.id, st)}
                            disabled={busy}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full h-9 px-3.5 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive transition-smooth gap-1.5 mr-auto sm:mr-0"
                          onClick={() => handleDeleteSpace(space.id, space.space_name)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full h-9 px-4 text-xs"
                          onClick={() => toggleExpand(space.id)}
                        >
                          Close
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full h-9 px-5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleSaveSpace(space.id)}
                          disabled={busy}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="pt-2">
          <AuraPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
            onPageChange={setPage}
            disabled={loading || busy}
          />
        </div>
      )}

      {/* Create New Partner Space Dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetNewSpaceFiles();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add New Partner Space</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Create an approved or candidate sanctuary location where practitioners host sessions.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateSpace} className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="add-name">Space Name *</Label>
              <Input
                id="add-name"
                required
                value={newSpace.space_name}
                onChange={(e) => setNewSpace((p) => ({ ...p, space_name: e.target.value }))}
                placeholder="e.g. Zen Sanctuary Bandra"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Photos</Label>
              <div className="mt-1 flex flex-wrap gap-2.5">
                {newSpacePreviews.map((src, i) => (
                  <div key={src} className="relative size-20 rounded-xl">
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block size-20 rounded-xl overflow-hidden border border-border hover:opacity-90 transition-opacity"
                      aria-label="Open photo in new tab"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeNewSpaceFile(i)}
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground border-2 border-background shadow-sm flex items-center justify-center hover:bg-destructive/90"
                      aria-label="Remove photo"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <label className="size-20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-foreground/40 hover:text-foreground transition-smooth">
                  <ImagePlus className="size-4" />
                  <span className="text-[10px]">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      startCropForNewSpace(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="add-type">Space Type</Label>
              <Input
                id="add-type"
                value={newSpace.space_type || ""}
                onChange={(e) => setNewSpace((p) => ({ ...p, space_type: e.target.value }))}
                placeholder="e.g. Yoga Studio, Sound Hall"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-cap">Capacity (People)</Label>
              <Input
                id="add-cap"
                type="number"
                min="1"
                value={newSpace.capacity}
                onChange={(e) => setNewSpace((p) => ({ ...p, capacity: Number(e.target.value) || 10 }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-contact">Contact Person</Label>
              <Input
                id="add-contact"
                value={newSpace.contact_name}
                onChange={(e) => setNewSpace((p) => ({ ...p, contact_name: e.target.value }))}
                placeholder="e.g. Rohan Sharma"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={newSpace.email}
                onChange={(e) => setNewSpace((p) => ({ ...p, email: e.target.value }))}
                placeholder="host@sanctuary.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-city">City *</Label>
              <Input
                id="add-city"
                required
                value={newSpace.city}
                onChange={(e) => setNewSpace((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="add-pin">6-digit PIN Code *</Label>
              <Input
                id="add-pin"
                required
                value={newSpace.pin}
                onChange={(e) => setNewSpace((p) => ({ ...p, pin: e.target.value }))}
                placeholder="e.g. 400050"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="add-addr">Full Address *</Label>
              <Input
                id="add-addr"
                required
                value={newSpace.address}
                onChange={(e) => setNewSpace((p) => ({ ...p, address: e.target.value }))}
                placeholder="e.g. 14 Perry Cross Road, Bandra West"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="add-amen">Amenities (Comma separated)</Label>
              <Input
                id="add-amen"
                value={newAmenitiesStr}
                onChange={(e) => setNewAmenitiesStr(e.target.value)}
                placeholder="e.g. Mats, Bolsters, AC, Sound System, Restrooms"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <SpaceScheduleEditor
                value={newSpace.availability}
                onChange={(sched) => setNewSpace((p) => ({ ...p, availability: JSON.stringify(sched) }))}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="add-notes">Internal Notes</Label>
              <Textarea
                id="add-notes"
                rows={2}
                value={newSpace.notes || ""}
                onChange={(e) => setNewSpace((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any special host or parking guidelines..."
                className="mt-1"
              />
            </div>

            <DialogFooter className="sm:col-span-2 pt-4 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => { setIsAddOpen(false); resetNewSpaceFiles(); }}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy || newSpaceImageError}>
                {busy ? "Saving…" : "Create Partner Space"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Delete Space */}
      <ConfirmDialog
        open={!!spaceDeleteTarget}
        onOpenChange={(open) => !open && setSpaceDeleteTarget(null)}
        title={spaceDeleteTarget ? `Delete "${spaceDeleteTarget.name}"?` : "Delete Partner Space"}
        description={`Are you sure you want to delete "${spaceDeleteTarget?.name}"? This action cannot be undone and will permanently remove this partner location from the platform.`}
        confirmLabel="Yes, Delete Space"
        cancelLabel="Keep Space"
        variant="destructive"
        isLoading={isDeletingSpace}
        onConfirm={handleConfirmDeleteSpace}
      />

      {/* Pack / Reserve Space Slot Dialog */}
      <PackSpaceSlotDialog
        open={!!packingSpace}
        onOpenChange={(open) => !open && setPackingSpace(null)}
        space={packingSpace}
        onSuccess={(updated) => {
          setSpaces((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
      />

      {/* Confirmation Dialog: Release Reserved Slot */}
      <ConfirmDialog
        open={!!releaseSlotTarget}
        onOpenChange={(open) => !open && setReleaseSlotTarget(null)}
        title={releaseSlotTarget ? `Release Slot at ${releaseSlotTarget.spaceName}?` : "Release Reserved Slot"}
        description={`Are you sure you want to release the reserved slot for ${releaseSlotTarget?.details}? Releasing it will reopen this time window for client and practitioner bookings.`}
        confirmLabel="Yes, Release Slot"
        cancelLabel="Keep Reserved"
        variant="destructive"
        isLoading={isReleasingSlot}
        onConfirm={handleConfirmReleaseSlot}
      />

      <ImageCropDialog
        open={!!cropQueue}
        onOpenChange={(open) => {
          if (!open) handleQueueCancel();
        }}
        imageSrc={cropQueue ? cropQueue.items[cropQueue.currentIndex]?.previewUrl : null}
        originalFileName={cropQueue ? cropQueue.items[cropQueue.currentIndex]?.file.name : "space.jpg"}
        title="Crop Space Photo"
        aspectRatio={16 / 9}
        allowedAspectRatios={[
          { label: "16:9 Landscape", value: 16 / 9 },
          { label: "4:3 Standard", value: 4 / 3 },
          { label: "1:1 Square", value: 1 },
          { label: "3:2 Photo", value: 3 / 2 },
        ]}
        stepInfo={
          cropQueue && cropQueue.items.length > 1
            ? { current: cropQueue.currentIndex + 1, total: cropQueue.items.length }
            : undefined
        }
        onSkip={handleQueueSkip}
        onCropSave={(croppedFile) => handleQueueCropSave(croppedFile)}
      />

      {/* Full Photo Preview Dialog with Adjust Action */}
      <Dialog open={!!previewTarget} onOpenChange={(open) => !open && setPreviewTarget(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-card border-border">
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="font-display text-lg">
                  Photo Preview — {previewTarget?.space.space_name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High-resolution photo as displayed on public sanctuary profile.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="relative w-full max-h-[60vh] bg-black/95 flex items-center justify-center p-3 select-none overflow-hidden">
            {previewTarget && (
              <img
                src={previewTarget.image.image_url}
                alt="Space photo"
                className="max-h-[55vh] max-w-full object-contain rounded-lg"
              />
            )}
          </div>

          <DialogFooter className="p-4 bg-secondary/30 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs gap-1.5"
                asChild
              >
                <a
                  href={previewTarget?.image.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" /> Open Original
                </a>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full text-xs gap-1.5"
                disabled={deletingImageId === previewTarget?.image.id}
                onClick={() => {
                  if (previewTarget) {
                    handleDeleteSpaceImage(previewTarget.space.id, previewTarget.image.id);
                    setPreviewTarget(null);
                  }
                }}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="rounded-full text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (previewTarget) {
                    const { space, image } = previewTarget;
                    setPreviewTarget(null);
                    startAdjustSavedPhoto(space, image);
                  }
                }}
              >
                <Crop className="size-3.5" /> Adjust / Re-crop Photo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Framing / Crop Dialog for Saved Photo */}
      {adjustTarget && (
        <ImageCropDialog
          open={adjustTarget.open}
          onOpenChange={(open) => {
            if (!open) {
              if (adjustTarget.src.startsWith("blob:")) {
                URL.revokeObjectURL(adjustTarget.src);
              }
              setAdjustTarget(null);
            }
          }}
          imageSrc={adjustTarget.src}
          originalFileName={adjustTarget.fileName}
          title={`Adjust Framing — ${adjustTarget.spaceName}`}
          aspectRatio={16 / 9}
          allowedAspectRatios={[
            { label: "16:9 Landscape", value: 16 / 9 },
            { label: "4:3 Standard", value: 4 / 3 },
            { label: "1:1 Square", value: 1 },
            { label: "3:2 Photo", value: 3 / 2 },
          ]}
          onCropSave={handleSaveAdjustedPhoto}
        />
      )}
    </div>
  );
};

export default SpaceListingsAdmin;
