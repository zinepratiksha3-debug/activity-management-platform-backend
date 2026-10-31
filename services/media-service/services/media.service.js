// media-service/services/media.service.js

import mongoose from "mongoose";

import User from "../models/user.model.js";

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
  const Model =
    ENTITY_MODELS[entityType];

  if (!Model) {
    throw new Error(
      `Unsupported entity type: ${entityType}`
    );
  }

  return Model;
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

  const Model =
    getModel(entityType);

  /* =======================================================
     VALIDATE IDs
  ======================================================= */

  if (
    !mongoose.isValidObjectId(
      entityId
    )
  ) {
    throw new Error(
      "Invalid entity ID."
    );
  }

  if (
    !mongoose.isValidObjectId(
      mediaId
    )
  ) {
    throw new Error(
      "Invalid media ID."
    );
  }

  /* =======================================================
     BASE UPDATE
  ======================================================= */

  const update = {
    $set: {
      [`${field}.status`]:
        status,
    },
  };

  /* =======================================================
     ATTEMPT
  ======================================================= */

  if (
    typeof attempt === "number"
  ) {
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

  if (status === "completed") {
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

  if (
    result.matchedCount !== 1
  ) {
    throw new Error(
      "Media record not found."
    );
  }

  return result;
}