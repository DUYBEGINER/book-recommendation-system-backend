import express from 'express';
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/books/genre/:genreId', async (req, res) => {
  const { genreId } = req.params;
  console.log(`Fetching books for genre ID: ${genreId}`);
  const { getBooksByGenre } = await import('../services/bookService.js');
  const books = await getBooksByGenre(genreId);
  res.json(books);
});

export default router;