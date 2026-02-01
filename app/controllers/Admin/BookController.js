/**
 * Admin Book Controller
 * Handles book CRUD operations for admin panel
 */
import { ApiResponse, logger } from "#utils/index.js";
import { 
  getAdminBooks, 
  createBook, 
  updateBook, 
  deleteBook, 
  deleteBooksBulk,
  getBookFormats,
} from "#services/bookService.js";

/**
 * GET /admin/books - Get books with pagination, filters, sorting
 */
export const getBooks = async (req, res) => {
  try {
    const { page = 0, size = 10, keyword = '', genreId, sort = '' } = req.query;
    
    const books = await getAdminBooks(
      parseInt(page),
      parseInt(size),
      keyword,
      genreId || null,
      sort
    );
    
    return ApiResponse.success(res, books, 'Books fetched successfully');
  } catch (error) {
    logger.error('Get admin books error:', error);
    return ApiResponse.error(res, 'Failed to fetch books', 500);
  }
};

/**
 * POST /admin/books/create - Create a new book
 */
export const createBookHandler = async (req, res) => {
  try {
    const { title, description, coverImageUrl, publicationYear, publisher, authorIds, genreIds, formats } = req.body;
    
    if (!title) {
      return ApiResponse.error(res, 'Title is required', 400);
    }
    
    const book = await createBook({
      title,
      description,
      coverImageUrl,
      publicationYear,
      publisher,
      authorIds: authorIds || [],
      genreIds: genreIds || [],
      formats: formats || [],
    });
    
    logger.info(`Book created: ${book.id} by admin ${req.user.userId}`);
    
    return ApiResponse.created(res, book, 'Book created successfully');
  } catch (error) {
    logger.error('Create book error:', error);
    return ApiResponse.error(res, 'Failed to create book', 500);
  }
};

/**
 * PUT /admin/books/update/:bookId - Update a book
 */
export const updateBookHandler = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, description, coverImageUrl, publicationYear, publisher, authorIds, genreIds } = req.body;
    
    const book = await updateBook(bookId, {
      title,
      description,
      coverImageUrl,
      publicationYear,
      publisher,
      authorIds,
      genreIds,
    });
    
    logger.info(`Book updated: ${bookId} by admin ${req.user.userId}`);
    
    return ApiResponse.success(res, book, 'Book updated successfully');
  } catch (error) {
    logger.error('Update book error:', error);
    return ApiResponse.error(res, 'Failed to update book', 500);
  }
};

/**
 * DELETE /admin/books/delete/:bookId - Delete a book
 */
export const deleteBookHandler = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    await deleteBook(bookId);
    
    logger.info(`Book deleted: ${bookId} by admin ${req.user.userId}`);
    
    return ApiResponse.success(res, null, 'Book deleted successfully');
  } catch (error) {
    logger.error('Delete book error:', error);
    return ApiResponse.error(res, 'Failed to delete book', 500);
  }
};

/**
 * DELETE /admin/books - Bulk delete books
 */
export const deleteBooksBulkHandler = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiResponse.error(res, 'Book IDs are required', 400);
    }
    
    await deleteBooksBulk(ids);
    
    logger.info(`${ids.length} books deleted by admin ${req.user.userId}`);
    
    return ApiResponse.success(res, null, `${ids.length} books deleted successfully`);
  } catch (error) {
    logger.error('Bulk delete books error:', error);
    return ApiResponse.error(res, 'Failed to delete books', 500);
  }
};

/**
 * GET /books/:bookId/formats - Get book formats
 */
export const getBookFormatsHandler = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const formats = await getBookFormats(bookId);
    
    return ApiResponse.success(res, formats, 'Book formats fetched successfully');
  } catch (error) {
    logger.error('Get book formats error:', error);
    return ApiResponse.error(res, 'Failed to fetch book formats', 500);
  }
};