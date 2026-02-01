import { ApiResponse, logger } from "#utils/index.js";
import { getAllGenres as getAllGenresService } from "#services/genreService.js";
import { toGenreListResponse } from "#mappers/genre.mapper.js";

/**
 * GET /books/genres - Get all genres
 */
const getAllGenres = async (req, res) => {
    try {
        // 1. Call service to get raw genre entities
        const genres = await getAllGenresService();

        logger.info(`Fetched ${genres.length} genres`);

        // 2. Transform to response format via mapper
        const genresResponse = toGenreListResponse(genres);
        
        return ApiResponse.success(res, genresResponse, 'Genres fetched successfully');
    } catch (err) {
        logger.error(`Error fetching genres: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch genres', 500);
    }
};

export { getAllGenres };