import { ApiResponse, logger } from "#utils/index.js";
import { getAllGenres as getAllGenresService } from "#services/genreService.js";
import { toGenreResponse } from "#mappers/genre.mapper.js";

const getAllGenres = async (req, res) => {


    try {
        //1. Call service to get genres
        const genres = await getAllGenresService();

        logger.info(`Fetched ${genres.length} genres`);

        const genresResponse = genres.map(toGenreResponse);
        return ApiResponse.success(res, genresResponse, 'Genres fetched successfully');
    } catch (err) {
        logger.error(`Error fetching genres: ${err.message}`);
        return ApiResponse.error(res, 'Failed to fetch genres', 500);
    }
}


export { getAllGenres };