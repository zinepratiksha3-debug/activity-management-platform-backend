// media-service/queues/image.worker.js

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
  deleteObject,
} from "../services/storage.service.js";

import {
  processImage,
} from "../processors/image.processor.js";

import {
  updateMediaProcessing,
} from "../services/media.service.js";

import {
  emitMediaCompleted,
} from "../services/socket.service.js";

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
   IMAGE WORKER
========================================================= */

export const imageWorker =
  new Worker(
    "image-processing",

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
          `image-${randomUUID()}`
        );

      const inputPath =
        path.join(
          workDir,
          path.basename(
            originalKey
          )
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
           DOWNLOAD
        ================================================= */

        await downloadObject({
          originalKey,
          inputPath,
        });

        /* =================================================
           OUTPUT PREFIX
        ================================================= */

        const outputPrefix =
          `processed/${entityType}s/${entityId}/${mediaId}`;

        /* =================================================
           PROCESS
        ================================================= */

        const result =
          await processImage({
            inputPath,
            outputPrefix,
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
          variants:
            result.variants,
        });

        /* =================================================
           DELETE ORIGINAL
        ================================================= */

        await deleteObject({
          originalKey,
        });

        /* =================================================
           SOCKET
        ================================================= */

        await emitMediaCompleted({
          entityType,
          entityId,
          field,
          mediaId,
        });

        return {
          status: "completed",
          mediaId,
        };
      } catch (error) {
        const isFinalAttempt =
          attempt >= maxAttempts;

        console.error(
          `[IMAGE WORKER] Processing error:`,
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
          .IMAGE_WORKER_CONCURRENCY ||
          4
      ),

      limiter: {
        max: 20,
        duration: 1000,
      },
    }
  );

/* =========================================================
   EVENTS
========================================================= */

imageWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `[IMAGE WORKER] Job failed: ${job?.id}`,
      error
    );
  }
);

imageWorker.on(
  "completed",
  (job) => {
    console.log(
      `[IMAGE WORKER] Job completed: ${job.id}`
    );
  }
);

imageWorker.on(
  "error",
  (error) => {
    console.error(
      "[IMAGE WORKER] Worker error:",
      error
    );
  }
);