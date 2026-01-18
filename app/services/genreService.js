import { prisma } from '#lib/prisma.js';

// Function to get all genres
const getAllGenres = async () => {
  const genres = await prisma.genres.findMany({ orderBy: { genre_id: 'asc' }, });
  return genres;
}

export { getAllGenres };