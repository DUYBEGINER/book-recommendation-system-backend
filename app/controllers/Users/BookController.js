import { ApiResponse, logger } from "#utils/index.js";
import { toBookListResponse, toBookDetailResponse, toBookPreviewResponse } from "../../mappers/book.mapper.js";
import { 
    getBooksByGenre as getBooksByGenreService,
    getMostReadBooks as getMostReadBooksService,
    getAllBooks as getAllBooksService,
    getBookById as getBookByIdService,
    getBookPreview as getBookPreviewService
} from "#services/bookService.js";

// Controller to get all books with pagination
const getAllBooks = async (req, res) => {
    // Extract pagination parameters
    const { page = 0, size = 12 } = req.query;

    try {
        const books = await getAllBooksService(parseInt(page), parseInt(size));

        logger.info(`Fetched ${books.data.length} books (page ${page}, size ${size})`);

        const booksResponse = toBookListResponse(books.data);
        return ApiResponse.success(res, booksResponse, 'Books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching books: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch books', 500);
    }
}

// Controller to get book details by ID
const getBookById = async (req, res) => {

    // Extract bookId from request parameters
    const { bookId } = req.params;

    // Validate bookId
    if (!bookId) { return ApiResponse.error(res, 'Book ID is required', 400); }

    try {
        const book = await getBookByIdService(bookId);
        
        if (!book) {
            return ApiResponse.error(res, 'Book not found', 404);
        }

        const bookResponse = toBookDetailResponse(book);
        return ApiResponse.success(res, bookResponse, 'Book fetched successfully');
    } catch (err) {
        logger.error(`Error fetching book for book ID ${bookId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch book', 500);
    }
}

// Controller to get books by genre
const getBooksByGenre = async (req, res) => {
    const { genreId } = req.params;

    // Validate genreId
    if (!genreId) { return ApiResponse.error(res, 'Genre ID is required', 400); }

    try {
        const books = await getBooksByGenreService(genreId);
        const bookResponse = toBookListResponse(books);
        return ApiResponse.success(res, bookResponse, 'Books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching books for genre ID ${genreId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch books', 500);
    }
}


// Controller to get most read books
const getMostReadBooks = async (req, res) => {
    // Extract pagination parameters
    const { limit = 10, offset = 0 } = req.query;

    try {
        const books = await getMostReadBooksService(parseInt(offset), parseInt(limit));

        if(books.length === 0) {
            logger.info('No reading history found');
        } else {
            logger.info(`Fetched ${books.length} most read books`);
        }

        const booksResponse = toBookListResponse(books);
        return ApiResponse.success(res, booksResponse, 'Most read books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching most read books: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch most read books', 500);
    }
}


const getBookPreview = async (req, res) => {
    const { bookId } = req.params;

    if (!bookId) { return ApiResponse.error(res, 'Book ID is required', 400); }

    try {
        const book = await getBookPreviewService(bookId);
        
        if (!book) {
            return ApiResponse.error(res, 'Book not found', 404);
        }

        const bookResponse = toBookPreviewResponse(book);
        return ApiResponse.success(res, bookResponse, 'Book preview fetched successfully');
    } catch (err) {
        logger.error(`Error fetching book preview for book ID ${bookId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch book preview', 500);
    }
}

export { getBooksByGenre, getBookById, getMostReadBooks, getAllBooks, getBookPreview };