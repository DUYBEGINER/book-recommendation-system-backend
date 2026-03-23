import cloudinary, { CLOUDINARY_FOLDERS } from "#config/cloudinary.config.js";

/**
 * Upload file lên Cloudinary
 * @param {Buffer} buffer - Nội dung file
 * @param {string} folder - Folder đích trên Cloudinary (ví dụ: "book-covers", "avatars")
 * @param {Object} options - Tùy chọn bổ sung
 * @param {string} options.publicId - Public ID tùy chỉnh
 * @returns {Promise<{success: boolean, url?: string, publicId?: string, error?: string}>}
 */
export async function uploadToCloudinary(buffer, folder, options = {}) {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: folder,
        resource_type: "image",
        overwrite: true,
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error.message);
            reject({ success: false, error: error.message });
          } else {
            console.log(`✅ Uploaded file to Cloudinary successfully: ${result.secure_url}`);
            resolve({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Xóa file trên Cloudinary
 * @param {string} publicUrl - URL công khai của file cần xóa
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromCloudinary(publicUrl) {
  try {
    const publicId = extractPublicIdFromUrl(publicUrl);

    if (!publicId) {
      console.warn("Could not extract public ID from URL:", publicUrl);
      return { success: false, error: "Invalid URL" };
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok" || result.result === "not found") {
      console.log(`✅ Deleted file from Cloudinary: ${publicId}`);
      return { success: true };
    }

    return { success: false, error: result.result };
  } catch (error) {
    console.error("Cloudinary Delete Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Trích xuất public_id từ Cloudinary URL
 * @param {string} url - URL của file trên Cloudinary
 * @returns {string|null} Public ID
 *
 * Ví dụ:
 * Input: https://res.cloudinary.com/demo/image/upload/v1234567890/book-covers/my-image.jpg
 * Output: book-covers/my-image
 */
export function extractPublicIdFromUrl(url) {
  try {
    if (!url || !url.includes("cloudinary.com")) {
      return null;
    }

    // Pattern: /upload/v[version]/[public_id].[extension]
    // hoặc: /upload/[public_id].[extension]
    const uploadPattern = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(uploadPattern);

    if (match) {
      return match[1];
    }

    return null;
  } catch {
    console.error("Error extracting public ID from URL:", url);
    return null;
  }
}

/**
 * Kiểm tra xem URL có phải là Cloudinary URL không
 * @param {string} url
 * @returns {boolean}
 */
export function isCloudinaryUrl(url) {
  return url && (url.includes("cloudinary.com") || url.includes("res.cloudinary"));
}

export { CLOUDINARY_FOLDERS };
