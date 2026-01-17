import express from 'express';
import {
    getBooksByGenre,
    getMostReadBooks,
    getAllBooks,
    getAllGenres
} from '#controllers/Users/BookController.js';

const router = express.Router();

router.get('/books/genres', getAllGenres);
router.get('/books/most-read', getMostReadBooks);
router.get('/books/genre/:genreId', getBooksByGenre);
router.get('/books', getAllBooks);


export {router as UserBookRouter};