import express from 'express';
import {
    getBooksByGenre,
    getBookById,
    getMostReadBooks,
    getAllBooks,
} from '#controllers/Users/BookController.js';

const router = express.Router();


router.get('/books/most-read', getMostReadBooks);
router.get('/books/genre/:genreId', getBooksByGenre);
router.get('/books', getAllBooks);
router.get('/books/:bookId', getBookById);

export {router as UserBookRouter};