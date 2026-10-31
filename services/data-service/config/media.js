// services/data-service/config/media.js

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
  "image/avif",
]);

export const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/avi",
  "video/x-msvideo",
]);

export function getMediaType(mimeType) {
  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return "image";
  }

  if (VIDEO_MIME_TYPES.has(mimeType)) {
    return "video";
  }

  return null;
}