import { prisma } from '#lib/prisma.js';
import { generatePresignedUrl } from '#config/storageConfig.js';

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

// Function to get books by genre with pagination
const getBooksByGenre = async (genreId, page = 0, size = 10, sort = 'newest') => {
  // Determine sorting order
  let orderBy;
  switch (sort) {
    case 'popular':
      orderBy = { book_id: "desc" }; // Can be updated with actual popularity metric
      break;
    case 'newest':
      orderBy = { created_at: "desc" };
      break;
    case 'title-asc':
      orderBy = { title: "asc" };
      break;
    case 'title-desc':
      orderBy = { title: "desc" };
      break;
    default:
      orderBy = { book_id: "asc" };
  }

  const where = {
    is_deleted: false,
    book_genres: {
      some: {
        genre_id: BigInt(genreId),
      },
    },
  };

  const skip = page * size;

  const [books, total] = await prisma.$transaction([
    prisma.books.findMany({
      where,
      orderBy,
      skip,
      take: size,
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
        book_genres: {
          select: {
            genres: {
              select: {
                genre_id: true,
                genre_name: true,
              },
            },
          },
        },
      },
    }),
    prisma.books.count({ where }),
  ]);

  return {
    data: books,
    pagination: {
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    },
  };
}

//Function to get books by book_id
const getBookById = async (bookId, userId = null) => {
  const bookIdBig = BigInt(bookId);

  const book = await prisma.books.findUnique({
    where: {
      book_id: bookIdBig,
      is_deleted: false,
    },
    select: {
      book_id: true,
      title: true,
      cover_image_url: true,
      description: true,
      publisher: true,
      publication_year: true,
      book_authors: {
        select: {
          authors: true
        },
      },
      book_genres: {
        select: {
          genres: true,
        },
      },
      book_formats: {
        select: {
          format_id: true,
          book_types: {
            select: {
              type_name: true,
            },
          },
          content_url: true,
        },
      },
      ratings: {
        orderBy: { created_at: 'desc' },
        select: {
          rating_id: true,
          rating_value: true,
          comment: true,
          created_at: true,
          users: {
            select: {
              user_id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
        },
      },
    },
  });

  if (!book) return null;

  // Compute isFav if userId is provided
  let isFav = false;
  if (userId) {
    const favorite = await prisma.favorites.findFirst({
      where: {
        user_id: BigInt(userId),
        book_id: bookIdBig,
      },
      select: { favorite_id: true },
    });
    isFav = !!favorite;
  }

  return { ...book, isFav };
}

// Function to get book preview (for hover card)
const getBookPreview = async (bookId) => {
  const book = await prisma.books.findUnique({
    where: {
      book_id: BigInt(bookId),
    },
    select: {
      book_id: true,
      description: true,
      cover_image_url: true,
      publication_year: true,
      book_authors: {
        select: {
          authors: true
        },
      },
      book_genres: {
        select: {
          genres: {
            select: {
              genre_id: true,
              genre_name: true,
            },
          },
        },
      },
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

const getBookByKeyword = async (keyword, offset = 0, limit = 10) => {
  const books = await prisma.books.findMany({
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
      }
    },
    where: {
      is_deleted: false,
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } }
        ],
      }),
    },
    orderBy: { book_id: 'asc' },
    skip: offset,
    take: limit,
  });
  return books;
}

/**
 * Get books for admin panel with pagination, filters, and sorting
 */
