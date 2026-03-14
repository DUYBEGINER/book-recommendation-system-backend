import multer from 'multer';

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_BOOK_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/octet-stream',
];

const MAX_BOOK_SIZE = 25 * 1024 * 1024;   // 25 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB

/**
 * File filter that validates MIME types per field name.
 */
function allFileFilter(_req, file, cb) {
  if (file.fieldname === 'cover' || file.fieldname === 'avatar') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Cover image must be JPEG, PNG, WebP, or GIF'), false);
    }
  } else if (file.fieldname === 'pdfFile' || file.fieldname === 'epubFile') {
    if (!ALLOWED_BOOK_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type for ${file.fieldname}`), false);
    }
  } else {
    return cb(new Error(`Unexpected file field: ${file.fieldname}`), false);
  }
  cb(null, true);
}

/**
 * Multer instance configured for book creation / update.
 * Accepts: cover (1 image), pdfFile (1), epubFile (1).
 */
export const uploadBookFiles = multer({
  storage,
  fileFilter: allFileFilter,
  limits: {
    fileSize: MAX_BOOK_SIZE, // largest allowed per file
    files: 3,
  },
}).fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'epubFile', maxCount: 1 },
]);


export const uploadAvatarFile = multer({
  storage,
  fileFilter: allFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
}).fields([
  { name: 'avatar', maxCount: 1 },
]);