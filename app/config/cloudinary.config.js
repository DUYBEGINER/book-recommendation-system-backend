import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary Configuration
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folders for organizing uploads
export const CLOUDINARY_FOLDERS = {
  COVERS: "book-covers",
  AVATARS: "avatars",
};

export default cloudinary;
