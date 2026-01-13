import { prisma } from '../lib/prisma.js';

const getBooksByGenre = async (genreId, offset = 0, limit = 10) => {
    return prisma.books.findMany({
    where: {
      book_genres: {
        some: {
          genre_id: genreId,
        },
      },
    },
    orderBy: { book_id: "asc" },
    skip: offset,
    take: limit,
    include: {
      book_genres: true, // để thấy các record nối
    },
  });
}

export { getBooksByGenre };

    