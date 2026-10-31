// media-service/models/media.model.js

import mongoose from "mongoose";

/* =========================================================
   VARIANT SCHEMA
========================================================= */

const variantSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
      },

      url: {
        type: String,
      },

      width: {
        type: Number,
      },

      height: {
        type: Number,
      },

      size: {
        type: Number,
      },

      mimeType: {
        type: String,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   MEDIA SCHEMA
========================================================= */

export const mediaSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,

        enum: [
          "image",
          "video",
        ],

        required: true,
      },

      status: {
        type: String,

        enum: [
          "pending",
          "queued",
          "processing",
          "completed",
          "failed",
        ],

        default: "pending",
      },

      originalKey: {
        type: String,
      },

      mimeType: {
        type: String,
      },

      originalSize: {
        type: Number,
      },

      variants: {
        small: variantSchema,

        medium: variantSchema,

        large: variantSchema,

        video720p: variantSchema,
      },

      poster: variantSchema,

      processing: {
        attempts: {
          type: Number,
          default: 0,
        },

        startedAt: {
          type: Date,
        },

        completedAt: {
          type: Date,
        },

        failedAt: {
          type: Date,
        },

        error: {
          code: {
            type: String,
          },

          message: {
            type: String,
          },
        },
      },
    },
    {
      _id: true,
      timestamps: true,
    }
  );

/* =========================================================
   MODEL
========================================================= */

export const Media =
  mongoose.model(
    "Media",
    mediaSchema
  );