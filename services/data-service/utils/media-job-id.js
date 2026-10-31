// data-service/utils/media-job-id.js

import crypto from "node:crypto";

export function createMediaJobId({
  entityType,
  entityId,
  field,
  mediaId,
}) {
  const raw = `${entityType}:${entityId}:${field}:${mediaId}`;

  return crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
}
