/**
 * Script để migrate ảnh từ Cloudinary sang Cloudflare R2
 * 
 * Cách sử dụng:
 * 1. Đảm bảo đã cấu hình các biến môi trường trong .env:
 *    - DATABASE_URL
 *    - R2_ACCOUNT_ID hoặc R2_UPLOAD_ENDPOINT
 *    - R2_ACCESS_KEY_ID
 *    - R2_SECRET_ACCESS_KEY
 *    - BUCKET_NAME
 *    - R2_PUBLIC_URL (URL public để truy cập file, ví dụ: https://your-bucket.r2.dev)
 * 
 * 2. Chạy script:
 *    node scripts/migrate-cloudinary-to-r2.js
 * 
 * 3. Các tùy chọn:
 *    --dry-run    : Chỉ hiển thị những gì sẽ được migrate, không thực hiện thay đổi
 *    --batch=N    : Số lượng sách xử lý cùng lúc (mặc định: 5)
 *    --limit=N    : Giới hạn số sách migrate (mặc định: tất cả)
 */

import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client.js';
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

// ==================== CẤU HÌNH ====================

const CONFIG = {
  // R2 Configuration
  r2: {
    endpoint: process.env.R2_UPLOAD_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL, // URL public để truy cập file
  },
  // Folder để lưu ảnh cover trên R2
  coverFolder: "covers",
  // Pattern để nhận diện URL Cloudinary
  cloudinaryPattern: /cloudinary\.com|res\.cloudinary/i,
};

// ==================== KHỞI TẠO ====================

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const batchSize = parseInt(args.find(a => a.startsWith("--batch="))?.split("=")[1] || "5");
const limit = args.find(a => a.startsWith("--limit="))?.split("=")[1];

// Khởi tạo S3 Client cho R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: CONFIG.r2.endpoint,
  credentials: {
    accessKeyId: CONFIG.r2.accessKeyId,
    secretAccessKey: CONFIG.r2.secretAccessKey,
  },
});

// Khởi tạo Prisma Client
const connectionString = process.env.DATABASE_URL;
const schema = new URL(connectionString).searchParams.get('schema') || 'public';
const adapter = new PrismaPg({ connectionString }, { schema });
const prisma = new PrismaClient({ adapter });

// ==================== HÀM TIỆN ÍCH ====================

/**
 * Lấy extension từ URL
 */
function getExtensionFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname).toLowerCase();
    // Cloudinary có thể dùng format khác
    if (!ext || ext === "") {
      return ".jpg"; // Default
    }
    return ext;
  } catch {
    return ".jpg";
  }
}

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
 * Download ảnh từ URL
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error(`❌ Không thể download ảnh từ ${url}:`, error.message);
    return null;
  }
}

/**
 * Upload ảnh lên R2
 */
async function uploadToR2(buffer, key, contentType) {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: CONFIG.r2.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return true;
  } catch (error) {
    console.error(`❌ Không thể upload lên R2:`, error.message);
    return false;
  }
}

/**
 * Tạo URL public cho file trên R2
 */
function getR2PublicUrl(key) {
  // Nếu có cấu hình R2_PUBLIC_URL (custom domain hoặc r2.dev URL)
  if (CONFIG.r2.publicUrl) {
    return `${CONFIG.r2.publicUrl}/${key}`;
  }
  // Fallback: sử dụng format r2.dev mặc định
  return `https://${CONFIG.r2.bucketName}.r2.dev/${key}`;
}

/**
 * Xử lý migrate cho một cuốn sách
 */
async function migrateBook(book) {
  const { book_id, title, cover_image_url } = book;
  
  console.log(`\n📖 Đang xử lý sách ID ${book_id}: ${title}`);
  console.log(`   URL hiện tại: ${cover_image_url}`);

  if (isDryRun) {
    console.log(`   [DRY RUN] Sẽ migrate ảnh này sang R2`);
    return { success: true, dryRun: true };
  }

  // 1. Download ảnh từ Cloudinary
  const imageBuffer = await downloadImage(cover_image_url);
  if (!imageBuffer) {
    return { success: false, error: "Download failed" };
  }

  // 2. Tạo key mới cho R2
  const extension = getExtensionFromUrl(cover_image_url);
  const uniqueId = uuidv4();
  const key = `${CONFIG.coverFolder}/${book_id}-${uniqueId}${extension}`;
  const contentType = getContentType(extension);

  console.log(`   📤 Đang upload lên R2: ${key}`);

  // 3. Upload lên R2
  const uploaded = await uploadToR2(imageBuffer, key, contentType);
  if (!uploaded) {
    return { success: false, error: "Upload failed" };
  }

  // 4. Tạo URL public mới
  const newUrl = getR2PublicUrl(key);

  // 5. Cập nhật database
  try {
    await prisma.books.update({
      where: { book_id: BigInt(book_id) },
      data: { 
        cover_image_url: newUrl,
        updated_at: new Date(),
      },
    });
    console.log(`   ✅ Đã cập nhật URL mới: ${newUrl}`);
    return { success: true, newUrl };
  } catch (error) {
    console.error(`   ❌ Không thể cập nhật database:`, error.message);
    return { success: false, error: "Database update failed" };
  }
}

