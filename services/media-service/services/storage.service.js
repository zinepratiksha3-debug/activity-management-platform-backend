// media-service/services/storage.service.js

import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { createWriteStream } from "node:fs";

import { pipeline } from "node:stream/promises";

import r2Client, {
  R2_BUCKET_NAME,
} from "../config/r2.js";

/* =========================================================
   DOWNLOAD OBJECT
========================================================= */

export const downloadObject = async ({
  originalKey,
  inputPath,
}) => {
  if (!originalKey) {
    throw new Error(
      "originalKey is required"
    );
  }

  if (!inputPath) {
    throw new Error(
      "inputPath is required"
    );
  }

  const command =
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: originalKey,
    });

  const response =
    await r2Client.send(command);

  if (!response.Body) {
    throw new Error(
      "R2 returned empty response body."
    );
  }

  await pipeline(
    response.Body,
    createWriteStream(inputPath)
  );
};

/* =========================================================
   UPLOAD OBJECT
========================================================= */

export const uploadObject = async ({
  key,
  body,
  contentType,
}) => {
  if (!key) {
    throw new Error(
      "key is required"
    );
  }

  if (!body) {
    throw new Error(
      "body is required"
    );
  }

  const command =
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType:
        contentType ||
        "application/octet-stream",
    });

  await r2Client.send(command);
};

/* =========================================================
   DELETE OBJECT
========================================================= */

export const deleteObject = async ({
  originalKey,
}) => {
  if (!originalKey) {
    throw new Error(
      "originalKey is required"
    );
  }

  const command =
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: originalKey,
    });

  await r2Client.send(command);
};