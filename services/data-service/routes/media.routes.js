import express from "express";

import {
  getUploadUrlHandler,
  createMedia,
} from "../controllers/media.controller.js";

const router = express.Router();

// =========================================================
// GET PRESIGNED URL
// =========================================================

router.post(
  "/upload-url",
  getUploadUrlHandler
);

// =========================================================
// CREATE MEDIA RECORD
// =========================================================

router.post(
  "/create",
  createMedia
);

export default router;