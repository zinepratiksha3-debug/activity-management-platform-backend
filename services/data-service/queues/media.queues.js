import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const imageQueue = new Queue("image-processing", {
  connection,
});

export const videoQueue = new Queue("video-processing", {
  connection,
});