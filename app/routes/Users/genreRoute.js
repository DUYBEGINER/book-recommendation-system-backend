import express from 'express';
import { getAllGenres, getGenreById } from '#controllers/Users/GenreController.js';

const router = express.Router();

router.get('/genres', getAllGenres);
router.get('/genres/:genreId', getGenreById);

export {router as UserGenreRouter};