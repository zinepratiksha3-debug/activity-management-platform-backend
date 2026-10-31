import { createMediaRecord } from "../services/media.service.js";
import { getPresignedUploadUrl } from "../services/r2.service.js";
import { headObject } from "../services/r2.service.js";

// ======================================================
// GET PRESIGNED UPLOAD URL
// ======================================================
//
// Frontend
//    ↓
// Data Service
//    ↓
// Cloudflare R2
//    ↓
// Presigned URL
//    ↓
// Frontend
//
// ======================================================

export const getUploadUrlHandler = async (req, res) => {
  try {
    const {
      fileName,
      fileType,
      entityType,
      entityId,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !fileName ||
      !fileType ||
      !entityType ||
      !entityId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "fileName, fileType, entityType and entityId are required",
      });
    }

    // ==================================================
    // ENTITY VALIDATION
    // ==================================================

    if (entityType !== "user") {
      return res.status(400).json({
        success: false,
        message: "Invalid entityType",
      });
    }

    // ==================================================
    // MEDIA TYPE VALIDATION
    // ==================================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    // ==================================================
    // GENERATE PRESIGNED URL
    // ==================================================

    const {
      uploadUrl,
      key,
    } = await getPresignedUploadUrl({
      fileName,
      fileType,
      entityType,
      entityId,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Upload URL generated successfully",

      data: {
        uploadUrl,
        key,
      },
    });

  } catch (error) {

    console.error(
      "Get upload URL error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate upload URL",
    });
  }
};


// ======================================================
// CREATE MEDIA RECORD
// ======================================================
//
// Frontend uploads file directly to R2
//                ↓
// Frontend calls this API
//                ↓
// Backend checks R2 object
//                ↓
// MongoDB media record
//
// ======================================================

export const createMedia = async (req, res) => {
  try {

    const {
      owner,
      entityType,
      entityId,
      type,
      key,
      originalName,
      mimeType,
      size,
      field,
    } = req.body;

    // ==================================================
    // REQUIRED FIELD VALIDATION
    // ==================================================

    if (
      !owner ||
      !entityType ||
      !entityId ||
      !type ||
      !key ||
      !mimeType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required media fields are missing",
      });
    }

    // ==================================================
    // ENTITY VALIDATION
    // ==================================================

    if (entityType !== "user") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid entityType",
      });
    }

    // ==================================================
    // MEDIA TYPE VALIDATION
    // ==================================================

    if (
      !["image", "video"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Media type must be image or video",
      });
    }

    // ==================================================
    // FIELD VALIDATION
    // ==================================================

    const allowedFields = [
      "profilePhoto",
      "verificationPhoto",
      "verificationVideo",
    ];

    if (
      field &&
      !allowedFields.includes(field)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid media field",
      });
    }

    // ==================================================
    // CHECK OBJECT EXISTS IN R2
    // ==================================================

    const r2Object = await headObject(key);

    if (!r2Object) {
      return res.status(400).json({
        success: false,
        message:
          "File was not uploaded to R2",
      });
    }

    // ==================================================
    // CREATE MEDIA RECORD
    // ==================================================

    const media =
      await createMediaRecord({
        owner,
        entityType,
        entityId,
        type,
        key,
        originalName,
        mimeType,
        size:
          size || r2Object.ContentLength,
        field,
      });

    // ==================================================
    // SUCCESS
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Media created successfully",

      data: media,

      mediaId:
        media?._id,

      status:
        media?.status,
    });

  } catch (error) {

    console.error(
      "Create media error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to create media",
    });
  }
};