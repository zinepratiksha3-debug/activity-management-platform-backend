import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const R2_ACCOUNT_ID =
  process.env.R2_ACCOUNT_ID;

export const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID;

export const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET =
  process.env.R2_BUCKET_NAME;

export const R2_ENDPOINT =
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

console.log("=================================");
console.log("R2 CONFIGURATION");
console.log("=================================");
console.log("R2 Account ID:", R2_ACCOUNT_ID);
console.log("R2 Bucket:", R2_BUCKET);
console.log("R2 Endpoint:", R2_ENDPOINT);
console.log("=================================");

export const r2Client = new S3Client({
  region: "auto",

  endpoint: R2_ENDPOINT,
forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getPresignedUploadUrl({
  fileName,
  fileType,
  entityType,
  entityId,
}) {
  if (!fileName) {
    throw new Error("fileName is required");
  }

  if (!fileType) {
    throw new Error("fileType is required");
  }

  if (!entityType) {
    throw new Error("entityType is required");
  }

  if (!entityId) {
    throw new Error("entityId is required");
  }

  const safeFileName = fileName.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const key =
    `${entityType}/${entityId}/${Date.now()}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(
    r2Client,
    command,
    {
      expiresIn: 3600,
    }
  );

  return {
    uploadUrl,
    key,
  };
}