export const MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_SIZE_LABEL = "50MB";
export const IMAGE_TOO_LARGE_MESSAGE = `Image must be smaller than ${MAX_IMAGE_SIZE_LABEL}.`;

export const isImageTooLarge = (file: File) => file.size >= MAX_IMAGE_SIZE_BYTES;
