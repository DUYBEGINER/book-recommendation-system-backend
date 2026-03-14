import { s3Client, BUCKET_NAME } from "#config/r2.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getContentType, getPublicUrl, getKeyFromUrl} from "#utils/file.utils.js";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";

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
export async function uploadToR2(bucketName = BUCKET_NAME, buffer, folder, filename, options = {}) {
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
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    console.log(`✅ Uploaded file to R2 successfully: ${key}`);
    const url = getPublicUrl(key);
    
    return { success: true, key, url };
  } catch (error) {
    console.error("R2 Upload Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Xóa file trên R2
 * @param {string} publicUrl - URL công khai của file cần xóa
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromR2(bucketName = BUCKET_NAME, publicUrl) {

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: getKeyFromUrl(publicUrl),
      })
    );
    return { success: true };
  } catch (error) {
    console.error("R2 Delete Error:", error.message);
    return { success: false, error: error.message };
  }
}