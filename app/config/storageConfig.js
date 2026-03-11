import "dotenv/config";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

/**
 * MinIO (S3-compatible) Storage Configuration
 *
 * Required environment variables:
 *   MINIO_ENDPOINT    – e.g. http://localhost:9000
 *   MINIO_ACCESS_KEY  – MinIO access key
 *   MINIO_SECRET_KEY  – MinIO secret key
 *   MINIO_BUCKET      – bucket name that stores book files
 *   MINIO_REGION      – (optional) defaults to "us-east-1"
 */

const minioClient = new S3Client({
  region: process.env.MINIO_REGION || "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO path-style access
});

const MINIO_BUCKET = process.env.MINIO_BUCKET;

/**
 * Normalize an object key stored in book_formats.content_url.
 * Strips leading slash and optional bucket prefix so it can be
 * used directly in S3 commands.
 *
 * @param {string} rawKey – value from content_url column
 * @returns {string} cleaned key
 */
function normalizeKey(rawKey) {
  if (!rawKey) return "";
  let key = rawKey.startsWith("/") ? rawKey.slice(1) : rawKey;
  if (MINIO_BUCKET && key.startsWith(`${MINIO_BUCKET}/`)) {
    key = key.slice(MINIO_BUCKET.length + 1);
  }
  return key;
}

/**
 * Generate a presigned URL for reading / downloading a file from MinIO.
 *
 * @param {string} key                                   – object key (as stored in content_url)
 * @param {object} [options]
 * @param {number} [options.expiresIn=3600]               – URL lifetime in seconds
 * @param {string} [options.responseContentDisposition]   – override Content-Disposition header
 * @param {string} [options.responseContentType]          – override Content-Type header
 * @returns {Promise<string>} presigned URL
 */
async function generatePresignedUrl(key, options = {}) {
  const {
    expiresIn = 3600,
    responseContentDisposition,
    responseContentType,
  } = options;

  const commandInput = {
    Bucket: MINIO_BUCKET,
    Key: normalizeKey(key),
  };

  if (responseContentDisposition) {
    commandInput.ResponseContentDisposition = responseContentDisposition;
  }
  if (responseContentType) {
    commandInput.ResponseContentType = responseContentType;
  }

  const command = new GetObjectCommand(commandInput);
  return getSignedUrl(minioClient, command, { expiresIn });
}

/**
 * Upload a book file (PDF / EPUB) to MinIO.
 *
 * @param {Buffer} buffer      – file content
 * @param {string} filename    – original filename (used for extension)
 * @param {string} folder      – destination folder, e.g. "books"
 * @returns {Promise<{ key: string }>} the object key stored in MinIO
 */
async function uploadToMinio(buffer, filename, folder = "books") {
  const ext = path.extname(filename).toLowerCase() || "";
  const key = `${folder}/${uuidv4()}${ext}`;

  const contentTypes = {
    ".pdf": "application/pdf",
    ".epub": "application/epub+zip",
  };

  await minioClient.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentTypes[ext] || "application/octet-stream",
    }),
  );

  return { key };
}

async function deleteFromMinio(key) {
  await minioClient.send(
    new DeleteObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: normalizeKey(key),
    })
  );
}

export { minioClient, MINIO_BUCKET, normalizeKey, generatePresignedUrl, uploadToMinio, deleteFromMinio };
