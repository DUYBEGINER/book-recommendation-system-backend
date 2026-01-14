import { prisma } from '#lib/prisma.js';


const getBooksByGenre = async (genreId, offset = 0, limit = 10) => {
  return prisma.books.findMany({
    where: {
      book_genres: {
        some: {
          genre_id: BigInt(genreId),
        },
      },
    },
    orderBy: { book_id: "asc" },
    skip: offset,
    take: limit,
    include: {
      book_genres: true, // Include genres
    },
  });
}

export { getBooksByGenre };