/**
 * Lấy danh sách sách cần migrate
 */
async function getBooksToMigrate() {
  const books = await prisma.books.findMany({
    where: {
      cover_image_url: {
        contains: "cloudinary",
      },
      is_deleted: false,
    },
    select: {
      book_id: true,
      title: true,
      cover_image_url: true,
    },
    orderBy: {
      book_id: "asc",
    },
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return books;
}

/**
 * Xử lý batch các sách
 */
async function processBatch(books, startIndex) {
  const batch = books.slice(startIndex, startIndex + batchSize);
  const results = await Promise.all(batch.map(book => migrateBook(book)));
  return results;
}

// ==================== MAIN ====================

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("   MIGRATE ẢNH TỪ CLOUDINARY SANG CLOUDFLARE R2");
  console.log("═══════════════════════════════════════════════════════════════");
  
  // Kiểm tra cấu hình
  if (!CONFIG.r2.accessKeyId || !CONFIG.r2.secretAccessKey || !CONFIG.r2.bucketName) {
    console.error("❌ Thiếu cấu hình R2. Vui lòng kiểm tra các biến môi trường:");
    console.error("   - R2_ACCESS_KEY_ID");
    console.error("   - R2_SECRET_ACCESS_KEY");
    console.error("   - BUCKET_NAME");
    console.error("   - R2_PUBLIC_URL (tùy chọn)");
    process.exit(1);
  }

  if (isDryRun) {
    console.log("\n🔍 CHẾ ĐỘ DRY RUN - Không có thay đổi nào được thực hiện\n");
  }

  console.log(`\n📋 Cấu hình:`);
  console.log(`   - Bucket: ${CONFIG.r2.bucketName}`);
  console.log(`   - Folder: ${CONFIG.coverFolder}`);
  console.log(`   - Batch size: ${batchSize}`);
  console.log(`   - Limit: ${limit || "Không giới hạn"}`);
  console.log(`   - Public URL base: ${CONFIG.r2.publicUrl || `https://${CONFIG.r2.bucketName}.r2.dev`}`);

  // Lấy danh sách sách cần migrate
  console.log("\n🔎 Đang tìm các sách có ảnh trên Cloudinary...");
  const books = await getBooksToMigrate();

  if (books.length === 0) {
    console.log("✅ Không có sách nào cần migrate!");
    await prisma.$disconnect();
    return;
  }

  console.log(`📚 Tìm thấy ${books.length} sách cần migrate\n`);

  // Thống kê
  let successCount = 0;
  let failCount = 0;
  const failedBooks = [];

  // Xử lý từng batch
  for (let i = 0; i < books.length; i += batchSize) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 Xử lý batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(books.length / batchSize)}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const results = await processBatch(books, i);
    
    results.forEach((result, index) => {
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        failedBooks.push({
          book: books[i + index],
          error: result.error,
        });
      }
    });

    // Delay nhỏ giữa các batch để tránh rate limit
    if (i + batchSize < books.length && !isDryRun) {
      console.log("\n⏳ Đợi 1 giây trước batch tiếp theo...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Tổng kết
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("   KẾT QUẢ MIGRATE");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`✅ Thành công: ${successCount}/${books.length}`);
  console.log(`❌ Thất bại: ${failCount}/${books.length}`);

  if (failedBooks.length > 0) {
    console.log("\n📋 Danh sách sách thất bại:");
    failedBooks.forEach(({ book, error }) => {
      console.log(`   - ID ${book.book_id}: ${book.title} (${error})`);
    });
  }

  if (isDryRun) {
    console.log("\n🔍 Đây là chế độ DRY RUN. Chạy lại không có flag --dry-run để thực hiện migrate.");
  }

  await prisma.$disconnect();
}

// Chạy script
main().catch(async (error) => {
  console.error("❌ Lỗi không mong đợi:", error);
  await prisma.$disconnect();
  process.exit(1);
});
