/**
 * User Mapper - Transforms Prisma user entities to API response format
 * 
 * Best Practice: 
 * - Service returns raw Prisma entities
 * - Mapper transforms to API response format in controller
 * - Consistent camelCase naming for all response fields
 */

/**
 * Determine user status based on is_ban and is_activate flags
 * @param {Object} user - Raw Prisma user entity
 * @returns {string} 'BANNED' | 'ACTIVE' | 'INACTIVE'
 */
const getUserStatus = (user) => {
  if (user.is_ban) return 'BANNED';
  if (user.is_activate) return 'ACTIVE';
  return 'INACTIVE';
};

/**
 * Transform single user entity to profile response format
 * @param {Object} user - Raw Prisma user entity
 * @returns {Object} Formatted user response
 */
export const toUserResponse = (user) => {
  if (!user) return null;
  
  return {
    id: user.user_id?.toString(),
    username: user.username,
    email: user.email,
    fullName: user.full_name || null,
    phoneNumber: user.phone_number || null,
    avatarUrl: user.avatar_url || null,
    status: getUserStatus(user),
    role: user.roles?.role_name || null,
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null,
  };
};

/**
 * Transform single user entity to minimal profile response
 * (Used after update operations)
 * @param {Object} user - Raw Prisma user entity
 * @returns {Object} Formatted minimal user response
 */
export const toUserProfileResponse = (user) => {
  if (!user) return null;
  
  return {
    id: user.user_id?.toString(),
    username: user.username,
    email: user.email,
    fullName: user.full_name || null,
    phoneNumber: user.phone_number || null,
    avatarUrl: user.avatar_url || null,
    role: user.roles?.role_name || null,
    updatedAt: user.updated_at || null,
  };
};

/**
 * Transform user entity to avatar response
 * @param {Object} user - Raw Prisma user entity
 * @returns {Object} Formatted avatar response
 */
export const toUserAvatarResponse = (user) => {
  if (!user) return null;
  
  return {
    id: user.user_id?.toString(),
    avatarUrl: user.avatar_url || null,
  };
};

/**
 * Transform array of users to list response format (for admin)
 * @param {Array} users - Array of raw Prisma user entities
 * @returns {Array} Array of formatted user responses
 */
export const toUserListResponse = (users) => {
  if (!users) return [];
  if (!Array.isArray(users)) return [toUserResponse(users)].filter(Boolean);
  
  return users.map(user => ({
    id: user.user_id?.toString(),
    username: user.username,
    email: user.email,
    fullName: user.full_name || null,
    phoneNumber: user.phone_number || null,
    avatarUrl: user.avatar_url || null,
    status: getUserStatus(user),
    role: user.roles?.role_name || null,
    createdAt: user.created_at || null,
  })).filter(Boolean);
};

/**
 * Transform paginated users result to response format
 * @param {Object} result - { data: users[], pagination: {...} }
 * @returns {Object} Formatted paginated response
 */
export const toUserPaginatedResponse = (result) => {
  if (!result) return null;
  
  return {
    content: toUserListResponse(result.data),
    page: result.pagination?.page ?? 0,
    size: result.pagination?.size ?? 0,
    totalElements: result.pagination?.totalElements ?? 0,
    totalPages: result.pagination?.totalPages ?? 0,
  };
};
