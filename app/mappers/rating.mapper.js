/**
 * Rating Mapper - Transforms Prisma rating entities to API response format
 * 
 * Best Practice: 
 * - Service returns raw Prisma entities
 * - Mapper transforms to API response format in controller
 * - Consistent camelCase naming for all response fields
 */

/**
 * Transform single rating entity to response format
 * @param {Object} rating - Raw Prisma rating entity with user relation
 * @returns {Object} Formatted rating response
 */
export const toRatingResponse = (rating) => {
  if (!rating) return null;
  
  return {
    id: rating.rating_id?.toString(),
    userId: rating.user_id?.toString(),
    bookId: rating.book_id?.toString(),
    value: rating.rating_value,
    comment: rating.comment || null,
    createdAt: rating.created_at || null,
    userName: rating.users?.full_name || rating.users?.username || null,
    userAvatar: rating.users?.avatar_url || null,
  };
};

/**
 * Transform single rating entity to minimal response (for create/update)
 * @param {Object} rating - Raw Prisma rating entity
 * @param {boolean} isNew - Whether this is a new rating
 * @returns {Object} Formatted rating response
 */
export const toRatingCreateResponse = (rating, isNew = false) => {
  if (!rating) return null;
  
  return {
    id: rating.rating_id?.toString(),
    userId: rating.user_id?.toString(),
    bookId: rating.book_id?.toString(),
    value: rating.rating_value,
    comment: rating.comment || null,
    createdAt: rating.created_at || null,
    isNew,
  };
};

/**
 * Transform single rating entity to user's rating response
 * @param {Object} rating - Raw Prisma rating entity
 * @returns {Object} Formatted user rating response
 */
export const toUserRatingResponse = (rating) => {
  if (!rating) return null;
  
  return {
    id: rating.rating_id?.toString(),
    value: rating.rating_value,
    comment: rating.comment || null,
    createdAt: rating.created_at || null,
  };
};

/**
 * Transform array of ratings to response format
 * @param {Array} ratings - Array of raw Prisma rating entities
 * @returns {Array} Array of formatted rating responses
 */
export const toRatingListResponse = (ratings) => {
  if (!ratings) return [];
  if (!Array.isArray(ratings)) return [toRatingResponse(ratings)].filter(Boolean);
  
  return ratings.map(toRatingResponse).filter(Boolean);
};

/**
 * Transform average rating aggregation result
 * @param {Object} result - Prisma aggregation result
 * @returns {Object} Formatted average rating response
 */
export const toAverageRatingResponse = (result) => {
  if (!result) return { averageRating: 0, totalRatings: 0 };
  
  return {
    averageRating: result._avg?.rating_value || 0,
    totalRatings: result._count?.rating_id || 0,
  };
};