const getAdminBooks = async (page = 0, size = 10, keyword = '', genreId = null, sort = '') => {
  const skip = page * size;

  // Build where clause
  const where = { is_deleted: false };

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  if (genreId) {
    where.book_genres = {
      some: { genre_id: BigInt(genreId) },
    };
  }

  // Build orderBy
  let orderBy = { created_at: 'desc' }; // Default: newest
  if (sort === 'oldest') {
    orderBy = { created_at: 'asc' };
  } else if (sort === 'title-asc') {
    orderBy = { title: 'asc' };
  } else if (sort === 'title-desc') {
    orderBy = { title: 'desc' };
  }

  const [books, total] = await Promise.all([
    prisma.books.findMany({
      where,
      orderBy,
      skip,
      take: size,
      include: {
        book_genres: {
          include: { genres: true },
        },
        book_authors: {
          include: { authors: true },
        },
      },
    }),
    prisma.books.count({ where }),
  ]);

  const content = books.map(book => ({
    id: book.book_id.toString(),
    title: book.title,
    coverImageUrl: book.cover_image_url,
    publicationYear: book.publication_year,
    publisher: book.publisher,
    createdAt: book.created_at,
    genres: book.book_genres.map(bg => ({
      id: bg.genres.genre_id.toString(),
      name: bg.genres.genre_name,
    })),
    authors: book.book_authors.map(ba => ({
      id: ba.authors.author_id.toString(),
      name: ba.authors.author_name,
    })),
  }));

  return {
    content,
    number: page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size),
  };
};

/**
 * Create a new book with authors and genres
 */
const createBook = async (bookData) => {
  const { title, description, coverImageUrl, publicationYear, publisher, authorIds, genreIds, formats } = bookData;

  const book = await prisma.books.create({
    data: {
      title,
      description: description || '',
      cover_image_url: coverImageUrl || '',
      publication_year: publicationYear ? parseInt(publicationYear) : null,
      publisher: publisher || null,
    },
  });

  // Add author relationships
  if (authorIds && authorIds.length > 0) {
    await prisma.book_authors.createMany({
      data: authorIds.map(authorId => ({
        book_id: book.book_id,
        author_id: BigInt(authorId),
      })),
    });
  }

  // Add genre relationships
  if (genreIds && genreIds.length > 0) {
    await prisma.book_genres.createMany({
      data: genreIds.map(genreId => ({
        book_id: book.book_id,
        genre_id: BigInt(genreId),
      })),
    });
  }

  // Add book formats if provided
  if (formats && formats.length > 0) {
    for (const format of formats) {
      // Find or create book type
      let bookType = await prisma.book_types.findUnique({
        where: { type_name: format.typeName },
      });

      if (!bookType) {
        bookType = await prisma.book_types.create({
          data: { type_name: format.typeName },
        });
      }

      await prisma.book_formats.create({
        data: {
          book_id: book.book_id,
          type_id: bookType.type_id,
          content_url: format.contentUrl,
          total_pages: format.totalPages || null,
          file_size_kb: format.fileSizeKb || null,
        },
      });
    }
  }

  return {
    id: book.book_id.toString(),
    title: book.title,
    createdAt: book.created_at,
  };
};

/**
 * Update a book
 */
const updateBook = async (bookId, bookData) => {
  const { title, description, coverImageUrl, publicationYear, publisher, authorIds, genreIds } = bookData;

  const updateData = { updated_at: new Date() };
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (coverImageUrl !== undefined) updateData.cover_image_url = coverImageUrl;
  if (publicationYear !== undefined) updateData.publication_year = publicationYear ? parseInt(publicationYear) : null;
  if (publisher !== undefined) updateData.publisher = publisher;

  const book = await prisma.books.update({
    where: { book_id: BigInt(bookId) },
    data: updateData,
  });

  // Update author relationships if provided
  if (authorIds !== undefined) {
    await prisma.book_authors.deleteMany({
      where: { book_id: BigInt(bookId) },
    });

    if (authorIds.length > 0) {
      await prisma.book_authors.createMany({
        data: authorIds.map(authorId => ({
          book_id: BigInt(bookId),
          author_id: BigInt(authorId),
        })),
      });
    }
  }

  // Update genre relationships if provided
  if (genreIds !== undefined) {
    await prisma.book_genres.deleteMany({
      where: { book_id: BigInt(bookId) },
    });

    if (genreIds.length > 0) {
      await prisma.book_genres.createMany({
        data: genreIds.map(genreId => ({
          book_id: BigInt(bookId),
          genre_id: BigInt(genreId),
        })),
      });
    }
  }

  return {
    id: book.book_id.toString(),
    title: book.title,
    updatedAt: book.updated_at,
  };
};

