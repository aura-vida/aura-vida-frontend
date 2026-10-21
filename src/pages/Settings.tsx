import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "@/components/aura/Nav";
import Footer from "@/components/aura/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { updateMe } from "@/lib/usersApi";
import { getMyPractitionerProfile, updateMyPractitionerProfile, type Practitioner } from "@/lib/practitionersApi";
import { isValidPhoneNumber } from "@/lib/whatsapp";
import { isImageTooLarge, IMAGE_TOO_LARGE_MESSAGE } from "@/lib/fileValidation";
import { Loader2, Settings2, ImagePlus, CheckCircle2, User, Camera, ShieldCheck, Crop } from "lucide-react";
import ImageCropDialog from "@/components/aura/ImageCropDialog";

export default function SettingsPage() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    // Basic Profile State
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [savingBase, setSavingBase] = useState(false);

    // Practitioner State
    const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
    const [pracLoading, setPracLoading] = useState(false);
    const [savingPrac, setSavingPrac] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageSizeError, setImageSizeError] = useState(false);
    const [cropModal, setCropModal] = useState<{
        open: boolean;
        src: string | null;
        fileName: string;
    }>({
        open: false,
        src: null,
        fileName: "profile.jpg",
    });

    const [pracFields, setPracFields] = useState({
        name: "",
        bio: "",
        city: "",
        craft: "",
        price_inr: 0,
        mobile_number: "",
        whatsapp_number: "",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth", { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            setPhone(profile.phone || "");
        }

        // If they have practitioner slug, fetch their practitioner profile
        if (profile && profile.role === "practitioner") {
            setPracLoading(true);
            getMyPractitionerProfile()
                .then((res) => {
                    setPractitioner(res.practitioner);
                    setPracFields({
                        name: res.practitioner.name || "",
                        bio: res.practitioner.bio || "",
                        city: res.practitioner.city || "",
                        craft: res.practitioner.craft || "",
                        price_inr: res.practitioner.price_inr || 0,
                        mobile_number: res.practitioner.mobile_number || "",
                        whatsapp_number: res.practitioner.whatsapp_number || "",
                    });
                })
                .catch((err) => {
                    console.error("Failed to load practitioner profile:", err);
                })
                .finally(() => setPracLoading(false));
        }
    }, [profile]);

    const handleBaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBase(true);
        try {
            await updateMe({ full_name: fullName, phone });
            toast.success("Personal details updated");
            window.location.reload(); // Refresh to ensure context updates everywhere
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile");
        } finally {
            setSavingBase(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            if (["heic", "heif"].includes(ext)) {
                toast.error("iPhone HEIC photos cannot be displayed by web browsers. Please select a JPG, PNG, or WEBP photo.");
                e.target.value = "";
                return;
            }
            const preview = URL.createObjectURL(file);
            setCropModal({
                open: true,
                src: preview,
                fileName: file.name,
            });
            e.target.value = "";
        }
    };

    const handlePracSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidPhoneNumber(pracFields.mobile_number)) {
            toast.error("Please enter a valid mobile number");
            return;
        }
        if (!isValidPhoneNumber(pracFields.whatsapp_number)) {
            toast.error("Please enter a valid WhatsApp number, including the country code");
            return;
        }

        setSavingPrac(true);

        try {
            if (imageFile) {
                // We have a file, must use FormData
                const formData = new FormData();
                formData.append("name", pracFields.name);
                formData.append("bio", pracFields.bio);
                formData.append("city", pracFields.city);
                formData.append("craft", pracFields.craft);
                formData.append("price_inr", String(pracFields.price_inr));
                formData.append("mobile_number", pracFields.mobile_number);
                formData.append("whatsapp_number", pracFields.whatsapp_number);
                formData.append("image", imageFile);

                await updateMyPractitionerProfile(formData);
            } else {
                // Normal JSON payload if no image
                await updateMyPractitionerProfile(pracFields);
            }

            toast.success("Practitioner details updated");
            setImageFile(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to update practitioner profile");
        } finally {
            setSavingPrac(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isPractitioner = profile?.role === "practitioner";

    return (
        <main className="min-h-screen bg-background flex flex-col">
            <Nav />
            <section className="flex-1 max-w-[800px] w-full mx-auto px-6 lg:px-12 py-14 lg:py-20">

                <div className="mb-12">
                    <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium flex items-center gap-2">
                        <Settings2 className="size-3.5" /> Account configuration
                    </span>
                    <h1 className="font-display text-4xl mt-3">Settings</h1>
                </div>

                {/* Basic Auth / Contact Info */}
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-soft mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display text-2xl flex items-center gap-2 text-foreground">
                            <User className="size-5" /> Personal Details
                        </h2>
                        <div className="text-right">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Account Role</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-semibold uppercase text-foreground">
                                <CheckCircle2 className="size-3.5 text-accent" /> {profile?.role || "client"}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleBaseSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="baseEmail" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Address (Read-only)</Label>
                                <Input
                                    id="baseEmail"
                                    value={user.email}
                                    disabled
                                    className="h-12 rounded-2xl bg-muted border-border cursor-not-allowed opacity-70"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="baseRef" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Referral Code (Read-only)</Label>
                                <Input
                                    id="baseRef"
                                    value={profile?.referral_code || "N/A"}
                                    disabled
                                    className="h-12 rounded-2xl bg-muted border-border cursor-not-allowed opacity-70"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="baseStatus" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account Status (Read-only)</Label>
                                <Input
                                    id="baseStatus"
                                    value={profile?.status || "active"}
                                    disabled
                                    className="h-12 rounded-2xl bg-muted border-border cursor-not-allowed opacity-70 capitalize"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="baseCredits" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Kuśala Credit Balance (Read-only)</Label>
                                <Input
                                    id="baseCredits"
                                    value={`₹${(profile?.credit_inr ?? 0).toLocaleString("en-IN")}`}
                                    disabled
                                    className="h-12 rounded-2xl bg-muted border-border cursor-not-allowed opacity-70"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className="h-12 rounded-2xl bg-background"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+91"
                                    className="h-12 rounded-2xl bg-background"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button type="submit" disabled={savingBase} className="h-11 px-8 rounded-full">
                                {savingBase ? "Saving…" : "Update Personal Details"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Practitioner Specific Edit Section */}
                {isPractitioner && (
                    <div className="rounded-[2rem] border border-border bg-card p-8 shadow-soft">
                        <h2 className="font-display text-2xl flex items-center gap-2 text-foreground mb-1">
                            <ShieldCheck className="size-5" /> Public Practitioner Profile
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Update the details potential clients will see when they view your listing on Kuśala.
                        </p>

                        {pracLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : practitioner ? (
                            <form onSubmit={handlePracSubmit} className="space-y-6">

                                {/* Image Upload Area */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/50">
                                    <div className="relative group">
                                        <div className="size-32 rounded-full overflow-hidden bg-secondary border border-border flex items-center justify-center">
                                            {(imagePreview || practitioner.image_url) ? (
                                                <img
                                                    src={imagePreview || practitioner.image_url || ""}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="size-10 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-sm"
                                        >
                                            <Camera className="size-6 text-foreground" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">Profile Image</h3>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed mb-3">
                                            High resolution, professional portrait. Recommended size 600x600 px. Try capturing yourself in natural lighting.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-full">
                                                <ImagePlus className="size-4 mr-2" /> Upload New Photo
                                            </Button>
                                            {imagePreview && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setCropModal({ open: true, src: imagePreview, fileName: imageFile?.name || "profile.jpg" })}
                                                    className="rounded-full gap-1.5 text-xs"
                                                >
                                                    <Crop className="size-3.5" /> Adjust Crop
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pb-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Rating</Label>
                                    <span className="text-sm font-semibold">⭐ {practitioner.rating ?? 0}</span>
                                    <span className="text-xs text-muted-foreground">(calculated automatically from customer reviews)</span>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="pracName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Display Name</Label>
                                        <Input
                                            id="pracName"
                                            value={pracFields.name}
                                            onChange={(e) => setPracFields({ ...pracFields, name: e.target.value })}
                                            placeholder="Display Name"
                                            className="h-12 rounded-2xl bg-background"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pracCraft" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title / Modality</Label>
                                        <Input
                                            id="pracCraft"
                                            value={pracFields.craft}
                                            onChange={(e) => setPracFields({ ...pracFields, craft: e.target.value })}
                                            placeholder="e.g. Master Sound Healer"
                                            className="h-12 rounded-2xl bg-background"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pracCity" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">City</Label>
                                        <Input
                                            id="pracCity"
                                            value={pracFields.city}
                                            onChange={(e) => setPracFields({ ...pracFields, city: e.target.value })}
                                            placeholder="Your base city"
                                            className="h-12 rounded-2xl bg-background"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pracPrice" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Base Session Price (₹)</Label>
                                        <Input
                                            id="pracPrice"
                                            type="number"
                                            min="0"
                                            value={pracFields.price_inr}
                                            onChange={(e) => setPracFields({ ...pracFields, price_inr: parseInt(e.target.value) || 0 })}
                                            className="h-12 rounded-2xl bg-background"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pracMobile" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
                                        <Input
                                            id="pracMobile"
                                            type="tel"
                                            value={pracFields.mobile_number}
                                            onChange={(e) => setPracFields({ ...pracFields, mobile_number: e.target.value })}
                                            placeholder="e.g. +91 98765 43210"
                                            className="h-12 rounded-2xl bg-background"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pracWhatsapp" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">WhatsApp Number</Label>
                                        <Input
                                            id="pracWhatsapp"
                                            type="tel"
                                            value={pracFields.whatsapp_number}
                                            onChange={(e) => setPracFields({ ...pracFields, whatsapp_number: e.target.value })}
                                            placeholder="e.g. +91 98765 43210"
                                            className="h-12 rounded-2xl bg-background"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">Include your country code — clients use this to chat with you directly.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pracBio" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">About You (Bio)</Label>
                                    <Textarea
                                        id="pracBio"
                                        value={pracFields.bio}
                                        onChange={(e) => setPracFields({ ...pracFields, bio: e.target.value })}
                                        placeholder="Tell your clients a little bit about your lineage, philosophy, and experience."
                                        className="min-h-[140px] rounded-2xl bg-background p-4 resize-y"
                                        required
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" disabled={savingPrac || imageSizeError} className="h-11 px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                                        {savingPrac ? "Saving Profile…" : "Update Public Profile"}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-sm text-amber-600 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                Wait, we couldn't find your linked practitioner profile. Please check with an administrator.
                            </div>
                        )}
                    </div>
                )}

            </section>
            <Footer />

            <ImageCropDialog
                open={cropModal.open}
                onOpenChange={(open) => {
                    setCropModal((prev) => ({ ...prev, open }));
                }}
                imageSrc={cropModal.src}
                originalFileName={cropModal.fileName}
                title="Crop Profile Photo"
                aspectRatio={1}
                allowedAspectRatios={[
                    { label: "1:1 Square", value: 1 },
                    { label: "4:5 Portrait", value: 4 / 5 },
                ]}
                cropShape="round"
                onCropSave={(croppedFile, previewUrl) => {
                    setImageSizeError(false);
                    setImageFile(croppedFile);
                    setImagePreview(previewUrl);
                }}
            />
        </main>
    );
}
