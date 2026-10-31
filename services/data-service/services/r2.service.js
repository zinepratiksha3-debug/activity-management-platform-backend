import {
  HeadObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import {
  r2Client,
  R2_BUCKET,
} from "../config/r2.js";

import {
  randomUUID,
} from "node:crypto";

// =========================================================
// HEAD OBJECT
// =========================================================

export async function headObject(key) {
  if (!key) {
    throw new Error("R2 object key is required.");
  }

  try {
    return await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
  } catch (error) {
    if (
      error?.name === "NotFound" ||
      error?.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }

    throw error;
  }
}

// =========================================================
// DELETE OBJECT
// =========================================================

export async function deleteObject(key) {
  if (!key) return;

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

// =========================================================
// PRESIGNED UPLOAD URL
// =========================================================

export async function getPresignedUploadUrl({
  fileName,
  fileType,
  entityType,
  entityId,
}) {
  if (!fileName) {
    throw new Error("fileName is required.");
  }

  if (!fileType) {
    throw new Error("fileType is required.");
  }

  if (!entityType) {
    throw new Error("entityType is required.");
  }

  if (!entityId) {
    throw new Error("entityId is required.");
  }

  const ext = fileName.includes(".")
    ? fileName.split(".").pop()
    : "bin";

  const key =
    `originals/${entityType}s/${entityId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(
    r2Client,
    command,
    {
      expiresIn: 300,
    }
  );

  return {
    uploadUrl,
    key,
  };
}

// =========================================================
// DIRECT BUFFER UPLOAD
// =========================================================

export async function uploadObject({
  key,
  body,
  contentType,
}) {
  if (!key) {
    throw new Error("R2 object key is required.");
  }

  if (!body) {
    throw new Error("R2 object body is required.");
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    key,
  };
}