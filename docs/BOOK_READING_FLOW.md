# Book Reading Flow – Documentation

## Tổng quan

Tài liệu mô tả luồng đọc sách (EPUB) từ khi người dùng nhấn nút **"Đọc sách"** trên trang chi tiết sách cho đến khi file EPUB được hiển thị trong trình đọc.

## Kiến trúc

```
┌──────────────┐     GET /books/:id      ┌──────────────┐     Prisma       ┌──────────────┐
│   Frontend   │ ──────────────────────►  │   Backend    │ ──────────────► │  PostgreSQL   │
│  (React)     │                          │  (Express)   │                 │  book_formats │
│              │     GET /books/:id/      │              │                 └──────────────┘
│              │       read-url           │              │
│              │ ──────────────────────►  │              │── generatePresignedUrl ──►┌─────────┐
│              │ ◄── { url, typeName }    │              │◄── presigned URL ─────────│  MinIO  │
│              │                          └──────────────┘                           └─────────┘
│              │                                                                         │
│  epub.js     │ ──────────── Load EPUB via presigned URL ──────────────────────────────►│
│              │ ◄─────────── EPUB content ──────────────────────────────────────────────│
└──────────────┘
```

## Nguyên nhân lỗi 403 (trước khi sửa)

| Vấn đề | Chi tiết |
|--------|----------|
| **Mapper trả URL trực tiếp** | `book.mapper.js` ghép `process.env.MINIO_ENDPOINT + content_url` → trả thẳng URL MinIO cho frontend |
| **MinIO bucket private** | MinIO mặc định yêu cầu xác thực, truy cập URL trực tiếp trả về **403 Forbidden** |
| **Không có presigned URL** | Không có cơ chế tạo URL có thời hạn kèm chữ ký xác thực |
| **Bug bookId undefined** | `BookDetail.jsx` dùng `bookData.id` nhưng mapper trả `bookData.bookId` → bookId luôn là `null` |

## Giải pháp

### 1. Backend – Presigned URL

Tạo endpoint mới **`GET /api/v1/books/:bookId/read-url?format=EPUB`** trả về presigned URL (có thời hạn 1 giờ) thay vì URL trực tiếp.

### 2. Backend – Download URL

Tạo endpoint **`GET /api/v1/books/:bookId/download/:formatId`** trả về presigned URL với `Content-Disposition: attachment` để trigger download.

### 3. Frontend – Fetch URL rồi mới đọc

`BookDetail.jsx` gọi API lấy presigned URL **trước** khi navigate sang `/reader`.

---

## Các file đã thay đổi

### Backend

| File | Thay đổi |
|------|----------|
| **`app/config/storageConfig.js`** *(MỚI)* | Cấu hình S3Client cho MinIO, hàm `generatePresignedUrl()` tạo presigned URL |
| **`app/services/bookService.js`** | Thêm `getBookReadUrl()`, `getBookDownloadUrl()`; thêm `format_id` vào select query của `getBookById` |
| **`app/controllers/Users/BookController.js`** | Thêm handler `getBookReadUrl`, `downloadBook` |
| **`app/routes/Users/bookRoute.js`** | Thêm route `GET /books/:bookId/read-url`, `GET /books/:bookId/download/:formatId` |
| **`app/mappers/book.mapper.js`** | Bỏ `contentUrl` (URL trực tiếp MinIO), thay bằng `formatId`; sửa `toBookSearchResponse` dùng `toBookSearchItem` |
| **`package.json`** | Thêm dependency `@aws-sdk/s3-request-presigner` |

### Frontend

| File | Thay đổi |
|------|----------|
| **`src/services/bookService.js`** | Thêm `getBookReadUrl()`, `getBookDownloadUrl()` |
| **`src/pages/BookDetail.jsx`** | Sửa `bookData.id` → `bookData.bookId`; viết lại `handleRead` (dùng presigned URL); viết lại `handleDownload` (dùng presigned URL); xóa import thừa (`axios`, `antdMessage`, `getAccessToken`, `API_BASE_URL`, `getBooks`) |
| **`src/pages/BookReader/BookReader.jsx`** | Xóa `console.log` debug |

---

## API Endpoints mới

### `GET /api/v1/books/:bookId/read-url`

Tạo presigned URL để đọc sách.

**Query Parameters:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `format` | string | `EPUB` | Định dạng ưu tiên (`EPUB`, `PDF`). Nếu không tìm thấy format yêu cầu, tự động fallback sang format khả dụng. |

**Response:**
```json
{
  "success": true,
  "message": "Read URL generated successfully",
  "data": {
    "url": "http://minio:9000/bucket/books/file.epub?X-Amz-Algorithm=...&X-Amz-Signature=...",
    "typeName": "EPUB",
    "expiresIn": 3600
  }
}
```

### `GET /api/v1/books/:bookId/download/:formatId`

Tạo presigned URL để tải sách.

**Response:**
```json
{
  "success": true,
  "message": "Download URL generated successfully",
  "data": {
    "url": "http://minio:9000/bucket/books/file.pdf?...&response-content-disposition=attachment...",
    "fileName": "Ten_Sach.pdf",
    "typeName": "PDF",
    "expiresIn": 3600
  }
}
```

---

## Biến môi trường (Backend `.env`)

```env
# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000      # MinIO server address
MINIO_ACCESS_KEY=minioadmin               # Access key
MINIO_SECRET_KEY=minioadmin               # Secret key
MINIO_BUCKET=books                        # Bucket name chứa file sách
MINIO_REGION=us-east-1                    # (Tùy chọn) Region, mặc định us-east-1
```

---

## Cấu hình MinIO CORS

Để epub.js (chạy trên browser) có thể tải file từ MinIO, cần cấu hình CORS cho bucket:

```bash
mc alias set local http://localhost:9000 minioadmin minioadmin

mc admin config set local api cors_allow_origin="http://localhost:5173"
mc admin service restart local
```

Hoặc qua MinIO Console → Bucket → Access Rules → CORS.

---

## Luồng đọc sách (chi tiết)

```
1. Người dùng mở trang chi tiết sách
   → BookDetail.jsx gọi GET /books/:bookId
   → Nhận bookData { bookId, title, formats: [{ formatId, typeName }], ... }

2. Người dùng nhấn "Đọc sách"
   → handleRead() gọi GET /books/:bookId/read-url?format=EPUB
   → Backend tìm book_formats → lấy content_url → generatePresignedUrl()
   → Trả { url: "http://minio.../file.epub?X-Amz-...", typeName: "EPUB" }

3. Frontend navigate sang /reader
   → Truyền state: { src: presignedUrl, book: { id, title, ... } }

4. BookReader.jsx khởi tạo epub.js
   → ePub(src) tải file EPUB qua presigned URL
   → Hiển thị nội dung sách

5. Trong quá trình đọc:
   → Ghi nhận vị trí đọc (localStorage)
   → Đồng bộ tiến độ đọc lên server (recordReadingHistory)
   → Quản lý bookmark (localStorage hoặc API tùy auth)
```

## Luồng tải sách (chi tiết)

```
1. Người dùng nhấn "Tải xuống"
   → handleDownload() gọi GET /books/:bookId/download/:formatId
   → Backend generatePresignedUrl() với Content-Disposition: attachment
   → Trả { url, fileName, typeName }

2. Frontend tạo <a> tag với href = presigned URL
   → Trigger click → Browser tải file
```
