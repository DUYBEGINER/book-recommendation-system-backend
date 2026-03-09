import { ApiResponse, logger } from "#utils/index.js";
import { getAllGenres as getAllGenresService, getGenreById as getGenreByIdService } from "#services/genreService.js";
import { toGenreListResponse, toGenreResponse } from "#mappers/genre.mapper.js";

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

/**
 * GET /books/genres/:genreId - Get genre by ID
 */
const getGenreById = async (req, res) => {
    const { genreId } = req.params;
    if (!genreId) {
        return ApiResponse.error(res, 'Genre ID is required', 400);
    }

    try {
        const genre = await getGenreByIdService(genreId);

        if (!genre) {
            return ApiResponse.error(res, 'Genre not found', 404);
        }

        const genreResponse = toGenreResponse(genre);
        return ApiResponse.success(res, genreResponse, 'Genre fetched successfully');
    } catch (err) {
        logger.error(`Error fetching genre ${genreId}: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch genre', 500);
    }
};

export { getAllGenres, getGenreById };