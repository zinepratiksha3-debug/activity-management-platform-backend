import mongoose from "mongoose";

const MEDIA_TYPES = [
  "image",
  "video",
  "document",
  "audio",
];

const MEDIA_STATUS = [
  "queued",
  "pending",
  "processing",
  "uploaded",
  "completed",
  "failed",
  "deleted",
];

const mediaSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    entityType: {
      type: String,
      trim: true,
      default: "user",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    type: {
      type: String,
      enum: MEDIA_TYPES,
      required: true,
    },

    originalKey: {
      type: String,
      required: true,
      trim: true,
    },

    processedKey: {
      type: String,
      default: null,
      trim: true,
    },

    thumbnailKey: {
      type: String,
      default: null,
      trim: true,
    },

    url: {
      type: String,
      default: null,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      default: null,
      trim: true,
    },

    originalName: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    processedMimeType: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },

    originalSize: {
      type: Number,
      min: 0,
      default: 0,
    },

    size: {
      type: Number,
      min: 0,
      default: 0,
    },

    processedSize: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: MEDIA_STATUS,
      default: "queued",
      index: true,
    },

    processing: {
      attempts: {
        type: Number,
        default: 0,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      failedAt: {
        type: Date,
        default: null,
      },

      error: {
        code: {
          type: String,
          default: null,
        },

        message: {
          type: String,
          default: null,
        },
      },
    },

    poster: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    variants: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },

    metadata: {
      width: {
        type: Number,
        min: 0,
      },

      height: {
        type: Number,
        min: 0,
      },

      duration: {
        type: Number,
        min: 0,
      },
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

export { mediaSchema };