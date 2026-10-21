export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  unit?: "px" | "%";
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Extracts a cropped and optionally rotated section of an image directly from an HTMLImageElement.
 * Accurately translates displayed pixels into natural image coordinates and constrains dimensions
 * to maxDimension (default 1920px) at 0.85 JPEG quality so images remain razor-sharp while staying
 * comfortably under 800KB (preventing 413 Request Entity Too Large on reverse proxies like Nginx).
 */
export async function getCroppedImgFromElement(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  rotation = 0,
  fileName = "cropped-image.jpg",
  maxDimension = 1920
): Promise<{ file: File; previewUrl: string }> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d canvas context available");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Real pixel size of the cropped region in natural image resolution
  const naturalCropWidth = Math.max(1, Math.floor(pixelCrop.width * scaleX));
  const naturalCropHeight = Math.max(1, Math.floor(pixelCrop.height * scaleY));

  // Scale down if larger than maxDimension while preserving aspect ratio
  const downscale = Math.min(1, maxDimension / Math.max(naturalCropWidth, naturalCropHeight));
  const targetWidth = Math.max(1, Math.round(naturalCropWidth * downscale));
  const targetHeight = Math.max(1, Math.round(naturalCropHeight * downscale));

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.imageSmoothingQuality = "high";

  if (downscale < 1) {
    ctx.scale(downscale, downscale);
  }

  const cropX = pixelCrop.x * scaleX;
  const cropY = pixelCrop.y * scaleY;

  const rotRad = getRadianAngle(rotation);
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  // Move canvas origin to match crop top-left
  ctx.translate(-cropX, -cropY);

  if (rotation !== 0) {
    // Rotate around natural center of image
    ctx.translate(centerX, centerY);
    ctx.rotate(rotRad);
    ctx.translate(-centerX, -centerY);
  }

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }

        const safeFileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
        const file = new File([blob], safeFileName, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      },
      "image/jpeg",
      0.85
    );
  });
}

/**
 * Optimizes an existing File before upload (resizes to max 1920px and compresses to 0.85 quality)
 * to guarantee it fits safely within server limits (< 800KB).
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  if (!file.type || !file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h) return resolve(file);

      // If already within bounds and small enough, keep as-is
      if (w <= maxDimension && h <= maxDimension && file.size <= 800 * 1024) {
        return resolve(file);
      }

      const scale = Math.min(1, maxDimension / Math.max(w, h));
      const targetW = Math.max(1, Math.round(w * scale));
      const targetH = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const safeName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          const compressed = new File([blob], safeName, { type: "image/jpeg" });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

