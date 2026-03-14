import "dotenv/config";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 Upload Configuration
 * Sử dụng AWS S3 SDK để tương tác với R2
 */
export const BUCKET_NAME = process.env.BUCKET_NAME;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Khởi tạo S3 Client cho R2
export const s3Client = new S3Client({
  region: "auto", // Required by SDK but not used by R2
  endpoint: process.env.R2_UPLOAD_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

