import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl =
  process.env.REDIS_URL;

function createConnection() {
  return new IORedis(
    redisUrl,
    {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }
  );
}

// =========================================================
// IMAGE QUEUE
// =========================================================

export const imageQueue =
  new Queue(
    "image-processing",
    {
      connection:
        createConnection(),

      defaultJobOptions: {
        attempts: 5,

        backoff: {
          type: "exponential",
          delay: 5000,
        },

        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 1000,
        },

        removeOnFail: {
          age: 7 * 24 * 60 * 60,
          count: 5000,
        },
      },
    }
  );

// =========================================================
// VIDEO QUEUE
// =========================================================

export const videoQueue =
  new Queue(
    "video-processing",
    {
      connection:
        createConnection(),

      defaultJobOptions: {
        attempts: 3,

        backoff: {
          type: "exponential",
          delay: 10000,
        },

        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 1000,
        },

        removeOnFail: {
          age: 7 * 24 * 60 * 60,
          count: 5000,
        },
      },
    }
  );

// =========================================================
// ADD MEDIA JOB
// =========================================================

export const addMediaJob =
  async ({
    mediaId,
    entityType,
    entityId,
    originalKey,
    type,
    field,
  }) => {
    const queue =
      type === "video"
        ? videoQueue
        : imageQueue;

    const mediaField =
      field ||
      (
        type === "video"
          ? "verificationVideo"
          : "profilePhoto"
      );

    const job =
      await queue.add(
        "process-media",
        {
          mediaId,
          entityType,
          entityId,
          originalKey,

          field:
            mediaField,
        },
        {
          jobId:
            `media-${mediaId}`,
        }
      );

    console.log(
      `Media job added: ${job.id}, field: ${mediaField}`
    );

    return job;
  };