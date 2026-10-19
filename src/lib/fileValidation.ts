export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE_LABEL = "5MB";
export const IMAGE_TOO_LARGE_MESSAGE = `Image must be smaller than ${MAX_IMAGE_SIZE_LABEL}.`;

export const isImageTooLarge = (file: File) => file.size >= MAX_IMAGE_SIZE_BYTES;
