/**
 * Favorite Mapper - Transforms Prisma favorite entities to API response format
 * 
 * Best Practice: 
 * - Service returns raw Prisma entities
 * - Mapper transforms to API response format in controller
 * - Consistent camelCase naming for all response fields
 */

import { mapAuthors } from './book.mapper.js';

/**
 * Transform single favorite entity to response format
 * @param {Object} favorite - Raw Prisma favorite entity with book relation
 * @returns {Object} Formatted favorite response
 */
export const toFavoriteResponse = (favorite) => {
  if (!favorite) return null;
  
  const book = favorite.books;
  return {
    id: favorite.favorite_id?.toString(),
    bookId: favorite.book_id?.toString(),
    title: book.title,
    coverImageUrl: book.cover_image_url || null,
    authors: mapAuthors(book.book_authors),
  };
};

/**
 * Transform favorite for add/remove operations (without full book details)
 * @param {Object} favorite - Raw Prisma favorite entity
 * @param {boolean} alreadyExists - Whether this was already in favorites
 * @returns {Object} Formatted favorite response
 */
export const toFavoriteActionResponse = (favorite, alreadyExists = false) => {
  if (!favorite) return null;
  
  return {
    id: favorite.favorite_id?.toString(),
    bookId: favorite.book_id?.toString(),
    addedAt: favorite.added_at || null,
    alreadyExists,
  };
};

/**
 * Transform array of favorites to response format
 * @param {Array} favorites - Array of raw Prisma favorite entities
 * @returns {Array} Array of formatted favorite responses
 */
export const toFavoriteListResponse = (favorites) => {
  if (!favorites) return [];
  if (!Array.isArray(favorites)) return [toFavoriteResponse(favorites)].filter(Boolean);
  
  return favorites.map(toFavoriteResponse).filter(Boolean);
};

/**
 * Transform paginated favorite result to response format
 * @param {Object} result - { data: favorites[], pagination: {...} }
 * @returns {Object} Formatted paginated response
 */
export const toFavoritePaginatedResponse = (result) => {
  if (!result) return null;
  
  return {
    content: toFavoriteListResponse(result.data),
    page: result.pagination?.page ?? 0,
    size: result.pagination?.size ?? 0,
    totalElements: result.pagination?.totalElements ?? 0,
    totalPages: result.pagination?.totalPages ?? 0,
  };
};
