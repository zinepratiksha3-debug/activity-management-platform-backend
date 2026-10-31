// media-service/processors/image.processor.js

import sharp from "sharp";

import {
  uploadObject,
} from "../services/storage.service.js";

import {
  mediaUrl,
} from "../config/r2.js";

/* =========================================================
   IMAGE VARIANTS
========================================================= */

const VARIANTS = {
  small: {
    width: 320,
    quality: 65,
  },

  medium: {
    width: 800,
    quality: 72,
  },

  large: {
    width: 1600,
    quality: 80,
  },
};

/* =========================================================
   PROCESS IMAGE
========================================================= */

export async function processImage({
  inputPath,
  outputPrefix,
}) {
  if (!inputPath) {
    throw new Error(
      "inputPath is required"
    );
  }

  if (!outputPrefix) {
    throw new Error(
      "outputPrefix is required"
    );
  }

  /* =======================================================
     SOURCE METADATA
  ======================================================= */

  const source =
    sharp(inputPath, {
      failOn: "warning",
    }).rotate();

  const metadata =
    await source.metadata();

  if (
    !metadata.width ||
    !metadata.height
  ) {
    throw new Error(
      "Invalid image dimensions."
    );
  }

  /* =======================================================
     VARIANTS
  ======================================================= */

  const variants = {};

  for (
    const [
      name,
      config,
    ] of Object.entries(
      VARIANTS
    )
  ) {
    const result =
      await sharp(inputPath, {
        failOn: "warning",
      })
        .rotate()
        .resize({
          width: config.width,
          fit: "inside",
          withoutEnlargement: true,
          fastShrinkOnLoad: true,
        })
        .avif({
          quality: config.quality,
          effort: 4,
          chromaDeltaQ: 4,
          lossless: false,
          smartSubsample: true,
        })
        .toBuffer({
          resolveWithObject: true,
        });

    /* =====================================================
       STORAGE KEY
    ===================================================== */

    const key =
      `${outputPrefix}/${name}.avif`;

    /* =====================================================
       UPLOAD
    ===================================================== */

    await uploadObject({
      key,
      body: result.data,
      contentType: "image/avif",
    });

    /* =====================================================
       VARIANT INFO
    ===================================================== */

    variants[name] = {
      key,

      url: mediaUrl(key),

      width:
        result.info.width,

      height:
        result.info.height,

      size:
        result.data.length,

      mimeType:
        "image/avif",
    };
  }

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    width:
      metadata.width,

    height:
      metadata.height,

    format:
      metadata.format,

    variants,
  };
}