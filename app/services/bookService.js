import { prisma } from '#lib/prisma.js';

// Function to get books by genre
const getBooksByGenre = async (genreId, offset = 0, limit = 10) => {
  const books = await prisma.books.findMany({
    where: {
      is_deleted: false,
      book_genres: {
        some: {
          genre_id: BigInt(genreId),
        },
      },

    },
    orderBy: { book_id: "asc" },
    skip: offset,
    take: limit,
    select: {
      book_id: true,
      title: true,
      cover_image_url: true,
      book_authors: {
        select: {
          authors: {
            select: {
              author_id: true,
              author_name: true,
            },
          },
        },
      },
    },
  });  
  return books;
}

//Function to get books by book_id
const getBookById = async (bookId) => {
  const book = await prisma.books.findUnique({
    where: {
      book_id: BigInt(bookId),
    },
    include: {
      book_authors: {
        include: {
          authors: true,
        },
      },
      book_genres: {
        include: {
          genres: true,
        },
      },
      book_formats: true,
    },
  });
  
  return book;
}

// Function to get most read books
const getMostReadBooks = async (offset = 0, limit = 10) => {
  // Query to get books with most reading history count
  const mostReadBooks = await prisma.reading_history.groupBy({
    by: ['book_id'],
    _count: {
      book_id: true,
    },
    orderBy: {
      _count: {
        book_id: 'desc',
      },
    },
    skip: offset,
    take: limit,
  });

  // Get full book details for the most read books
  const bookIds = mostReadBooks.map(item => item.book_id);

  const books = await prisma.books.findMany({
    where: {
      book_id: {
        in: bookIds,
      },
    },
    include: {
      book_genres: true,
      book_authors: {
        include: {
          authors: true,
        },
      },
    },
  });

  // Map books with read count and sort by read count
  const booksWithCount = books.map(book => {
    const readCount = mostReadBooks.find(item => item.book_id === book.book_id)?._count.book_id || 0;
    return {
      ...book,
      read_count: readCount,
    };
  }).sort((a, b) => b.read_count - a.read_count);

  return booksWithCount;
}

// Function to get all books with pagination
const getAllBooks = async (page = 0, size = 12) => {
  const skip = page * size;

  const [books, total] = await Promise.all([
    prisma.books.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: { book_id: 'asc' },
      skip: skip,
      take: size,
      include: {
        book_genres: {
          include: {
            genres: true,
          },
        },
        book_authors: {
          include: {
            authors: true,
          },
        },
      },
    }),
    prisma.books.count({
      where: {
        is_deleted: false,
      },
    }),
  ]);

  return {
    data: books,
    pagination: {
      page: page,
      size: size,
      total: total,
      totalPages: Math.ceil(total / size),
    }
  };
}



// const createBook = async (bookData) => {
//   const book = await prisma.books.create({
//     data: bookData,
//   });
//   return book;
// }





export { getBooksByGenre, getBookById, getMostReadBooks, getAllBooks };

