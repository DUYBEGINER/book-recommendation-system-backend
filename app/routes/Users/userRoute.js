import express from 'express';
import { authenticateToken } from '#middlewares/authenticateToken.js';
import {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  changeUserPassword,
  getUserFavorites,
  addFavorite,
  removeFavorite,
  getUserHistory,
  recordHistory,
  getBookRatings,
  createOrUpdateRating,
  deleteRating,
  getAverageRating,
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  banUser,
  unbanUser,
  banUsersBulk,
} from '#controllers/Users/UserController.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (for ratings, can be viewed without auth)
// ============================================

// Get ratings for a book (userId='0' returns all ratings)
router.get('/users/:userId/books/:bookId/ratings', getBookRatings);

// Get average rating for a book
router.get('/users/:userId/books/:bookId/average-rating', getAverageRating);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

// Profile routes
router.get('/users/:userId', authenticateToken, getUserProfile);
router.put('/users/:userId/update', authenticateToken, updateUserProfile);
router.patch('/users/:userId/avatar', authenticateToken, updateUserAvatar);
router.patch('/users/:userId/change-password', authenticateToken, changeUserPassword);

// Favorites routes
router.get('/users/:userId/favorites', authenticateToken, getUserFavorites);
router.post('/users/:userId/favorites/:bookId', authenticateToken, addFavorite);
router.delete('/users/:userId/favorites/:bookId', authenticateToken, removeFavorite);

// History routes
router.get('/users/:userId/history', authenticateToken, getUserHistory);
router.post('/users/:userId/books/:bookId/history', authenticateToken, recordHistory);

// Ratings routes (create/update/delete require auth)
router.post('/users/:userId/books/:bookId/ratings', authenticateToken, createOrUpdateRating);
router.delete('/users/:userId/books/:bookId/ratings', authenticateToken, deleteRating);

// Bookmarks routes
router.get('/users/:userId/books/:bookId/bookmarks', authenticateToken, getBookmarks);
router.post('/users/:userId/books/:bookId/bookmarks', authenticateToken, createBookmark);
router.put('/users/:userId/bookmarks/:bookmarkId', authenticateToken, updateBookmark);
router.delete('/users/:userId/bookmarks/:bookmarkId', authenticateToken, deleteBookmark);

// User management (admin actions but can be user-initiated)
router.patch('/users/:userId/ban', authenticateToken, banUser);
router.patch('/users/:userId/unban', authenticateToken, unbanUser);
router.patch('/users/ban', authenticateToken, banUsersBulk);

export { router as UserRouter };
