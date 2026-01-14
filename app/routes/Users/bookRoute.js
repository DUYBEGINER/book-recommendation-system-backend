import express from 'express';
import {getBooksByGenre} from '#controllers/Users/BookController.js';

const router = express.Router();

router.get('/books/genre/:genreId', getBooksByGenre);


export {router as UserBookRouter};