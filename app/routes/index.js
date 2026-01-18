import express from 'express';
const router = express.Router();

//USER routes
import {UserBookRouter} from '#routes/Users/bookRoute.js';
import {UserGenreRouter} from '#routes/Users/genreRoute.js';

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});

// Mount user routes
router.use(UserBookRouter);
router.use(UserGenreRouter);

export default router;