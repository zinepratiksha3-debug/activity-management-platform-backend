//companion_server/services/data-service/config/cloudflare.js
import { S3Client,PutObjectCommand} from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


   const accessKeyId= process.env.R2_ACCESS_KEY_ID?? env?.R2_ACCESS_KEY_ID;
   const secretAccessKey= process.env.R2_SECRET_ACCESS_KEY?? env?.R2_ACCESS_KEY_ID;
   const R2_ACCOUNT_ID=process.env.R2_ACCOUNT_ID??env.R2.R2_ACCOUNT_ID;
   console.log("accessKeyId",accessKeyId);

  console.log("secretAccessKey",secretAccessKey);
   console.log(" R2_ACCOUNT_ID", R2_ACCOUNT_ID);


export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
