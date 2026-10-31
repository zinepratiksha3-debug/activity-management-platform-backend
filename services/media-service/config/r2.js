// media-service/config/r2.js

import { S3Client } from "@aws-sdk/client-s3";

/* =========================================================
   REQUIRED ENVIRONMENT VARIABLES
========================================================= */

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];

/* =========================================================
   ENV VALIDATION
========================================================= */

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }
}

/* =========================================================
   R2 CONFIG
========================================================= */

export const R2_BUCKET_NAME =
  process.env.R2_BUCKET_NAME;

export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL.replace(/\/$/, "");

/* =========================================================
   MEDIA URL
========================================================= */

export const mediaUrl = (key) => {
  if (!key) {
    return null;
  }

  return `${R2_PUBLIC_URL}/${key}`;
};

/* =========================================================
   R2 CLIENT
========================================================= */

const r2Client = new S3Client({
  region: "auto",

  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default r2Client;