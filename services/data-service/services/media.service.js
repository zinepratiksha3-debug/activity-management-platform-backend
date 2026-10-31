// data-service/services/media.service.js

import mongoose from "mongoose";

import User from "../model/user.model.js";
import { addMediaJob } from "../queues/media.queue.js";

/* =========================================================
   SUPPORTED ENTITY MODELS
========================================================= */

const ENTITY_MODELS = {
  user: User,
};

/* =========================================================
   GET MODEL
========================================================= */

function getModel(entityType) {
  const Model = ENTITY_MODELS[entityType];

  if (!Model) {
    throw new Error(
      `Unsupported entity type: ${entityType}`
    );
  }

  return Model;
}

/* =========================================================
   CREATE MEDIA RECORD
========================================================= */

export async function createMediaRecord({
  owner,
  entityType,
  entityId,
  type,
  key,
  originalName,
  mimeType,
  size,
  field,
}) {
  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

  if (!owner) {
    throw new Error("owner is required");
  }

  if (!entityType) {
    throw new Error("entityType is required");
  }

  if (!entityId) {
    throw new Error("entityId is required");
  }

  if (!type) {
    throw new Error("type is required");
  }

  if (!key) {
    throw new Error("key is required");
  }

  if (!mimeType) {
    throw new Error("mimeType is required");
  }

  /* =======================================================
     GET MODEL
  ======================================================= */

  const Model = getModel(entityType);

  /* =======================================================
     VALIDATE ENTITY ID
  ======================================================= */

  if (!mongoose.isValidObjectId(entityId)) {
    throw new Error("Invalid entity ID.");
  }

  /* =======================================================
     VALIDATE OWNER ID
  ======================================================= */

  if (!mongoose.isValidObjectId(owner)) {
    throw new Error("Invalid owner ID.");
  }

  /* =======================================================
     ALLOWED MEDIA FIELDS
  ======================================================= */

  const allowedFields = [
    "profilePhoto",
    "verificationPhoto",
    "verificationVideo",
  ];

  /* =======================================================
     DETERMINE MEDIA FIELD
  ======================================================= */

  const mediaField =
    field ||
    (type === "video"
      ? "verificationVideo"
      : "profilePhoto");

  /* =======================================================
     FIELD VALIDATION
  ======================================================= */

  if (!allowedFields.includes(mediaField)) {
    throw new Error(
      `Invalid media field: ${mediaField}`
    );
  }

  /* =======================================================
     FIELD + TYPE VALIDATION
  ======================================================= */

  if (
    mediaField === "verificationVideo" &&
    type !== "video"
  ) {
    throw new Error(
      "verificationVideo must contain a video."
    );
  }

  if (
    (mediaField === "profilePhoto" ||
      mediaField === "verificationPhoto") &&
    type !== "image"
  ) {
    throw new Error(
      `${mediaField} must contain an image.`
    );
  }

  /* =======================================================
     CHECK ENTITY
  ======================================================= */

  const entity = await Model.findById(entityId);

  if (!entity) {
    throw new Error("Entity not found.");
  }

  /* =======================================================
     MEDIA ID
  ======================================================= */

  const mediaId =
    new mongoose.Types.ObjectId();

  /* =======================================================
     MEDIA DOCUMENT
  ======================================================= */

  const media = {
    _id: mediaId,

    owner: new mongoose.Types.ObjectId(owner),

    entityType,

    entityId: new mongoose.Types.ObjectId(entityId),

    type,

    /*
      IMPORTANT:
      mediaSchema मध्ये queued allowed नाही.
      म्हणून pending वापरतो.
    */
    status: "pending",

    originalKey: key,

    mimeType,

    originalName: originalName || "",

    size: size || 0,

    processing: {
      attempts: 0,
    },
  };

  /* =======================================================
     SAVE MEDIA INSIDE USER
  ======================================================= */

  const result = await Model.updateOne(
    {
      _id: entityId,
    },
    {
      $set: {
        [mediaField]: media,
      },
    }
  );

  if (result.matchedCount !== 1) {
    throw new Error(
      "Failed to save media record."
    );
  }

  /* =======================================================
     ADD PROCESSING JOB
  ======================================================= */

  try {
    await addMediaJob({
      mediaId: mediaId.toString(),

      entityType,

      entityId: entityId.toString(),

      originalKey: key,

      type,

      field: mediaField,
    });
  } catch (queueError) {
    console.error(
      "Failed to add media processing job:",
      queueError
    );

    /* =====================================================
       MARK MEDIA AS FAILED
    ===================================================== */

    await Model.updateOne(
      {
        _id: entityId,

        [`${mediaField}._id`]:
          mediaId,
      },
      {
        $set: {
          [`${mediaField}.status`]:
            "failed",

          [`${mediaField}.processing.failedAt`]:
            new Date(),

          [`${mediaField}.processing.error`]: {
            code: "QUEUE_ERROR",

            message:
              queueError.message ||
              "Failed to add processing job.",
          },
        },
      }
    );

    throw queueError;
  }

  /* =======================================================
     RETURN MEDIA
  ======================================================= */

  return media;
}

