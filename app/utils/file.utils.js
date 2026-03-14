import {BUCKET_NAME ,R2_PUBLIC_URL} from "#config/r2.config.js";
/**
 * Xác định Content-Type từ extension
 */
export function getContentType(extension) {
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
export function getPublicUrl(key) {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return `https://${BUCKET_NAME}.r2.dev/${key}`;
}

/**
 * Lấy key từ URL R2
 * @param {string} url - URL của file trên R2
 * @returns {string|null} Key của file
 */
export function getKeyFromUrl(url) {
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
    console.log("Error extracting key from URL:", url);
    return null;
  }
}

