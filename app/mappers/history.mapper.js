/**
 * History Mapper - Transforms Prisma reading_history entities to API response format
 * 
 * Best Practice: 
 * - Service returns raw Prisma entities
 * - Mapper transforms to API response format in controller
 * - Consistent camelCase naming for all response fields
 */

import { mapAuthors } from './book.mapper.js';

/**
 * Transform single history entity to response format
 * @param {Object} history - Raw Prisma history entity with book relation
 * @returns {Object} Formatted history response
 */
export const toHistoryResponse = (history) => {
  if (!history) return null;
  
  const book = history.books;
  
  return {
    id: history.history_id?.toString(),
    bookId: history.book_id?.toString(),
    lastReadAt: history.last_read_at || null,
    progress: history.progress ?? 0,
    book: book ? {
      id: book.book_id?.toString(),
      title: book.title,
      coverImageUrl: book.cover_image_url || null,
      authors: mapAuthors(book.book_authors),
    } : null,
  };
};

/**
 * Transform history for record/update operations (without full book details)
 * @param {Object} history - Raw Prisma history entity
 * @param {boolean} isNew - Whether this is a new history entry
 * @returns {Object} Formatted history response
 */
export const toHistoryActionResponse = (history, isNew = false) => {
  if (!history) return null;
  
  return {
    id: history.history_id?.toString(),
    bookId: history.book_id?.toString(),
    lastReadAt: history.last_read_at || null,
    progress: history.progress ?? 0,
    isNew,
  };
};

/**
 * Transform array of history entries to response format
 * @param {Array} histories - Array of raw Prisma history entities
 * @returns {Array} Array of formatted history responses
 */
export const toHistoryListResponse = (histories) => {
  if (!histories) return [];
  if (!Array.isArray(histories)) return [toHistoryResponse(histories)].filter(Boolean);
  
  return histories.map(toHistoryResponse).filter(Boolean);
};

/**
 * Transform paginated history result to response format
 * @param {Object} result - { data: histories[], pagination: {...} }
 * @returns {Object} Formatted paginated response
 */
export const toHistoryPaginatedResponse = (result) => {
  if (!result) return null;
  
  return {
    content: toHistoryListResponse(result.data),
    page: result.pagination?.page ?? 0,
    size: result.pagination?.size ?? 0,
    totalElements: result.pagination?.totalElements ?? 0,
    totalPages: result.pagination?.totalPages ?? 0,
  };
};