/**
 * Soft delete a book
 */
const deleteBook = async (bookId) => {
  await prisma.books.update({
    where: { book_id: BigInt(bookId) },
    data: {
      is_deleted: true,
      updated_at: new Date(),
    },
  });
  return true;
};

/**
 * Bulk soft delete books
 */
const deleteBooksBulk = async (bookIds) => {
  await prisma.books.updateMany({
    where: {
      book_id: { in: bookIds.map(id => BigInt(id)) },
    },
    data: {
      is_deleted: true,
      updated_at: new Date(),
    },
  });
  return true;
};

/**
 * Get book formats (for reading)
 */
const getBookFormats = async (bookId) => {
  const formats = await prisma.book_formats.findMany({
    where: { book_id: BigInt(bookId) },
    include: {
      book_types: true,
    },
  });

  return formats.map(format => ({
    id: format.format_id.toString(),
    typeName: format.book_types.type_name,
    contentUrl: format.content_url,
    totalPages: format.total_pages,
    fileSizeKb: format.file_size_kb,
  }));
};

/**
 * Generate a presigned read URL for a book.
 * Tries the requested format first, then falls back to any available format.
 */
const getBookReadUrl = async (bookId, formatType = 'EPUB') => {
  const where = {
    book_id: BigInt(bookId),
    books: { is_deleted: false },
  };

  // Try the requested format first
  let bookFormat = await prisma.book_formats.findFirst({
    where: {
      ...where,
      book_types: { type_name: { equals: formatType, mode: 'insensitive' } },
    },
    include: { book_types: true },
  });

  // Fallback to any available format
  if (!bookFormat) {
    bookFormat = await prisma.book_formats.findFirst({
      where,
      include: { book_types: true },
    });
  }

  if (!bookFormat) return null;

  const url = await generatePresignedUrl(bookFormat.content_url);
  return {
    url,
    typeName: bookFormat.book_types.type_name,
    expiresIn: 3600,
  };
};

/**
 * Generate a presigned download URL for a specific book format.
 * Sets Content-Disposition to trigger a browser download.
 */
const getBookDownloadUrl = async (bookId, formatId) => {
  const bookFormat = await prisma.book_formats.findFirst({
    where: {
      format_id: BigInt(formatId),
      book_id: BigInt(bookId),
      books: { is_deleted: false },
    },
    include: {
      book_types: true,
      books: { select: { title: true } },
    },
  });

  if (!bookFormat) return null;

  const extension = bookFormat.book_types.type_name.toLowerCase();
  const sanitizedTitle = (bookFormat.books.title || 'book')
    .replace(/[^\w\d\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim() || 'book';
  const fileName = `${sanitizedTitle}.${extension}`;

  const url = await generatePresignedUrl(bookFormat.content_url, {
    responseContentDisposition: `attachment; filename="${fileName}"`,
  });

  return { url, fileName, typeName: bookFormat.book_types.type_name, expiresIn: 3600 };
};

export {
  getBooksByGenre,
  getBookById,
  getMostReadBooks,
  getAllBooks,
  getBookPreview,
  getBookByKeyword,
  getAdminBooks,
  createBook,
  updateBook,
  deleteBook,
  deleteBooksBulk,
  getBookFormats,
  getBookReadUrl,
  getBookDownloadUrl,
};

export const bookService = {
  getBooksByGenre,
  getBookById,
  getMostReadBooks,
  getAllBooks,
  getBookPreview,
  getBookByKeyword,
  getAdminBooks,
  createBook,
  updateBook,
  deleteBook,
  deleteBooksBulk,
  getBookFormats,
  getBookReadUrl,
  getBookDownloadUrl,
};