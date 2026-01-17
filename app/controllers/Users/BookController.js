import { ApiResponse, logger } from "#utils/index.js";
import { 
    getBooksByGenre as getBooksByGenreService,
    getMostReadBooks as getMostReadBooksService,
    getAllBooks as getAllBooksService,
    getAllGenres as getAllGenresService
} from "#services/bookService.js";


const getBooksByGenre = async (req, res) => {
    const { genreId } = req.params;
    // Validate genreId
    if (!genreId) {
        return ApiResponse.error(res, 'Genre ID is required', 400);
    }

    try {
        const books = await getBooksByGenreService(genreId);

        // Log if no books found, for monitoring purposes
        if(books.length === 0) {
            logger.info(`No books found for genre ID: ${genreId}`);
        }else{
            logger.info(`Fetched ${books.length} books for genre ID: ${genreId}`);
        }

        return ApiResponse.success(res, books, 'Books fetched successfully');
    } catch (err) {
        logger.error(`Error fetching books for genre ID ${genreId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch books', 500);
    }
}

const getMostReadBooks = async (req, res) => {
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


export { getBooksByGenre, getMostReadBooks, getAllBooks, getAllGenres };