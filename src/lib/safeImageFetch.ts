import { getApiUrl } from "./api";

/**
 * Safely fetches a remote image (from Supabase, AWS S3, or external URLs)
 * and converts it into a local same-origin blob URL (blob:...).
 * Bypasses S3 CORS restrictions via backend image proxy fallback,
 * ensuring HTML canvas can crop and export without tainted-canvas errors.
 */
export async function fetchSafeImageBlobUrl(url: string): Promise<string> {
  if (!url) throw new Error("Image URL is required");

  // If already a blob or data URL, return directly
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  // 1. Try direct browser fetch first (works for Supabase storage or CORS-enabled endpoints)
  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
  } catch {
    // Direct fetch failed (e.g. AWS S3 bucket without CORS headers for localhost)
  }

  // 2. Fallback to backend image proxy
  const apiUrl = getApiUrl();
  const proxyUrl = `${apiUrl}/api/proxy-image?url=${encodeURIComponent(url)}`;
  const proxyRes = await fetch(proxyUrl);
  if (!proxyRes.ok) {
    throw new Error(`Failed to load image via proxy (HTTP ${proxyRes.status})`);
  }
  const blob = await proxyRes.blob();
  return URL.createObjectURL(blob);
}
