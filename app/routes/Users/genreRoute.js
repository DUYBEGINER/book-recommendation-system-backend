import express from 'express';
import { getAllGenres } from '#controllers/Users/GenreController.js';

const router = express.Router();

router.get('/genres', getAllGenres);

export {router as UserGenreRouter};