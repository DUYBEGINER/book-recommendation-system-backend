import express from 'express';
import {
    getBooksByGenre,
    getBookById,
    getMostReadBooks,
    getAllBooks,
    getBookPreview,
    getBookByKeyword
} from '#controllers/Users/BookController.js';
import { getAllGenres, getGenreById } from '#controllers/Users/GenreController.js';

const router = express.Router();

// Static routes MUST come before dynamic :bookId routes
router.get('/books/genres', getAllGenres);
router.get('/books/genres/:genreId', getGenreById);
router.get('/books/most-read', getMostReadBooks);
router.get('/books/search', getBookByKeyword);  
router.get('/books/genre/:genreId', getBooksByGenre);
router.get('/books', getAllBooks);

// Dynamic routes with :bookId parameter
router.get('/books/:bookId/preview', getBookPreview);
router.get('/books/:bookId', getBookById);

export {router as UserBookRouter};