import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const mediaQueue = new Queue(
  "media-processing",
  {
    connection: redisConnection,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 5000,
      },

      removeOnComplete: {
        count: 1000,
      },

      removeOnFail: {
        count: 5000,
      },
    },
  }
);

export const addMediaJob = async (data) => {
  const job = await mediaQueue.add(
    "process-media",
    data,
    {
      jobId: `media-${data.mediaId}`,
    }
  );

  console.log(
    `Media job added: ${job.id}`
  );

  return job;
};