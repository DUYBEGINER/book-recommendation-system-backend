import { ApiResponse, logger } from "#utils/index.js";
import { 
    getBooksByGenre as getBooksByGenreService,
    getMostReadBooks as getMostReadBooksService,
    getAllBooks as getAllBooksService,
    getAllGenres as getAllGenresService,
    getBookById as getBookByIdService
} from "#services/bookService.js";


const getBooksByGenre = async (req, res) => {
    const { genreId } = req.params;

    // Validate genreId
    if (!genreId) { return ApiResponse.error(res, 'Genre ID is required', 400); }

    try {
        const books = await getBooksByGenreService(genreId);

        return ApiResponse.success(res, books, 'Books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching books for genre ID ${genreId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch books', 500);
    }
}


const getBookById = async (req, res) => {

    // Extract bookId from request parameters
    const { bookId } = req.params;

    // Validate bookId
    if (!bookId) { return ApiResponse.error(res, 'Book ID is required', 400); }

    try {
        const book = await getBookByIdService(bookId);
        
        if (!book) {
            logger.info(`Book not found for book ID ${bookId}`);
            return ApiResponse.error(res, 'Book not found', 404);
        }

        return ApiResponse.success(res, book, 'Book fetched successfully');
    } catch (err) {
        logger.error(`Error fetching book for book ID ${bookId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch book', 500);
    }
}


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

        return ApiResponse.success(res, books, 'Most read books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching most read books: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch most read books', 500);
    }
}

const getAllBooks = async (req, res) => {
    // Extract pagination parameters
    const { page = 0, size = 12 } = req.query;

    try {
        const result = await getAllBooksService(parseInt(page), parseInt(size));

        logger.info(`Fetched ${result.data.length} books (page ${page}, size ${size})`);

        return ApiResponse.success(res, result, 'Books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching books: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch books', 500);
    }
}

const getAllGenres = async (req, res) => {
    // Extract pagination parameters
    const { page = 0, size = 10 } = req.query;

    try {
        const result = await getAllGenresService(parseInt(page), parseInt(size));

        logger.info(`Fetched ${result.data.length} genres (page ${page}, size ${size})`);

        return ApiResponse.success(res, result, 'Genres fetched successfully');
    } catch (err) {
        logger.error(`Error fetching genres: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch genres', 500);
    }
}


export { getBooksByGenre, getBookById, getMostReadBooks, getAllBooks, getAllGenres };