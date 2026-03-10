import "dotenv/config";
/**
 * Extract and map authors from book_authors relation
 */
const mapAuthors = (bookAuthors) => {
  if (!Array.isArray(bookAuthors)) return [];
  
  return bookAuthors
    .filter(ba => ba?.authors?.author_id && ba?.authors?.author_name)
    .map(ba => ({
      authorId: ba.authors.author_id,
      authorName: ba.authors.author_name,
    }));
};

// /**
//  * Extract and map genres from book_genres relation
//  */
const mapGenres = (bookGenres) => {
  if (!Array.isArray(bookGenres)) return [];
    return bookGenres
    .filter(bg => bg?.genres?.genre_id && bg?.genres?.genre_name)
    .map(bg => ({
      genreId: bg.genres.genre_id,
      genreName: bg.genres.genre_name,
    }));
};

/**
 * Map base book fields (used by both list and detail)
 */
const mapBaseBookFields = (book) => ({
  bookId: book.book_id,
  title: book.title,
  coverImageUrl: book.cover_image_url,
  publicationYear: book.publication_year,
  authors: mapAuthors(book.book_authors),
});

/**
 * Transform single book to list response format
 */
const toBookListItem = (book) => {
  if (!book) return null;
  return mapBaseBookFields(book);
};

/**
 * Map ratings from Prisma entities to response format
 */
const mapRatings = (ratings) => {
  if (!Array.isArray(ratings)) return [];
  return ratings.map(r => ({
    ratingId: r.rating_id,
    value: r.rating_value,
    comment: r.comment ?? null,
    createdAt: r.created_at,
    userName: r.users?.full_name || r.users?.username || 'Ẩn danh',
    avatarUrl: r.users?.avatar_url ?? null,
  }));
};

/**
 * Transform single book to detail response format
 */
const toBookDetailItem = (book) => {
  if (!book) return null;

  const ratings = mapRatings(book.ratings);
  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0
    ? ratings.reduce((sum, r) => sum + r.value, 0) / totalReviews
    : 0;

  return {
    ...mapBaseBookFields(book),
    description: book.description,
    publisher: book.publisher,
    genres: mapGenres(book.book_genres),
    formats: book.book_formats ? book.book_formats.map(format => ({
      formatId: format.format_id?.toString() || null,
      typeName: format.book_types?.type_name || null,
    })) : [],
    isFav: book.isFav ?? false,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratings,
  };
};

const toBookSearchItem = (book) => {
  if (!book) return null;
  return {
    bookId: book.book_id,
    title: book.title,
    coverImageUrl: book.cover_image_url,
    authors: mapAuthors(book.book_authors),
  };
}

/** Transform single book to preview response format
 */
const toBookPreviewItem = (book) => {
  if (!book) return null;
  
  return {
    bookId: book.book_id,
    description: book.description,
    publicationYear: book.publication_year,
    coverImageUrl: book.cover_image_url,
    genres: mapGenres(book.book_genres),
    authors: mapAuthors(book.book_authors),
  };
};

/** Transform array of books to preview response format
 */
export const toBookPreviewResponse = (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookPreviewItem(books);

  return books.map(toBookPreviewItem).filter(Boolean);
};


/**
 * Transform array of books to list response format
 */
export const toBookListResponse = (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookListItem(books);
  
  return books.map(toBookListItem).filter(Boolean);
};

/**
 * Transform array of books to detail response format
 */
export const toBookDetailResponse = (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookDetailItem(books);

  return books.map(toBookDetailItem).filter(Boolean);
};

export const toBookSearchResponse =  (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookSearchItem(books);

  return books.map(toBookSearchItem).filter(Boolean);
}; 

// Export helper functions for use by other mappers
export { mapAuthors, mapGenres };