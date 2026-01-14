import express from 'express';
const router = express.Router();

//USER routes
import {UserBookRouter} from '#routes/Users/bookRoute.js';

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});

router.use(UserBookRouter);

export default router;