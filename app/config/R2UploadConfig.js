import "dotenv/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";

/**
 * Cloudflare R2 Upload Configuration
 * Sử dụng AWS S3 SDK để tương tác với R2
 */

// Khởi tạo S3 Client cho R2
const s3Client = new S3Client({
  region: "auto", // Required by SDK but not used by R2
  endpoint: process.env.R2_UPLOAD_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Xác định Content-Type từ extension
 */
function getContentType(extension) {
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return contentTypes[extension.toLowerCase()] || "image/jpeg";
}

/**
 * Tạo URL public cho file trên R2
 * @param {string} key - Key của file trên R2
 * @returns {string} URL public
 */
function getPublicUrl(key) {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return `https://${BUCKET_NAME}.r2.dev/${key}`;
}

/**
 * Upload file lên R2
 * @param {Buffer} buffer - Nội dung file
 * @param {string} folder - Folder đích trên R2 (ví dụ: "covers", "books")
 * @param {string} filename - Tên file gốc (để lấy extension)
 * @param {Object} options - Tùy chọn bổ sung
 * @param {string} options.customKey - Key tùy chỉnh (bỏ qua folder và filename)
 * @param {string} options.contentType - Content-Type tùy chỉnh
 * @returns {Promise<{success: boolean, key?: string, url?: string, error?: string}>}
 */
async function uploadToR2(buffer, folder, filename, options = {}) {
  try {
    let key;
    if (options.customKey) {
      key = options.customKey;
    } else {
      const ext = path.extname(filename) || ".jpg";
      const uniqueId = uuidv4();
      const safeFilename = `${uniqueId}${ext}`;
      key = `${folder}/${safeFilename}`;
    }

    const contentType = options.contentType || getContentType(path.extname(filename));

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const url = getPublicUrl(key);
    return { success: true, key, url };
  } catch (error) {
    console.error("R2 Upload Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Upload ảnh cover sách lên R2
 * @param {Buffer} buffer - Nội dung ảnh
 * @param {string} filename - Tên file gốc
 * @param {BigInt|number} bookId - ID sách (tùy chọn, để tổ chức file)
 * @returns {Promise<{success: boolean, key?: string, url?: string, error?: string}>}
 */
async function uploadBookCover(buffer, filename, bookId = null) {
  const ext = path.extname(filename) || ".jpg";
  const uniqueId = uuidv4();
  const key = bookId 
    ? `covers/${bookId}-${uniqueId}${ext}`
    : `covers/${uniqueId}${ext}`;
  
  return uploadToR2(buffer, "covers", filename, { customKey: key });
}

/**
 * Xóa file trên R2
 * @param {string} key - Key của file cần xóa
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteFromR2(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("R2 Delete Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Lấy key từ URL R2
 * @param {string} url - URL của file trên R2
 * @returns {string|null} Key của file
 */
function getKeyFromUrl(url) {
  try {
    if (!url) return null;
    
    // Xử lý URL với R2_PUBLIC_URL
    if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
      return url.replace(`${R2_PUBLIC_URL}/`, "");
    }
    
    // Xử lý URL dạng r2.dev
    const r2DevPattern = new RegExp(`https://${BUCKET_NAME}\\.r2\\.dev/(.+)`);
    const match = url.match(r2DevPattern);
    if (match) {
      return match[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

export {
  s3Client,
  uploadToR2,
  uploadBookCover,
  deleteFromR2,
  getPublicUrl,
  getKeyFromUrl,
  getContentType,
  BUCKET_NAME,
};
