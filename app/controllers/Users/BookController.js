import { ApiResponse, logger } from "#utils/index.js";
import { getBooksByGenre as getBooksByGenreService } from "#services/bookService.js";


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


export { getBooksByGenre };