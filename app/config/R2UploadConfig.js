import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import fs from "node:fs";

const S3 = new S3Client({
  region: "auto", // Required by SDK but not used by R2
  // Provide your Cloudflare account ID
  endpoint: process.env.R2_UPLOAD_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  // Retrieve your S3 API credentials for your R2 bucket via API tokens (see: https://developers.cloudflare.com/r2/api/tokens)
  credentials: {
    accessKeyId:  process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});


const localFilePath = path.resolve("app/config","cover.jpeg"); // ví dụ: ./assets/cover.png
const key = `covers/test/${path.basename(localFilePath)}`; // key lưu trên R2
const body = fs.readFileSync(localFilePath);

// Upload the file to R2
await S3.send(
    new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: "image/jpeg",
    }),
);

console.log("Uploaded OK!");
console.log("Key:", key);
