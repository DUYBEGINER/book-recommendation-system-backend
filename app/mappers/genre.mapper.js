/**
 * Genre Mapper - Transforms Prisma genre entities to API response format
 * 
 * Best Practice: 
 * - Service returns raw Prisma entities
 * - Mapper transforms to API response format in controller
 * - Consistent camelCase naming for all response fields
 */

/**
 * Transform single genre entity to response format
 * @param {Object} genre - Raw Prisma genre entity
 * @returns {Object} Formatted genre response
 */
const toGenreResponse = (genre) => {
  if (!genre) return null;
  
  return {
    genreId: genre.genre_id?.toString() || genre.id,
    genreName: genre.genre_name || genre.name,
    description: genre.description || null,
  };
};

/**
 * Transform array of genres to response format
 * @param {Array} genres - Array of raw Prisma genre entities
 * @returns {Array} Array of formatted genre responses
 */
const toGenreListResponse = (genres) => {
  if (!genres) return [];
  if (!Array.isArray(genres)) return [toGenreResponse(genres)].filter(Boolean);
  
  return genres.map(toGenreResponse).filter(Boolean);
};

/**
 * Transform paginated genres result to response format
 * @param {Object} result - { data: genres[], pagination: {...} }
 * @returns {Object} Formatted paginated response
 */
const toGenrePaginatedResponse = (result) => {
  if (!result) return null;
  
  return {
    content: toGenreListResponse(result.data),
    page: result.pagination?.page ?? 0,
    size: result.pagination?.size ?? 0,
    totalElements: result.pagination?.totalElements ?? 0,
    totalPages: result.pagination?.totalPages ?? 0,
  };
};

export { 
  toGenreResponse, 
  toGenreListResponse, 
  toGenrePaginatedResponse 
};