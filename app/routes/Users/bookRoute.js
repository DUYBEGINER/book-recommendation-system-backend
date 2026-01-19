import express from 'express';
import {
    getBooksByGenre,
    getBookById,
    getMostReadBooks,
    getAllBooks,
    getBookPreview,
    getBookByKeyword
} from '#controllers/Users/BookController.js';

const router = express.Router();


router.get('/books/most-read', getMostReadBooks);
router.get('/books/search', getBookByKeyword);  
router.get('/books/genre/:genreId', getBooksByGenre);
router.get('/books', getAllBooks);
router.get('/books/:bookId/preview', getBookPreview);
router.get('/books/:bookId', getBookById);

export {router as UserBookRouter};