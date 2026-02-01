/**
 * Bookmark Mapper - Transforms Prisma bookmark entities to API response format
 * 
 * Best Practice: 
 * - Service returns raw Prisma entities
 * - Mapper transforms to API response format in controller
 * - Consistent camelCase naming for all response fields
 */

/**
 * Transform single bookmark entity to response format
 * @param {Object} bookmark - Raw Prisma bookmark entity
 * @returns {Object} Formatted bookmark response
 */
export const toBookmarkResponse = (bookmark) => {
  if (!bookmark) return null;
  
  return {
    id: bookmark.bookmark_id?.toString(),
    userId: bookmark.user_id?.toString(),
    bookId: bookmark.book_id?.toString(),
    pageNumber: bookmark.page_number ?? null,
    locationInBook: bookmark.location_in_book || null,
    note: bookmark.note || null,
    createdAt: bookmark.created_at || null,
  };
};

/**
 * Transform bookmark with book details (for user's all bookmarks view)
 * @param {Object} bookmark - Raw Prisma bookmark entity with book relation
 * @returns {Object} Formatted bookmark with book response
 */
export const toBookmarkWithBookResponse = (bookmark) => {
  if (!bookmark) return null;
  
  const book = bookmark.books;
  
  return {
    id: bookmark.bookmark_id?.toString(),
    bookId: bookmark.book_id?.toString(),
    pageNumber: bookmark.page_number ?? null,
    locationInBook: bookmark.location_in_book || null,
    note: bookmark.note || null,
    createdAt: bookmark.created_at || null,
    book: book ? {
      id: book.book_id?.toString(),
      title: book.title,
      coverImageUrl: book.cover_image_url || null,
    } : null,
  };
};

/**
 * Transform array of bookmarks to response format
 * @param {Array} bookmarks - Array of raw Prisma bookmark entities
 * @returns {Array} Array of formatted bookmark responses
 */
export const toBookmarkListResponse = (bookmarks) => {
  if (!bookmarks) return [];
  if (!Array.isArray(bookmarks)) return [toBookmarkResponse(bookmarks)].filter(Boolean);
  
  return bookmarks.map(toBookmarkResponse).filter(Boolean);
};

/**
 * Transform paginated bookmarks result to response format
 * @param {Object} result - { data: bookmarks[], pagination: {...} }
 * @returns {Object} Formatted paginated response
 */
export const toBookmarkPaginatedResponse = (result) => {
  if (!result) return null;
  
  return {
    content: result.data?.map(toBookmarkWithBookResponse).filter(Boolean) || [],
    page: result.pagination?.page ?? 0,
    size: result.pagination?.size ?? 0,
    totalElements: result.pagination?.totalElements ?? 0,
    totalPages: result.pagination?.totalPages ?? 0,
  };
};
