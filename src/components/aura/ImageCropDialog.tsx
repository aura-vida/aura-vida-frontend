import React, { useState, useRef, useEffect } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImgFromElement } from "@/lib/cropImage";
import { Loader2, RotateCw, Check, Crop as CropIcon, Maximize2 } from "lucide-react";

export interface AspectRatioOption {
  label: string;
  value: number | undefined; // undefined = freeform / custom drag
}

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropSave: (croppedFile: File, previewUrl: string) => void;
  onSkip?: () => void;
  stepInfo?: { current: number; total: number };
  aspectRatio?: number;
  allowedAspectRatios?: AspectRatioOption[];
  cropShape?: "rect" | "round";
  title?: string;
  originalFileName?: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect?: number
): Crop {
  if (!aspect) {
    return centerCrop(
      {
        unit: "%",
        width: 85,
        height: 85,
      },
      mediaWidth,
      mediaHeight
    );
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 85,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropSave,
  onSkip,
  stepInfo,
  aspectRatio = 1,
  allowedAspectRatios,
  cropShape = "rect",
  title = "Crop & Adjust Image",
  originalFileName = "photo.jpg",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState<number>(0);
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(
    cropShape === "round" ? 1 : aspectRatio
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Sync aspect when default prop changes
  useEffect(() => {
    setCurrentAspect(cropShape === "round" ? 1 : aspectRatio);
  }, [aspectRatio, cropShape]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setRotation(0);
      setIsProcessing(false);
    }
  }, [open, imageSrc]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const initialAspect = cropShape === "round" ? 1 : currentAspect;
    const initialCrop = centerAspectCrop(width, height, initialAspect);
    setCrop(initialCrop);
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setCurrentAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, newAspect));
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      setIsProcessing(true);
      const { file, previewUrl } = await getCroppedImgFromElement(
        imgRef.current,
        completedCrop,
        rotation,
        originalFileName
      );
      onCropSave(file, previewUrl);
      onOpenChange(false);
    } catch (err) {
      console.error("Error cropping image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Build aspect ratio options list with "Custom / Free" option included
  const aspectOptions: AspectRatioOption[] = React.useMemo(() => {
    if (cropShape === "round") {
      return [{ label: "1:1 Circle", value: 1 }];
    }

    const base = allowedAspectRatios
      ? [...allowedAspectRatios]
      : [
          { label: "1:1 Square", value: 1 },
          { label: "4:5 Portrait", value: 4 / 5 },
          { label: "16:9 Landscape", value: 16 / 9 },
          { label: "4:3 Standard", value: 4 / 3 },
        ];

    // Ensure Custom / Freeform is available if not round
    if (!base.some((b) => b.value === undefined)) {
      base.push({ label: "Custom Free", value: undefined });
    }

    return base;
  }, [allowedAspectRatios, cropShape]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-background border border-border sm:max-w-xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <CropIcon className="size-5 text-primary" />
              {title}
            </DialogTitle>
            {stepInfo && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground border border-border">
                {stepInfo.current} / {stepInfo.total}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag the upper, lower, left, right handles or corners to frame your crop.
          </p>
        </DialogHeader>

        {/* Interactive Cropper Area */}
        <div className="relative w-full max-h-[55vh] min-h-[260px] bg-black/95 flex items-center justify-center p-3 select-none overflow-hidden">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={cropShape === "round" ? 1 : currentAspect}
              circularCrop={cropShape === "round"}
              className="max-h-[50vh] flex items-center justify-center"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{
                  maxHeight: "50vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                  transition: "transform 150ms ease",
                }}
              />
            </ReactCrop>
          )}
        </div>

        {/* Controls Bar */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-secondary/20">
          {/* Aspect Ratio Selector */}
          {aspectOptions.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0">
                Crop Ratio:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aspectOptions.map((opt) => {
                  const isSelected =
                    opt.value === undefined
                      ? currentAspect === undefined
                      : Math.abs((currentAspect ?? 0) - opt.value) < 0.01;

                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleAspectChange(opt.value)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-foreground border-border hover:bg-secondary"
                      }`}
                    >
                      {opt.value === undefined && <Maximize2 className="size-3 inline mr-1" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="rounded-full text-xs h-8 gap-1.5"
            >
              <RotateCw className="size-3.5" />
              Rotate 90°
            </Button>

            <span className="text-[11px] text-muted-foreground">
              {currentAspect === undefined
                ? "Custom Mode: Drag any edge or corner freely"
                : "Locked Ratio: Drag corners or move frame"}
            </span>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 border-t border-border/60 bg-background flex sm:justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="rounded-full"
            >
              Cancel
            </Button>

            {onSkip && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSkip}
                disabled={isProcessing}
                className="rounded-full text-xs"
              >
                Skip This Photo
              </Button>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing || !completedCrop?.width || !completedCrop?.height}
            className="rounded-full gap-1.5 px-5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                {stepInfo && stepInfo.current < stepInfo.total
                  ? "Crop & Next"
                  : "Save & Apply Crop"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