/* =========================================================
   UPDATE MEDIA PROCESSING
========================================================= */

export async function updateMediaProcessing({
  entityType,
  entityId,
  field,
  mediaId,
  status,
  attempt,
  variants,
  poster,
  error,
}) {
  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

  if (!entityType) {
    throw new Error(
      "entityType is required"
    );
  }

  if (!entityId) {
    throw new Error(
      "entityId is required"
    );
  }

  if (!field) {
    throw new Error(
      "field is required"
    );
  }

  if (!mediaId) {
    throw new Error(
      "mediaId is required"
    );
  }

  if (!status) {
    throw new Error(
      "status is required"
    );
  }

  /* =======================================================
     GET MODEL
  ======================================================= */

  const Model = getModel(entityType);

  /* =======================================================
     VALIDATE IDs
  ======================================================= */

  if (!mongoose.isValidObjectId(entityId)) {
    throw new Error(
      "Invalid entity ID."
    );
  }

  if (!mongoose.isValidObjectId(mediaId)) {
    throw new Error(
      "Invalid media ID."
    );
  }

  /* =======================================================
     ALLOWED MEDIA FIELDS
  ======================================================= */

  const allowedFields = [
    "profilePhoto",
    "verificationPhoto",
    "verificationVideo",
  ];

  if (!allowedFields.includes(field)) {
    throw new Error(
      `Invalid media field: ${field}`
    );
  }

  /* =======================================================
     BASE UPDATE
  ======================================================= */

  const update = {
    $set: {
      [`${field}.status`]: status,
    },
  };

  /* =======================================================
     ATTEMPT
  ======================================================= */

  if (typeof attempt === "number") {
    update.$set[
      `${field}.processing.attempts`
    ] = attempt;
  }

  /* =======================================================
     PROCESSING
  ======================================================= */

  if (status === "processing") {
    update.$set[
      `${field}.processing.startedAt`
    ] = new Date();

    update.$set[
      `${field}.processing.error`
    ] = null;
  }

  /* =======================================================
     COMPLETED
  ======================================================= */

  if (
    status === "completed" ||
    status === "uploaded"
  ) {
    update.$set[
      `${field}.processing.completedAt`
    ] = new Date();

    update.$set[
      `${field}.processing.error`
    ] = null;

    if (variants) {
      update.$set[
        `${field}.variants`
      ] = variants;
    }

    if (poster) {
      update.$set[
        `${field}.poster`
      ] = poster;
    }
  }

  /* =======================================================
     FAILED
  ======================================================= */

  if (status === "failed") {
    update.$set[
      `${field}.processing.failedAt`
    ] = new Date();

    update.$set[
      `${field}.processing.error`
    ] =
      error || {
        code: "MEDIA_PROCESSING_ERROR",

        message:
          "Media processing failed.",
      };
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filter = {
    _id: entityId,

    [`${field}._id`]:
      new mongoose.Types.ObjectId(
        mediaId
      ),
  };

  /* =======================================================
     UPDATE
  ======================================================= */

  const result =
    await Model.updateOne(
      filter,
      update
    );

  if (result.matchedCount !== 1) {
    throw new Error(
      "Media record not found."
    );
  }

  return result;
}