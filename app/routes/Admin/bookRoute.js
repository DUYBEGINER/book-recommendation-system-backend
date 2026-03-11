import express from 'express';
import { authenticateToken } from '#middlewares/authenticateToken.js';
import { uploadBookFiles } from '#middlewares/upload.middleware.js';
import {
  getBooks,
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
  deleteBooksBulkHandler,
  getBookFormatsHandler,
  getDeletedBooksHandler,
  hardDeleteBookHandler,
} from '#controllers/Admin/BookController.js';
import { getDashboard } from '#controllers/Admin/DashboardController.js';
import { 
  getGenresWithPagination, 
  createGenre, 
  updateGenre, 
  deleteGenre 
} from '#controllers/Admin/GenreController.js';
import { getAllUsers } from '#controllers/Users/UserController.js';

const router = express.Router();

// ============================================
// ADMIN DASHBOARD
// ============================================
router.get('/admin/dashboard', authenticateToken, getDashboard);

// ============================================
// ADMIN BOOK MANAGEMENT
// ============================================
router.get('/admin/books/deleted', authenticateToken, getDeletedBooksHandler);
router.get('/admin/books', authenticateToken, getBooks);
router.post('/admin/books/create', authenticateToken, uploadBookFiles, createBookHandler);
router.put('/admin/books/update/:bookId', authenticateToken, uploadBookFiles, updateBookHandler);
router.delete('/admin/books/hard-delete/:bookId', authenticateToken, hardDeleteBookHandler);
router.delete('/admin/books/delete/:bookId', authenticateToken, deleteBookHandler);
router.delete('/admin/books', authenticateToken, deleteBooksBulkHandler);

// Book formats (public - for reader)
router.get('/books/:bookId/formats', getBookFormatsHandler);

// ============================================
// ADMIN GENRE MANAGEMENT
// ============================================
router.get('/admin/books/genres', getGenresWithPagination);
router.post('/admin/genres/create', authenticateToken, createGenre);
router.put('/admin/genres/update/:genreId', authenticateToken, updateGenre);
router.delete('/admin/genres/delete/:genreId', authenticateToken, deleteGenre);

// ============================================
// ADMIN USER MANAGEMENT
// ============================================
router.get('/admin/users', authenticateToken, getAllUsers);

export { router as AdminRouter };
