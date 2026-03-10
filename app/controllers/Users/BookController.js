import { ApiResponse, logger } from "#utils/index.js";
import { toBookListResponse, toBookDetailResponse, toBookPreviewResponse, toBookSearchResponse } from "../../mappers/book.mapper.js";
import { 
    getBooksByGenre as getBooksByGenreService,
    getMostReadBooks as getMostReadBooksService,
    getAllBooks as getAllBooksService,
    getBookById as getBookByIdService,
    getBookPreview as getBookPreviewService,
    getBookByKeyword as getBookByKeywordService,
    getBookReadUrl as getBookReadUrlService,
    getBookDownloadUrl as getBookDownloadUrlService,
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
    const userId = req.query.userId; // Optional userId for personalized details

    // Validate bookId
    if (!bookId) { return ApiResponse.error(res, 'Book ID is required', 400); }

    try {
        const book = await getBookByIdService(bookId, userId);
        
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
    const { page = 0, size = 10, sort = 'newest' } = req.query;

    // Validate genreId
    if (!genreId) { return ApiResponse.error(res, 'Genre ID is required', 400); }

    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);

    if (Number.isNaN(pageNum) || pageNum < 0) {
        return ApiResponse.error(res, 'Invalid page parameter', 400);
    }
    if (Number.isNaN(sizeNum) || sizeNum < 1 || sizeNum > 100) {
        return ApiResponse.error(res, 'Invalid size parameter (1-100)', 400);
    }

    const allowedSorts = ['newest', 'popular', 'title-asc', 'title-desc'];
    const validSort = allowedSorts.includes(sort) ? sort : 'newest';

    try {
        const result = await getBooksByGenreService(genreId, pageNum, sizeNum, validSort);
        const bookResponse = toBookListResponse(result.data);
        return ApiResponse.success(res, {
            content: bookResponse,
            ...result.pagination,
        }, 'Books fetched successfully');
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

const getBookByKeyword = async (req, res) => {
    const {keyword , page = 0, size = 10} = req.query;

    if (!keyword || Number.isNaN(parseInt(page)) || Number.isNaN(parseInt(size))) {
        return ApiResponse.error(res, 'query params are invalid', 400);
    }

    try{
        const books = await getBookByKeywordService(keyword, parseInt(page), parseInt(size));
        const booksResponse = toBookSearchResponse(books);
        return ApiResponse.success(res, booksResponse, 'Books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching books for keyword ${keyword}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch books', 500);
    }

}

// Controller to get a presigned read URL for a book
const getBookReadUrl = async (req, res) => {
    const { bookId } = req.params;
    const { format = 'EPUB' } = req.query;

    if (!bookId) { return ApiResponse.error(res, 'Book ID is required', 400); }

    try {
        const result = await getBookReadUrlService(bookId, format);

        if (!result) {
            return ApiResponse.error(res, 'Book format not found', 404);
        }

        return ApiResponse.success(res, result, 'Read URL generated successfully');
    } catch (err) {
        logger.error(`Error generating read URL for book ${bookId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to generate read URL', 500);
    }
}

// Controller to get a presigned download URL for a book format
const downloadBook = async (req, res) => {
    const { bookId, formatId } = req.params;

    if (!bookId || !formatId) {
        return ApiResponse.error(res, 'Book ID and format ID are required', 400);
    }

    try {
        const result = await getBookDownloadUrlService(bookId, formatId);

        if (!result) {
            return ApiResponse.error(res, 'Book format not found', 404);
        }

        return ApiResponse.success(res, result, 'Download URL generated successfully');
    } catch (err) {
        logger.error(`Error generating download URL for book ${bookId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to generate download URL', 500);
    }
}

export { getBooksByGenre, getBookById, getMostReadBooks, getAllBooks, getBookPreview, getBookByKeyword, getBookReadUrl, downloadBook };