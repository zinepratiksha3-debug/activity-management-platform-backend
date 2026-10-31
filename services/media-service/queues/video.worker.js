// media-service/queues/video.worker.js

import {
  Worker,
} from "bullmq";

import IORedis from "ioredis";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import {
  randomUUID,
} from "node:crypto";

import {
  downloadObject,
  uploadObject,
  deleteObject,
} from "../services/storage.service.js";

import {
  processVideo,
} from "../processors/video.processor.js";

import {
  updateMediaProcessing,
} from "../services/media.service.js";

import {
  emitMediaCompleted,
} from "../services/socket.service.js";

import {
  mediaUrl,
} from "../config/r2.js";

/* =========================================================
   REDIS
========================================================= */

const connection =
  new IORedis(
    process.env.REDIS_URL ||
      "redis://127.0.0.1:6379",
    {
      maxRetriesPerRequest:
        null,
    }
  );

/* =========================================================
   VIDEO WORKER
========================================================= */

export const videoWorker =
  new Worker(
    "video-processing",

    async (job) => {
      const {
        entityType,
        entityId,
        field,
        mediaId,
        originalKey,
      } = job.data;

      const attempt =
        job.attemptsMade + 1;

      const maxAttempts =
        job.opts.attempts || 1;

      /* ===================================================
         TEMP DIRECTORY
      =================================================== */

      const workDir =
        path.join(
          os.tmpdir(),
          `video-${randomUUID()}`
        );

      const inputPath =
        path.join(
          workDir,
          path.basename(
            originalKey
          )
        );

      const outputPath =
        path.join(
          workDir,
          "video_720p.mp4"
        );

      const posterPath =
        path.join(
          workDir,
          "poster.jpeg"
        );

      try {
        /* =================================================
           CREATE DIRECTORY
        ================================================= */

        await fs.mkdir(
          workDir,
          {
            recursive: true,
          }
        );

        /* =================================================
           PROCESSING
        ================================================= */

        await updateMediaProcessing({
          entityType,
          entityId,
          field,
          mediaId,
          status: "processing",
          attempt,
        });

        /* =================================================
           DOWNLOAD ORIGINAL
        ================================================= */

        await downloadObject({
          originalKey,
          inputPath,
        });

        /* =================================================
           PROCESS VIDEO
        ================================================= */

        const result =
          await processVideo({
            inputPath,
            outputPath,
            posterPath,
          });

        /* =================================================
           OUTPUT PREFIX
        ================================================= */

        const outputPrefix =
          `processed/${entityType}s/${entityId}/${mediaId}`;

        const videoKey =
          `${outputPrefix}/video720p.mp4`;

        const posterKey =
          `${outputPrefix}/poster.jpeg`;

        /* =================================================
           UPLOAD VIDEO
        ================================================= */

        await uploadObject({
          key: videoKey,
          body:
            result.video.body,
          contentType:
            result.video.mimeType,
        });

        /* =================================================
           UPLOAD POSTER
        ================================================= */

        await uploadObject({
          key: posterKey,
          body:
            result.poster.body,
          contentType:
            result.poster.mimeType,
        });

        /* =================================================
           DATABASE UPDATE
        ================================================= */

        await updateMediaProcessing({
          entityType,
          entityId,
          field,
          mediaId,

          status: "completed",

          attempt,

          variants: {
            video720p: {
              key: videoKey,

              url:
                mediaUrl(
                  videoKey
                ),

              size:
                result.video
                  .size,

              mimeType:
                result.video
                  .mimeType,
            },
          },

          poster: {
            key: posterKey,

            url:
              mediaUrl(
                posterKey
              ),

            size:
              result.poster
                .size,

            mimeType:
              result.poster
                .mimeType,
          },
        });

        /* =================================================
           DELETE ORIGINAL
        ================================================= */

        await deleteObject({
          originalKey,
        });

        /* =================================================
           SOCKET EVENT
        ================================================= */

        await emitMediaCompleted({
          entityType,
          entityId,
          field,
          mediaId,
        });

        /* =================================================
           RESULT
        ================================================= */

        return {
          status: "completed",
          mediaId,
        };
      } catch (error) {
        const isFinalAttempt =
          attempt >= maxAttempts;

        console.error(
          `[VIDEO WORKER] Processing error:`,
          error
        );

        await updateMediaProcessing({
          entityType,
          entityId,
          field,
          mediaId,

          status:
            isFinalAttempt
              ? "failed"
              : "queued",

          attempt,

          error: {
            code:
              "MEDIA_PROCESSING_ERROR",

            message:
              error.message,
          },
        });

        throw error;
      } finally {
        /* =================================================
           CLEANUP
        ================================================= */

        await fs.rm(
          workDir,
          {
            recursive: true,
            force: true,
          }
        );
      }
    },

    {
      connection,

      concurrency: Number(
        process.env
          .VIDEO_WORKER_CONCURRENCY ||
          2
      ),

      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

/* =========================================================
   EVENTS
========================================================= */

videoWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `[VIDEO WORKER] Job failed: ${job?.id}`,
      error
    );
  }
);

videoWorker.on(
  "completed",
  (job) => {
    console.log(
      `[VIDEO WORKER] Job completed: ${job.id}`
    );
  }
);

videoWorker.on(
  "error",
  (error) => {
    console.error(
      "[VIDEO WORKER] Worker error:",
      error
    );
  }
);