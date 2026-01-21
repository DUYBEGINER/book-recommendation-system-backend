import express from 'express';
const router = express.Router();

//USER routes
import {UserBookRouter} from '#routes/Users/bookRoute.js';
import {UserGenreRouter} from '#routes/Users/genreRoute.js';
import {AuthRouter} from '#routes/authRoute.js';



// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});

// Mount user routes
router.use(UserBookRouter);
router.use(UserGenreRouter);
// Mount auth routes
router.use(AuthRouter);


export default router;