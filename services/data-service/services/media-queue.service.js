// data-service/services/media-queue.service.js

import { imageQueue, videoQueue } from "../queues/media.queues.js";
import { createMediaJobId } from "../utils/media-job-id.js";

export async function enqueueMediaProcessing({
  entityType,
  entityId,
  field,
  media,
}) {
  const jobData = {
    mediaId: media._id.toString(),
    entityType,
    entityId: entityId.toString(),
    field,
    originalKey: media.originalKey,
    mimeType: media.mimeType,
    mediaType: media.type,
  };

  const jobId = createMediaJobId({
    entityType,
    entityId,
    field,
    mediaId: media._id.toString(),
  });

  const queue =
    media.type === "image"
      ? imageQueue
      : videoQueue;

  await queue.add(
    media.type === "image"
      ? "image.process"
      : "video.process",
    jobData,
    {
      jobId,
    }
  );

  return {
    jobId,
    queue: queue.name,
  };
}