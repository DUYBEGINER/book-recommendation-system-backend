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
import { uploadBookCover } from "#config/R2UploadConfig.js";
import { uploadToMinio } from "#config/storageConfig.js";

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
 * POST /admin/books/create - Create a new book (multipart/form-data)
 *
 * Expected text fields: title, description, publicationYear, publisher,
 *   authorNames (repeated), genreIds (repeated)
 * Expected files: cover (image), pdfFile, epubFile
 */
export const createBookHandler = async (req, res) => {
  try {
    const { title, description, publicationYear, publisher } = req.body;

    if (!title) {
      return ApiResponse.error(res, 'Title is required', 400);
    }

    // Parse repeated form fields — multer may deliver a string or an array
    const authorNames = Array.isArray(req.body.authorNames)
      ? req.body.authorNames
      : req.body.authorNames ? [req.body.authorNames] : [];
    const genreIds = Array.isArray(req.body.genreIds)
      ? req.body.genreIds
      : req.body.genreIds ? [req.body.genreIds] : [];

    // ---- Upload cover image to R2 ----
    let coverImageUrl = '';
    const coverFile = req.files?.cover?.[0];
    if (coverFile) {
      const result = await uploadBookCover(coverFile.buffer, coverFile.originalname);
      if (!result.success) {
        return ApiResponse.error(res, 'Failed to upload cover image', 500);
      }
      coverImageUrl = result.url;
    }

    // ---- Upload book files to MinIO, collect format entries ----
    const formats = [];

    const pdfFile = req.files?.pdfFile?.[0];
    if (pdfFile) {
      const { key } = await uploadToMinio(pdfFile.buffer, pdfFile.originalname);
      formats.push({
        typeName: 'PDF',
        contentUrl: key,
        fileSizeKb: Math.round(pdfFile.size / 1024),
      });
    }

    const epubFile = req.files?.epubFile?.[0];
    if (epubFile) {
      const { key } = await uploadToMinio(epubFile.buffer, epubFile.originalname);
      formats.push({
        typeName: 'EPUB',
        contentUrl: key,
        fileSizeKb: Math.round(epubFile.size / 1024),
      });
    }

    // ---- Persist book + relations ----
    const book = await createBook({
      title,
      description,
      coverImageUrl,
      publicationYear,
      publisher,
      authorNames,
      genreIds,
      formats,
    });

    logger.info(`Book created: ${book.id} by admin ${req.user.userId}`);
    console.log('Created book:', book)  ;
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